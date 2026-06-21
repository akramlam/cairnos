use std::process::Child;
use std::sync::Mutex;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::Manager;

/// Holds the spawned engine sidecar so we can shut it down with the app.
struct EngineState(Mutex<Option<Child>>);

/// Launch the bundled Node engine sidecar (release builds only). In dev the
/// engine is started by Tauri's `beforeDevCommand`, so we skip it there.
#[cfg(not(debug_assertions))]
fn spawn_engine(app: &tauri::App) -> Result<Child, Box<dyn std::error::Error>> {
    use std::fs::File;
    use std::process::{Command, Stdio};
    use tauri::path::BaseDirectory;

    let sidecar_raw = app.path().resolve("sidecar", BaseDirectory::Resource)?;
    // Tauri returns Windows extended-length paths (\\?\C:\...) which Node's module
    // loader chokes on (it reduces to lstat 'C:'). Strip the prefix to a plain path.
    let sidecar = {
        let s = sidecar_raw.to_string_lossy();
        std::path::PathBuf::from(s.strip_prefix(r"\\?\").unwrap_or(&s).to_string())
    };

    // The windowed app has no console, so the child must NOT inherit stdout/stderr
    // - writing to those broken handles crashes Node before it can bind. Redirect
    // engine output to a log file (also handy for troubleshooting).
    let log = sidecar.parent().unwrap_or(sidecar.as_path()).join("engine.log");
    let (out, err): (Stdio, Stdio) = match File::create(&log) {
        Ok(file) => {
            let cloned = file.try_clone().map(Stdio::from).unwrap_or_else(|_| Stdio::null());
            (Stdio::from(file), cloned)
        }
        Err(_) => (Stdio::null(), Stdio::null()),
    };

    let mut cmd = Command::new(sidecar.join("node.exe"));
    cmd.arg(sidecar.join("engine.cjs"))
        .current_dir(&sidecar)
        .env("CAIRN_MIGRATIONS_DIR", sidecar.join("migrations"))
        .stdout(out)
        .stderr(err);

    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x0800_0000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }

    Ok(cmd.spawn()?)
}

/// Bring the main window to the front (used by the tray).
fn show_main(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        // Single-instance MUST be registered first: a second launch (clicking the
        // icon/tray again) just reveals the already-running window instead of
        // spawning a second process that can't bind the engine port.
        .plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| show_main(app)))
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--hidden"]),
        ))
        .manage(EngineState(Mutex::new(None)))
        .setup(|app| {
            // Start the bundled engine (release only).
            #[cfg(not(debug_assertions))]
            {
                match spawn_engine(app) {
                    Ok(child) => {
                        app.state::<EngineState>().0.lock().unwrap().replace(child);
                    }
                    Err(error) => eprintln!("CairnOS: failed to start engine sidecar: {error}"),
                }
            }

            // System tray: left-click opens the window, right-click shows a menu.
            let open_item = MenuItem::with_id(app, "open", "Open CairnOS", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&open_item, &quit_item])?;
            TrayIconBuilder::with_id("cairn-tray")
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("CairnOS")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "open" => show_main(app),
                    "quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        show_main(tray.app_handle());
                    }
                })
                .build(app)?;

            // Closing the window hides it to the tray instead of quitting, so the
            // engine keeps running and reminders keep firing in the background.
            if let Some(window) = app.get_webview_window("main") {
                let hide_target = window.clone();
                window.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        let _ = hide_target.hide();
                    }
                });

                // Start hidden when launched at login (--hidden); otherwise show.
                let launched_hidden = std::env::args().any(|arg| arg == "--hidden");
                if !launched_hidden {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }

            // Run on login (release only).
            #[cfg(not(debug_assertions))]
            {
                use tauri_plugin_autostart::ManagerExt;
                let _ = app.autolaunch().enable();
            }

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building CairnOS");

    app.run(|app_handle, event| {
        if let tauri::RunEvent::Exit = event {
            if let Some(mut child) = app_handle.state::<EngineState>().0.lock().unwrap().take() {
                let _ = child.kill();
            }
        }
    });
}
