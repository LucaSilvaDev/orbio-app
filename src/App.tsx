import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { LoginPage } from "@/pages/Login";
import { Logo } from "@/components/brand/Logo";
import { PublicLayout } from "@/components/site/PublicLayout";
import { LandingPage } from "@/pages/site/LandingPage";
import { ThankYouPage } from "@/pages/site/ThankYouPage";
import { PrivacyPolicyPage } from "@/pages/site/PrivacyPolicyPage";
import { NotFoundPage } from "@/pages/site/NotFoundPage";
import { applyAppearance, FONTS, useUi } from "@/store/useUi";

// The personal appearance picker (Settings → Aparência, inside /app) is saved
// per-browser and, unlike auth/CRM data, isn't scoped by workspace. Without this,
// a visitor's own accent/theme customization from the logged-in app would leak
// onto the public marketing site the moment they navigate there client-side.
const BRAND_DEFAULT = {
  theme: "light" as const,
  accent: "#4a38f5",
  fontFamily: FONTS[0].value,
  inkColor: "",
};

function AppearanceEffect() {
  const { pathname } = useLocation();
  const theme = useUi((s) => s.theme);
  const accent = useUi((s) => s.accent);
  const fontFamily = useUi((s) => s.fontFamily);
  const inkColor = useUi((s) => s.inkColor);

  useEffect(() => {
    if (pathname.startsWith("/app")) {
      applyAppearance({ theme, accent, fontFamily, inkColor });
    } else {
      applyAppearance(BRAND_DEFAULT);
    }
  }, [pathname, theme, accent, fontFamily, inkColor]);

  return null;
}

const DashboardPage = lazy(() =>
  import("@/pages/Dashboard").then((m) => ({ default: m.DashboardPage })),
);
const PipelinePage = lazy(() =>
  import("@/pages/Pipeline").then((m) => ({ default: m.PipelinePage })),
);
const DealDetailPage = lazy(() =>
  import("@/pages/DealDetail").then((m) => ({ default: m.DealDetailPage })),
);
const ContactsPage = lazy(() =>
  import("@/pages/Contacts").then((m) => ({ default: m.ContactsPage })),
);
const ContactDetailPage = lazy(() =>
  import("@/pages/Contacts").then((m) => ({ default: m.ContactDetailPage })),
);
const CompaniesPage = lazy(() =>
  import("@/pages/Companies").then((m) => ({ default: m.CompaniesPage })),
);
const CompanyDetailPage = lazy(() =>
  import("@/pages/Companies").then((m) => ({ default: m.CompanyDetailPage })),
);
const LeadsPage = lazy(() =>
  import("@/pages/Leads").then((m) => ({ default: m.LeadsPage })),
);
const ActivitiesPage = lazy(() =>
  import("@/pages/Activities").then((m) => ({ default: m.ActivitiesPage })),
);
const CalendarPage = lazy(() =>
  import("@/pages/Calendar").then((m) => ({ default: m.CalendarPage })),
);
const NotesPage = lazy(() =>
  import("@/pages/Notes").then((m) => ({ default: m.NotesPage })),
);
const MapsPage = lazy(() =>
  import("@/pages/Maps").then((m) => ({ default: m.MapsPage })),
);
const InboxPage = lazy(() =>
  import("@/pages/Inbox").then((m) => ({ default: m.InboxPage })),
);
const ProductsPage = lazy(() =>
  import("@/pages/Products").then((m) => ({ default: m.ProductsPage })),
);
const InvoicesPage = lazy(() =>
  import("@/pages/Invoices").then((m) => ({ default: m.InvoicesPage })),
);
const CampaignsPage = lazy(() =>
  import("@/pages/Campaigns").then((m) => ({ default: m.CampaignsPage })),
);
const ReportsPage = lazy(() =>
  import("@/pages/Reports").then((m) => ({ default: m.ReportsPage })),
);
const DocumentsPage = lazy(() =>
  import("@/pages/Documents").then((m) => ({ default: m.DocumentsPage })),
);
const TeamPage = lazy(() =>
  import("@/pages/Team").then((m) => ({ default: m.TeamPage })),
);
const SettingsPage = lazy(() =>
  import("@/pages/Settings").then((m) => ({ default: m.SettingsPage })),
);
const VaultPage = lazy(() =>
  import("@/pages/Vault").then((m) => ({ default: m.VaultPage })),
);

function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Logo size={36} />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppearanceEffect />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Site público (institucional/comercial) */}
          <Route element={<PublicLayout />}>
            <Route index element={<LandingPage />} />
            <Route path="obrigado" element={<ThankYouPage />} />
            <Route path="privacidade" element={<PrivacyPolicyPage />} />
          </Route>

          {/* App logado */}
          <Route path="/app/login" element={<LoginPage />} />
          <Route path="/app" element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route index element={<DashboardPage />} />
              <Route path="pipeline" element={<PipelinePage />} />
              <Route path="pipeline/:id" element={<DealDetailPage />} />
              <Route path="contacts" element={<ContactsPage />} />
              <Route path="contacts/:id" element={<ContactDetailPage />} />
              <Route path="companies" element={<CompaniesPage />} />
              <Route path="companies/:id" element={<CompanyDetailPage />} />
              <Route path="leads" element={<LeadsPage />} />
              <Route path="activities" element={<ActivitiesPage />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="notes" element={<NotesPage />} />
              <Route path="maps" element={<MapsPage />} />
              <Route path="inbox" element={<InboxPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="invoices" element={<InvoicesPage />} />
              <Route path="campaigns" element={<CampaignsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="documents" element={<DocumentsPage />} />
              <Route path="vault" element={<VaultPage />} />
              <Route path="team" element={<TeamPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/app" replace />} />
            </Route>
          </Route>

          {/* 404 público */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
