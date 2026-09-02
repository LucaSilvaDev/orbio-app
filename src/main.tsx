import { useEffect } from "react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/index.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useAuth } from "@/store/useAuth";
import { armShotMode } from "@/lib/workspace";

function Root() {
  useEffect(() => {
    armShotMode();
    return useAuth.getState().init();
  }, []);

  return <App />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <Root />
    </ErrorBoundary>
  </StrictMode>,
);
