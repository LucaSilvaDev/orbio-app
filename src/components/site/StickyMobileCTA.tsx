import { Link } from "react-router-dom";

export function StickyMobileCTA() {
  return (
    <div className="glass fixed inset-x-3 bottom-3 z-40 flex gap-2 rounded-full p-1.5 sm:hidden">
      <a href="#contato" className="flex-1 rounded-full py-3 text-center text-[13px] font-medium text-midnight-ink">
        Falar com a gente
      </a>
      <Link
        to="/app/login?qa=1"
        className="flex-1 rounded-full bg-midnight-ink py-3 text-center text-[13px] font-medium text-snow-canvas"
      >
        Ver demonstração
      </Link>
    </div>
  );
}
