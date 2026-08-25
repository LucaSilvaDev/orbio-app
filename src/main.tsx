import { useEffect } from "react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/index.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { applyAppearance, useUi } from "@/store/useUi";
import { useAuth } from "@/store/useAuth";

function Root() {
  const theme = useUi((s) => s.theme);
  const accent = useUi((s) => s.accent);
  const fontFamily = useUi((s) => s.fontFamily);
  const inkColor = useUi((s) => s.inkColor);

  useEffect(() => {
    applyAppearance({ theme, accent, fontFamily, inkColor });
  }, [theme, accent, fontFamily, inkColor]);

  useEffect(() => useAuth.getState().init(), []);

  return <App />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <Root />
    </ErrorBoundary>
  </StrictMode>,
);
