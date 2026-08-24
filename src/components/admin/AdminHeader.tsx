import React from 'react';
import { Menu, Store, Plus, RefreshCw, Boxes } from 'lucide-react';
import { AdminTab } from './AdminSidebar';

interface AdminHeaderProps {
  activeTab: AdminTab;
  onOpenMobileMenu: () => void;
  onOpenStorefront: () => void;
  onQuickAction?: (action: string) => void;
  isRefreshing?: boolean;
  onRefreshData?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  activeTab,
  onOpenMobileMenu,
  onOpenStorefront,
  onQuickAction,
  isRefreshing = false,
  onRefreshData,
}) => {
  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Ringkasan Dashboard';
      case 'products':
        return 'Katalog Produk & Inventori';
      case 'products-new':
        return 'Tambah Produk Baru (Bulk Entry)';
      case 'products-import':
        return 'Import Produk dari CSV';
      case 'stock':
        return 'Update Cepat Stok (Quick Stock)';
      case 'categories':
        return 'Manajemen Kategori Hijab';
      case 'transactions':
        return 'Riwayat Transaksi Stok & Penjualan';
      case 'reports':
        return 'Laporan Penjualan & Margin Profit';
      case 'settings':
        return 'Pengaturan Toko & Marketplace';
      default:
        return 'Admin Panel';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-[#F8F8F4]/90 backdrop-blur-md border-b border-[#DCDCD5] px-4 sm:px-8 py-3.5 flex items-center justify-between transition-all">
      {/* Left: Mobile Menu & Tab Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 text-[#151515] hover:bg-[#E7E7E0] rounded-xl transition-colors"
          aria-label="Buka menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-[#151515] tracking-tight">
            {getTitle()}
          </h1>
          <p className="text-[11px] text-[#6D6D68] hidden sm:block">
            Sistem Manajemen Katalog & Stok CLO.EAST
          </p>
        </div>
      </div>

      {/* Right: Quick Action Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {onRefreshData && (
          <button
            onClick={onRefreshData}
            disabled={isRefreshing}
            title="Refresh Data dari Firebase"
            className="p-2 text-[#6D6D68] hover:text-[#151515] hover:bg-[#E7E7E0] border border-[#DCDCD5] rounded-xl transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#151515]' : ''}`} />
          </button>
        )}

        <button
          onClick={onOpenStorefront}
          className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#151515] bg-[#E7E7E0] hover:bg-[#DCDCD5] rounded-xl transition-colors"
        >
          <Store className="w-3.5 h-3.5 text-[#6D6D68]" />
          <span>Lihat Katalog Publik</span>
        </button>
      </div>
    </header>
  );
};
