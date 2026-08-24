import React, { useState } from 'react';
import { AdminSidebar, AdminTab } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { useAuth } from '../../context/AuthContext';

interface AdminLayoutProps {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  onOpenStorefront?: () => void;
  onExitAdmin?: () => void;
  isRefreshing?: boolean;
  onRefreshData?: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  activeTab,
  onSelectTab,
  onOpenStorefront,
  onExitAdmin,
  isRefreshing,
  onRefreshData,
  children,
}) => {
  const handleExitToStorefront = () => {
    if (onOpenStorefront) {
      onOpenStorefront();
    } else if (onExitAdmin) {
      onExitAdmin();
    }
  };

  const { isAdmin, loading } = useAuth();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F3EE] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-8 h-8 border-2 border-[#151515] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs uppercase tracking-widest text-[#6D6D68] font-medium">
          Memeriksa autentikasi Firebase...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F3EE] flex flex-col lg:flex-row">
      {/* Desktop Left Sidebar */}
      <div className="hidden lg:block lg:w-64 shrink-0 h-screen sticky top-0">
        <AdminSidebar
          activeTab={activeTab}
          onSelectTab={onSelectTab}
          onOpenStorefront={handleExitToStorefront}
        />
      </div>

      {/* Mobile Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative z-10 w-72 h-full bg-[#F8F8F4] shadow-2xl">
            <AdminSidebar
              activeTab={activeTab}
              onSelectTab={onSelectTab}
              onOpenStorefront={handleExitToStorefront}
              isMobileDrawer={true}
              onCloseMobileDrawer={() => setMobileDrawerOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <AdminHeader
          activeTab={activeTab}
          onOpenMobileMenu={() => setMobileDrawerOpen(true)}
          onOpenStorefront={handleExitToStorefront}
          isRefreshing={isRefreshing}
          onRefreshData={onRefreshData}
        />

        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
