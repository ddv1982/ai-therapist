/**
 * Dashboard Layout
 * Layout for main application pages (home, chat, reports, test)
 */

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="bg-background min-h-screen">
      <main className="h-screen">{children}</main>
    </div>
  );
}
