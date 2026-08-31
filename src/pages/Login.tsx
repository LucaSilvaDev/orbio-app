import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Logo, OrbMark } from "@/components/brand/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/store/useAuth";
import { users } from "@/data/seed";
import { getWorkspace, switchWorkspace } from "@/lib/workspace";

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuth((s) => s.login);
  const register = useAuth((s) => s.register);
  const user = useAuth((s) => s.user);
  const signingIn = useAuth((s) => s.signingIn);
  const mode = getWorkspace();
  const isQa = mode === "demo";
  const [panel, setPanel] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState(mode === "demo" ? "ana@orbio.app.br" : "");
  const [password, setPassword] = useState(mode === "demo" ? "orbio" : "");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const env = new URLSearchParams(window.location.search);
    if (env.get("qa") === "1" && mode !== "demo") switchWorkspace("demo");
    if (env.get("prod") === "1" && mode !== "official") switchWorkspace("official");
  }, [mode]);

  useEffect(() => {
    if (user) navigate("/app", { replace: true });
  }, [user, navigate]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (mode === "official" && panel === "register") {
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
        setNotice("Conta criada! Confirme seu e-mail antes de entrar — te mandamos um link.");
        setPanel("login");
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
      <div className="login-vault">
        <div className="login-cover">
          <div className="login-brand">
            <span className="login-brand__water" aria-hidden>
              <OrbMark size={160} animated={false} />
            </span>
            <OrbMark size={88} />
          </div>
          <p className="login-kicker">Orbio</p>
          <p className="login-hint">
            {isQa ? "QA — dados fictícios para teste e pitch." : "Crie a conta ou entre neste workspace."}
          </p>
        </div>

        <div className="login-fold">
          <div className="login-fold__inner">
            <form className="login-reveal" onSubmit={onSubmit}>
              {mode === "official" && panel === "register" ? (
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
                  autoComplete={panel === "register" ? "new-password" : "current-password"}
                />
              </label>
              {mode === "official" && panel === "register" ? (
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
                    : panel === "register"
                      ? "CRM vazio. A conta fica só neste navegador até existir backend."
                      : "Use a conta criada neste workspace."}
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
              ) : (
                <button
                  type="button"
                  className="text-[12px] text-ash-helper underline-offset-2 hover:underline"
                  onClick={() => {
                    setError("");
                    setNotice("");
                    setPanel(panel === "register" ? "login" : "register");
                  }}
                >
                  {panel === "register" ? "Já tenho conta" : "Criar conta do zero"}
                </button>
              )}

              <button type="submit" disabled={signingIn} className="login-submit">
                {signingIn
                  ? "Abrindo…"
                  : !isQa && panel === "register"
                    ? "Criar e entrar"
                    : "Entrar"}
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                className="text-[11px] text-ash-helper/80 underline-offset-2 hover:underline"
                onClick={() => switchWorkspace(isQa ? "official" : "demo")}
              >
                {isQa ? "Ir para produção" : "Abrir QA"}
              </button>
            </form>
          </div>
        </div>
      </div>
      </motion.div>
    </div>
  );
}
