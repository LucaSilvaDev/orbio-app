export type WorkspaceMode = "demo" | "official";

const KEY = "orbio-workspace";

export function getWorkspace(): WorkspaceMode {
  return localStorage.getItem(KEY) === "demo" ? "demo" : "official";
}

export function envLabel(mode: WorkspaceMode = getWorkspace()) {
  return mode === "demo" ? "QA" : "Produção";
}

export function isOfficial() {
  return getWorkspace() === "official";
}

export function switchWorkspace(mode: WorkspaceMode) {
  localStorage.setItem(KEY, mode);
  window.location.assign(mode === "demo" ? "/app/login?qa=1" : "/app/login");
}

export const workspaceStorage = {
  getItem: (name: string) => {
    const scoped = localStorage.getItem(`${name}:${getWorkspace()}`);
    if (scoped) return scoped;
    if (getWorkspace() === "demo") return localStorage.getItem(name);
    return null;
  },
  setItem: (name: string, value: string) => {
    localStorage.setItem(`${name}:${getWorkspace()}`, value);
  },
  removeItem: (name: string) => {
    localStorage.removeItem(`${name}:${getWorkspace()}`);
    if (getWorkspace() === "demo") localStorage.removeItem(name);
  },
};

export function wipeOfficialWorkspace() {
  const doomed: string[] = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (key?.endsWith(":official")) doomed.push(key);
  }
  doomed.forEach((key) => localStorage.removeItem(key));
}

export function armShotMode() {
  if (new URLSearchParams(window.location.search).get("shot") === "1") {
    sessionStorage.setItem("orbio-shot", "1");
  }
}

export function isShotMode() {
  return sessionStorage.getItem("orbio-shot") === "1";
}
