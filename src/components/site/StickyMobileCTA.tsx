import { Link } from "react-router-dom";

export function StickyMobileCTA() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-stone-divider bg-snow-canvas/95 p-3 backdrop-blur-xl sm:hidden">
      <a href="#contato" className="site-cta site-cta--line flex-1 justify-center py-3">
        Vendas
      </a>
      <Link to="/app/login" className="site-cta flex-1 justify-center py-3">
        Começar
      </Link>
    </div>
  );
}
