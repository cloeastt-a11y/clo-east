import React from 'react';
import {
  LayoutDashboard,
  Package,
  Boxes,
  FolderTree,
  Receipt,
  BarChart3,
  Settings,
  Store,
  LogOut,
  PlusCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type AdminTab =
  | 'dashboard'
  | 'products'
  | 'products-new'
  | 'products-import'
  | 'stock'
  | 'categories'
  | 'transactions'
  | 'reports'
  | 'settings';

interface AdminSidebarProps {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  onOpenStorefront: () => void;
  isMobileDrawer?: boolean;
  onCloseMobileDrawer?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  onSelectTab,
  onOpenStorefront,
  isMobileDrawer = false,
  onCloseMobileDrawer,
}) => {
  const { adminUser, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Produk (Products)', icon: Package },
    { id: 'stock', label: 'Update Stok', icon: Boxes },
    { id: 'categories', label: 'Kategori', icon: FolderTree },
    { id: 'transactions', label: 'Transaksi Stok', icon: Receipt },
    { id: 'reports', label: 'Laporan & Profit', icon: BarChart3 },
    { id: 'settings', label: 'Pengaturan', icon: Settings },
  ];

  const handleNav = (tabId: AdminTab) => {
    onSelectTab(tabId);
    if (isMobileDrawer && onCloseMobileDrawer) {
      onCloseMobileDrawer();
    }
  };

  return (
    <aside
      className={`w-64 bg-[#F8F8F4] border-r border-[#DCDCD5] flex flex-col justify-between h-full ${
        isMobileDrawer ? 'p-5' : 'p-6'
      }`}
    >
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#DCDCD5]">
          <div>
            <span className="text-xl font-bold tracking-widest text-[#151515] uppercase font-heading">
              CLO.EAST
            </span>
            <p className="text-[10px] tracking-wider text-[#6D6D68] uppercase font-medium mt-0.5">
              Inventory & Catalog
            </p>
          </div>
        </div>

        {/* Quick Action Shortcuts */}
        <div className="flex flex-col gap-1.5 pb-2">
          <button
            onClick={() => handleNav('products-new')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              activeTab === 'products-new'
                ? 'bg-[#151515] text-[#F8F8F4]'
                : 'bg-[#E7E7E0] hover:bg-[#DCDCD5] text-[#151515]'
            }`}
          >
            <PlusCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>+ Tambah Produk Baru</span>
          </button>

          <button
            onClick={() => handleNav('products-import')}
            className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'products-import'
                ? 'bg-[#151515] text-[#F8F8F4] font-semibold shadow-xs'
                : 'text-[#6D6D68] hover:text-[#151515] hover:bg-[#E7E7E0]'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
            <span>Import CSV Produk</span>
          </button>
        </div>

        {/* Main Navigation */}
        <nav className="space-y-1">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-[#6D6D68]">
            Menu Utama
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id as AdminTab)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium tracking-wide transition-all text-left ${
                  isActive
                    ? 'bg-[#151515] text-[#F8F8F4] font-semibold shadow-xs'
                    : 'text-[#6D6D68] hover:text-[#151515] hover:bg-[#E7E7E0]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Storefront Link & Admin Profile */}
      <div className="pt-6 border-t border-[#DCDCD5] space-y-3">
        {/* Switch to Public Storefront */}
        <button
          onClick={onOpenStorefront}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-[#151515] bg-[#E7E7E0] hover:bg-[#DCDCD5] rounded-xl transition-all shadow-xs"
        >
          <Store className="w-4 h-4 text-[#151515]" />
          <span>Lihat Katalog Publik</span>
        </button>

        {/* Admin Info & Logout */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex flex-col min-w-0 pr-2">
            <span className="text-xs font-semibold text-[#151515] truncate">
              {adminUser?.displayName || adminUser?.username || 'Admin'}
            </span>
            <span className="text-[10px] text-[#6D6D68] truncate font-mono">
              @{adminUser?.username || 'cloeastbatim'}
            </span>
          </div>

          <button
            onClick={async () => {
              await logout();
              onOpenStorefront();
            }}
            title="Keluar (Logout) & Kembali ke Katalog"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-red-700 hover:text-red-800 hover:bg-red-50 border border-red-200/60 rounded-lg transition-colors shrink-0"
            aria-label="Logout"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
