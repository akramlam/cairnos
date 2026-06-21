import { create } from 'zustand';
import type { Task } from '@cairn/shared';

interface UiState {
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
  toggleCommand: () => void;

  quickCaptureOpen: boolean;
  setQuickCaptureOpen: (open: boolean) => void;

  newTaskOpen: boolean;
  setNewTaskOpen: (open: boolean) => void;

  /** When set, the task dialog opens in edit mode prefilled with this task. */
  editingTask: Task | null;
  setEditingTask: (task: Task | null) => void;

  newProjectOpen: boolean;
  setNewProjectOpen: (open: boolean) => void;

  /** The in-app guided feature tour. */
  tourOpen: boolean;
  setTourOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  commandOpen: false,
  setCommandOpen: (commandOpen) => set({ commandOpen }),
  toggleCommand: () => set((s) => ({ commandOpen: !s.commandOpen })),

  quickCaptureOpen: false,
  setQuickCaptureOpen: (quickCaptureOpen) => set({ quickCaptureOpen }),

  newTaskOpen: false,
  setNewTaskOpen: (newTaskOpen) => set({ newTaskOpen }),

  editingTask: null,
  setEditingTask: (editingTask) => set({ editingTask }),

  newProjectOpen: false,
  setNewProjectOpen: (newProjectOpen) => set({ newProjectOpen }),

  tourOpen: false,
  setTourOpen: (tourOpen) => set({ tourOpen }),
}));
