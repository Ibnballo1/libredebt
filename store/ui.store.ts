/**
 * store/ui.store.ts — Ephemeral Client UI State Core
 *
 * Atomically manages client-side visually layout state configurations.
 * Bound to independent component rendering selectors to prevent cascading re-renders.
 * Excludes transactional business and financial data layers by design.
 */
import { create } from "zustand";

interface ModalMeta {
  targetId?: string;
  fallbackUrl?: string;
  // Extensible key-value dictionary for dynamic component injection
  // Use unknown to avoid unsafe any; callers should narrow types as needed.
  [key: string]: unknown;
}

type UIStore = {
  // ─── Sidebar Mobile Drawer Slice ──────────────────────────────────────────
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  // ─── Extensible Modals Engine Slice ───────────────────────────────────────
  openModal: string | null;
  modalMeta: ModalMeta | null;
  /** Opens modal with its assigned identifier ID and structural payload properties */
  openModalWith: (id: string, meta?: ModalMeta) => void;
  closeModal: () => void;

  // ─── Application Navigation Status Slice ──────────────────────────────────
  isNavigating: boolean;
  setNavigating: (navigating: boolean) => void;
};

export const useUIStore = create<UIStore>((set) => ({
  // ─── Sidebar Implementation ───────────────────────────────────────────────
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  // ─── Modals Implementation ────────────────────────────────────────────────
  openModal: null,
  modalMeta: null,
  openModalWith: (id, meta = undefined) =>
    set({ openModal: id, modalMeta: meta }),
  closeModal: () => set({ openModal: null, modalMeta: null }),

  // ─── Navigation Implementation ─────────────────────────────────────────────
  isNavigating: false,
  setNavigating: (navigating) => set({ isNavigating: navigating }),
}));

/**
 * Custom Subscription Selectors
 * Enforces strict component-level reactivity bounds for performance optimization.
 */
export const useSidebarState = () =>
  useUIStore((s) => ({
    open: s.sidebarOpen,
    set: s.setSidebarOpen,
    toggle: s.toggleSidebar,
  }));
export const useModalState = () =>
  useUIStore((s) => ({
    activeModal: s.openModal,
    meta: s.modalMeta,
    open: s.openModalWith,
    close: s.closeModal,
  }));
export const useNavigationState = () =>
  useUIStore((s) => ({
    isNavigating: s.isNavigating,
    setNavigating: s.setNavigating,
  }));
