import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";

export function StickyMobileCTA() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-stone-divider bg-snow-canvas/95 p-3 shadow-lift backdrop-blur-xl sm:hidden">
      <a href="#contato" className="flex-1">
        <Button variant="outline" className="w-full">
          Falar com vendas
        </Button>
      </a>
      <Link to="/app/login" className="flex-1">
        <Button variant="accent" className="w-full">
          Começar agora
        </Button>
      </Link>
    </div>
  );
}
