import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Github,
  HardDriveDownload,
  Lock,
  ShieldCheck,
  Sparkles,
  Workflow,
  Zap,
} from 'lucide-react';
import { CairnLogo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/button';

const FEATURES = [
  {
    icon: HardDriveDownload,
    title: 'Local-first by design',
    body: 'Your data lives in a SQLite file on your machine. No cloud, no account, no lock-in - it works fully offline.',
  },
  {
    icon: Sparkles,
    title: 'AI-powered organization',
    body: 'A brain dump becomes structured tasks, ideas, notes, and reminders - with due dates and priorities detected automatically.',
  },
  {
    icon: Zap,
    title: 'From idea to action',
    body: 'Capture in seconds, review in one glance, and turn the chaos in your head into a plan you can actually execute.',
  },
  {
    icon: ShieldCheck,
    title: 'Private & secure',
    body: 'Nothing leaves your device. Export everything as JSON anytime. A local MCP server lets Claude work on your data, privately.',
  },
];

const NAV = ['Features', 'Security', 'Pricing', 'Docs', 'Changelog'];

export function Landing() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Navbar */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/50 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <CairnLogo />
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            {NAV.map((item) => (
              <a key={item} href="#features" className="transition-colors hover:text-foreground">
                {item}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/">Log in</Link>
            </Button>
            <Button asChild variant="brand" size="sm">
              <Link to="/">Get CairnOS</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-6 pb-10 pt-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-foreground/[0.03] px-3 py-1 text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            Local-first · Private · Powered by your own AI
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            Turn chaos into <span className="text-gradient">action.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            CairnOS is a local-first AI productivity app that turns messy ideas into organized
            projects, tasks, notes, and reminders.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild variant="brand" size="lg" className="gap-2">
              <Link to="/">
                <HardDriveDownload className="size-4" /> Get CairnOS
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2">
              <a href="#features">
                Explore features <ArrowRight className="size-4" />
              </a>
            </Button>
          </div>
        </motion.div>

        {/* Product screenshot */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto mt-16 max-w-5xl"
        >
          <div className="pointer-events-none absolute -inset-x-10 -top-10 -z-10 h-72 bg-[radial-gradient(50%_60%_at_50%_0%,rgba(99,102,241,0.35),transparent_70%)] blur-2xl" />
          <div className="overflow-hidden rounded-2xl border border-border ring-glow">
            <img src="/preview.png" alt="CairnOS dashboard" className="block w-full" />
          </div>
        </motion.div>

        <p className="mt-10 text-xs uppercase tracking-wider text-muted-foreground/60">
          Built with Tauri · React · SQLite · Drizzle · MCP
        </p>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight">Everything in its right place</h2>
          <p className="mt-3 text-muted-foreground">
            One quiet, fast, private workspace for the way your mind actually works.
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="glass card-hover rounded-2xl p-6"
            >
              <div className="flex size-11 items-center justify-center rounded-xl brand-gradient">
                <f.icon className="size-5 text-white" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="glass relative overflow-hidden rounded-3xl p-12 text-center">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_120%_at_50%_0%,rgba(59,130,246,0.25),transparent_70%)]" />
          <Workflow className="mx-auto size-8 text-primary" />
          <h2 className="mt-4 text-3xl font-semibold tracking-tight">
            Stop juggling. Start shipping.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Capture the noise, let CairnOS organize it, and get back to doing the work that matters.
          </p>
          <Button asChild variant="brand" size="lg" className="mt-6 gap-2">
            <Link to="/">
              <Lock className="size-4" /> Open CairnOS
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 sm:flex-row">
          <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <CairnLogo />
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} CairnOS · Turn chaos into action.
          </p>
          <a
            href="#"
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Github className="size-4" /> Source
          </a>
        </div>
      </footer>
    </div>
  );
}
