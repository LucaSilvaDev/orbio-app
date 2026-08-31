import { useEffect, useState } from "react";
import { loadGoogleAnalytics } from "@/lib/analytics";

const KEY = "orbio-cookie-consent";
type Consent = "accepted" | "rejected";

const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;

export function useCookieConsent() {
  const [consent, setConsent] = useState<Consent | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(KEY) as Consent | null;
    setConsent(stored);
    if (stored === "accepted" && gaId) loadGoogleAnalytics(gaId);
  }, []);

  function accept() {
    localStorage.setItem(KEY, "accepted");
    setConsent("accepted");
    if (gaId) loadGoogleAnalytics(gaId);
  }

  function reject() {
    localStorage.setItem(KEY, "rejected");
    setConsent("rejected");
  }

  return { consent, accept, reject, analyticsEnabled: Boolean(gaId) };
}
