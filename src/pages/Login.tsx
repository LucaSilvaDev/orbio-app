import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Logo, OrbMark } from "@/components/brand/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/store/useAuth";
import { users } from "@/data/seed";
import { getWorkspace, switchWorkspace, armShotMode } from "@/lib/workspace";

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuth((s) => s.login);
  const register = useAuth((s) => s.register);
  const user = useAuth((s) => s.user);
  const signingIn = useAuth((s) => s.signingIn);
  const mode = getWorkspace();
  const isQa = mode === "demo";
  const [invited, setInvited] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState(mode === "demo" ? "ana@orbio.app.br" : "");
  const [password, setPassword] = useState(mode === "demo" ? "orbio" : "");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [vaultOpen, setVaultOpen] = useState(false);

  useEffect(() => {
    const env = new URLSearchParams(window.location.search);
    if (env.get("shot") === "1") armShotMode();
    if (env.get("invite")) sessionStorage.setItem("orbio-invite", env.get("invite") ?? "");
    if (sessionStorage.getItem("orbio-invite")) {
      setInvited(true);
      setNotice("Convite do workspace. Ative o acesso com o mesmo e-mail.");
    }
    if (env.get("qa") === "1" && mode !== "demo") switchWorkspace("demo");
    if ((env.get("prod") === "1" || env.get("invite")) && mode !== "official") {
      switchWorkspace("official");
    }
  }, [mode]);

  useEffect(() => {
    if (user) navigate("/app", { replace: true });
  }, [user, navigate]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (mode === "official" && invited) {
      if (password !== confirm) {
        setError("As senhas não batem.");
        return;
      }
      const result = await register(name, email, password);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.needsConfirmation) {
        setNotice("Acesso criado. Confirme o e-mail antes de entrar.");
        setInvited(false);
        return;
      }
      navigate("/app");
      return;
    }
    const fail = await login(email, password);
    if (fail) {
      setError(fail);
      return;
    }
    navigate("/app");
  }

  return (
    <div className="login-flow relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="login-flow__glow" />
      <div className="login-flow__glow login-flow__glow--two" />

      <div className="pointer-events-none absolute top-6 left-6">
        <Logo wordmark size={22} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 22, filter: "blur(12px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-[1] w-full max-w-[400px]"
      >
        <div
          className={`login-vault${vaultOpen ? " is-open" : ""}`}
          onMouseEnter={() => setVaultOpen(true)}
          onMouseLeave={(event) => {
            const next = event.relatedTarget;
            if (next instanceof Node && event.currentTarget.contains(next)) return;
            if (event.currentTarget.contains(document.activeElement)) return;
            setVaultOpen(false);
          }}
          onFocusCapture={() => setVaultOpen(true)}
          onBlurCapture={(event) => {
            const next = event.relatedTarget;
            if (next instanceof Node && event.currentTarget.contains(next)) return;
            setVaultOpen(false);
          }}
        >
          <div className="login-cover">
            <OrbMark size={88} className="mx-auto" />
            <p className="login-kicker">Orbio</p>
            <p className="login-hint">
              {isQa
                ? "QA — dados fictícios para teste e pitch."
                : invited
                  ? "Ative o acesso convidado neste workspace."
                  : "Acesso por assinatura. Passe o mouse para entrar."}
            </p>
          </div>

          <form className="login-reveal" onSubmit={onSubmit}>
            <div className="login-reveal__inner">
              {mode === "official" && invited ? (
                <label className="login-field">
                  <span>Nome</span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </label>
              ) : null}

              <label className="login-field">
                <span>E-mail</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="username"
                />
              </label>
              <label className="login-field">
                <span>Senha</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={invited ? "new-password" : "current-password"}
                />
              </label>
              {mode === "official" && invited ? (
                <label className="login-field">
                  <span>Confirmar senha</span>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </label>
              ) : null}

              {error ? (
                <p className="text-center text-[12px] text-rose-500">{error}</p>
              ) : notice ? (
                <p className="text-center text-[12px] text-emerald-600">{notice}</p>
              ) : (
                <p className="text-center text-[11px] text-ash-helper">
                  {isQa
                    ? "Elenco fictício · senha qualquer"
                    : invited
                      ? "Só entra quem foi convidado neste workspace."
                      : "Use a conta provisionada para esta empresa."}
                </p>
              )}

              {mode === "demo" ? (
                <div className="flex flex-wrap justify-center gap-1.5">
                  {users.map((person) => (
                    <button
                      key={person.id}
                      type="button"
                      onClick={() => setEmail(person.email)}
                      className={`flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] transition ${
                        email === person.email
                          ? "bg-midnight-ink text-snow-canvas"
                          : "bg-fog-surface text-graphite-body hover:bg-lavender-wash"
                      }`}
                    >
                      <Avatar initials={person.initials} hue={person.avatarHue} size="sm" />
                      {person.name.split(" ")[0]}
                    </button>
                  ))}
                </div>
              ) : null}

              <button type="submit" disabled={signingIn} className="login-submit">
                {signingIn ? "Abrindo…" : invited ? "Ativar acesso" : "Entrar"}
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                className="text-[11px] text-ash-helper/80 underline-offset-2 hover:underline"
                onClick={() => switchWorkspace(isQa ? "official" : "demo")}
              >
                {isQa ? "Ir para produção" : "Abrir QA"}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
