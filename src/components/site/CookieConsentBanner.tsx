import { useCookieConsent } from "@/hooks/useCookieConsent";
import { Button } from "@/components/ui/Button";

export function CookieConsentBanner() {
  const { consent, accept, reject, analyticsEnabled } = useCookieConsent();

  if (!analyticsEnabled || consent !== null) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col gap-3 border-t border-stone-divider bg-snow-canvas/95 p-4 shadow-lift backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
      <p className="text-[12px] text-graphite-body">
        Usamos cookies de análise para entender como o site é usado. Você pode aceitar ou
        recusar — isso não muda o funcionamento do produto.{" "}
        <a href="/privacidade" className="text-royal-signal underline-offset-2 hover:underline">
          Leia a política de privacidade
        </a>
        .
      </p>
      <div className="flex shrink-0 gap-2">
        <Button variant="soft" size="sm" onClick={reject}>
          Recusar
        </Button>
        <Button variant="accent" size="sm" onClick={accept}>
          Aceitar
        </Button>
      </div>
    </div>
  );
}
