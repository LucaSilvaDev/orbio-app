import { useState } from "react";
import { Moon, SlidersHorizontal, Sun } from "lucide-react";
import { ACCENTS, FONTS, INKS, useUi } from "@/store/useUi";
import { useDismiss } from "@/hooks/useDismiss";

export function AppearanceControl() {
  const [open, setOpen] = useState(false);
  const rootRef = useDismiss(() => setOpen(false), open);
  const theme = useUi((s) => s.theme);
  const setTheme = useUi((s) => s.setTheme);
  const accent = useUi((s) => s.accent);
  const setAccent = useUi((s) => s.setAccent);
  const fontFamily = useUi((s) => s.fontFamily);
  const setFontFamily = useUi((s) => s.setFontFamily);
  const inkColor = useUi((s) => s.inkColor);
  const setInkColor = useUi((s) => s.setInkColor);

  return (
    <div className="relative" ref={rootRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-input hover:bg-fog-surface"
        aria-label="Aparência"
      >
        <SlidersHorizontal className="h-4 w-4" />
      </button>
      {open ? (
        <div className="absolute top-10 right-0 z-40 w-72 rounded-[24px] bg-snow-canvas/90 p-3 shadow-lift backdrop-blur-xl">
          <div className="mb-3 flex gap-1">
            {(["light", "dark"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setTheme(mode)}
                className={`flex h-7 flex-1 items-center justify-center gap-1 rounded-input text-[12px] ${
                  theme === mode ? "bg-fog-surface text-midnight-ink" : "text-ash-helper"
                }`}
              >
                {mode === "dark" ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
                {mode === "dark" ? "Escuro" : "Claro"}
              </button>
            ))}
          </div>
          <p className="mono mb-2 text-[10px] text-ash-helper">Acento</p>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {ACCENTS.map((item) => (
              <button
                key={item.id}
                title={item.label}
                onClick={() => setAccent(item.value)}
                className="h-5 w-5 rounded-full"
                style={{
                  background: item.value,
                  outline: accent === item.value ? "2px solid var(--ink)" : undefined,
                  outlineOffset: 1,
                }}
              />
            ))}
          </div>
          <label className="mb-2 block">
            <span className="mono mb-1 block text-[10px] text-ash-helper">Fonte</span>
            <select
              value={fontFamily}
              onChange={(event) => setFontFamily(event.target.value)}
              className="h-10 w-full rounded-pill bg-fog-surface px-3 text-[12px]"
            >
              {FONTS.map((font) => (
                <option key={font.id} value={font.value}>
                  {font.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mono mb-1 block text-[10px] text-ash-helper">Cor do texto</span>
            <select
              value={inkColor}
              onChange={(event) => setInkColor(event.target.value)}
              className="h-10 w-full rounded-pill bg-fog-surface px-3 text-[12px]"
            >
              {INKS.map((ink) => (
                <option key={ink.id} value={ink.value}>
                  {ink.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}
    </div>
  );
}
