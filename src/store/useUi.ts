import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeMode = "light" | "dark";
export type ViewMode = "board" | "list" | "table" | "calendar";
export type LogoVariant = "orbit" | "pulse" | "trio" | "loop" | "rings";

export const ACCENTS = [
  { id: "twenty", label: "Twenty", value: "#4a38f5" },
  { id: "ink", label: "Ink", value: "#1c1c1c" },
  { id: "blue", label: "Blue", value: "#1961ed" },
  { id: "pink", label: "Pink", value: "#e151af" },
  { id: "green", label: "Green", value: "#2ee47a" },
  { id: "yellow", label: "Yellow", value: "#f2ae40" },
] as const;

export const FONTS = [
  { id: "inter", label: "Inter", value: '"Inter", ui-sans-serif, system-ui, sans-serif' },
  { id: "newsreader", label: "Newsreader", value: '"Newsreader", "Times New Roman", serif' },
  { id: "plex", label: "IBM Plex Mono", value: '"IBM Plex Mono", ui-monospace, monospace' },
] as const;

export const INKS = [
  { id: "auto", label: "Automática", value: "" },
  { id: "ink", label: "Ink", value: "#090c1d" },
  { id: "bone", label: "Bone", value: "#f1f0ec" },
  { id: "carbon", label: "Carbon", value: "#202020" },
  { id: "plum", label: "Plum", value: "#d0c9c4" },
] as const;

type UiState = {
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
  toast: string | null;
  pushToast: (message: string) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  accent: string;
  setAccent: (accent: string) => void;
  fontFamily: string;
  setFontFamily: (font: string) => void;
  inkColor: string;
  setInkColor: (color: string) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  logoVariant: LogoVariant;
  setLogoVariant: (variant: LogoVariant) => void;
};

export function applyAppearance(state: {
  theme: ThemeMode;
  accent: string;
  fontFamily: string;
  inkColor: string;
}) {
  const root = document.documentElement;
  root.dataset.theme = state.theme;
  root.style.setProperty("--accent", state.accent);
  root.style.setProperty("--font-body", state.fontFamily);
  root.style.setProperty("--font-sans", state.fontFamily);
  if (state.inkColor) {
    root.style.setProperty("--ink-override", state.inkColor);
  } else {
    root.style.removeProperty("--ink-override");
  }
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", state.theme === "dark" ? "#191919" : "#ffffff");
}

export const useUi = create<UiState>()(
  persist(
    (set, get) => ({
      commandOpen: false,
      setCommandOpen: (open) => set({ commandOpen: open }),
      toast: null,
      pushToast: (message) => {
        set({ toast: message });
        window.setTimeout(() => set({ toast: null }), 2400);
      },
      sidebarCollapsed: false,
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      theme: "light",
      setTheme: (theme) => {
        set({ theme });
        const next = get();
        applyAppearance(next);
      },
      accent: "#4a38f5",
      setAccent: (accent) => {
        set({ accent });
        applyAppearance(get());
      },
      fontFamily: FONTS[0].value,
      setFontFamily: (fontFamily) => {
        set({ fontFamily });
        applyAppearance(get());
      },
      inkColor: "",
      setInkColor: (inkColor) => {
        set({ inkColor });
        applyAppearance(get());
      },
      viewMode: "table",
      setViewMode: (viewMode) => set({ viewMode }),
      logoVariant: "trio",
      setLogoVariant: (logoVariant) => set({ logoVariant }),
    }),
    {
      name: "orbio-theme-twenty",
      version: 3,
      migrate: (persisted) => {
        const state = persisted as { logoVariant?: LogoVariant };
        return { ...state, logoVariant: "trio" };
      },
      partialize: (state) => ({
        theme: state.theme,
        accent: state.accent,
        fontFamily: state.fontFamily,
        inkColor: state.inkColor,
        viewMode: state.viewMode,
        sidebarCollapsed: state.sidebarCollapsed,
        logoVariant: state.logoVariant,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) applyAppearance(state);
      },
    },
  ),
);
