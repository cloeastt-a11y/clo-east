import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PublicHeader } from './components/public/PublicHeader';
import { PublicCatalogPage } from './pages/public/PublicCatalogPage';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { AdminProductFormPage } from './pages/admin/AdminProductFormPage';
import { AdminCSVImportPage } from './pages/admin/AdminCSVImportPage';
import { AdminStockPage } from './pages/admin/AdminStockPage';
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage';
import { AdminTransactionsPage } from './pages/admin/AdminTransactionsPage';
import { AdminReportsPage } from './pages/admin/AdminReportsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage';
import { Product, StoreSettings } from './types';
import { getStoreSettings } from './services/settingsService';
import { MessageCircle, Instagram, ShoppingBag, ShieldCheck } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, isAdmin, loading } = useAuth();
  const [isAdminView, setIsAdminView] = useState<boolean>(false);
  const [adminTab, setAdminTab] = useState<string>('dashboard');
  const [productSubView, setProductSubView] = useState<'list' | 'create' | 'edit' | 'import'>('list');
  const [selectedProductToEdit, setSelectedProductToEdit] = useState<Product | null>(null);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);

  useEffect(() => {
    getStoreSettings().then(setStoreSettings);
  }, []);

  // Listen to hash for easy deep linking /admin
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash.startsWith('#/admin')) {
        setIsAdminView(true);
      } else {
        setIsAdminView(false);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleNavigateToAdmin = () => {
    window.location.hash = '#/admin';
    setIsAdminView(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToPublic = () => {
    // Clear hash without reload
    try {
      history.pushState('', document.title, window.location.pathname + window.location.search);
    } catch {
      window.location.hash = '';
    }
    setIsAdminView(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAdminTabChange = (tab: string) => {
    if (tab === 'products-new') {
      setAdminTab('products');
      setSelectedProductToEdit(null);
      setProductSubView('create');
    } else if (tab === 'products-import') {
      setAdminTab('products');
      setSelectedProductToEdit(null);
      setProductSubView('import');
    } else {
      setAdminTab(tab);
      setProductSubView('list');
      setSelectedProductToEdit(null);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getComputedActiveTab = () => {
    if (adminTab === 'products') {
      if (productSubView === 'create') return 'products-new';
      if (productSubView === 'import') return 'products-import';
      return 'products';
    }
    return adminTab as any;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F3EE] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#151515] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold uppercase tracking-widest text-[#151515]">
            Memuat CLO.EAST...
          </p>
        </div>
      </div>
    );
  }

  // Admin View Handling
  if (isAdminView) {
    if (!user || !isAdmin) {
      return (
        <AdminLoginPage
          onSuccess={() => {
            setIsAdminView(true);
            setAdminTab('dashboard');
          }}
          onLoginSuccess={() => {
            setIsAdminView(true);
            setAdminTab('dashboard');
          }}
          onBackToPublic={handleNavigateToPublic}
          onBackToCatalog={handleNavigateToPublic}
        />
      );
    }

    return (
      <AdminLayout
        activeTab={getComputedActiveTab()}
        onSelectTab={handleAdminTabChange}
        onOpenStorefront={handleNavigateToPublic}
        onExitAdmin={handleNavigateToPublic}
      >
        {/* Render Active Admin Tab Content */}
        {adminTab === 'dashboard' && (
          <AdminDashboardPage
            onNavigate={handleAdminTabChange}
            onNavigateTab={handleAdminTabChange}
          />
        )}

        {adminTab === 'products' && (
          <>
            {productSubView === 'list' && (
              <AdminProductsPage
                onAddNew={() => {
                  setSelectedProductToEdit(null);
                  setProductSubView('create');
                }}
                onEditProduct={(p) => {
                  setSelectedProductToEdit(p);
                  setProductSubView('edit');
                }}
                onImportCSV={() => setProductSubView('import')}
              />
            )}

            {(productSubView === 'create' || productSubView === 'edit') && (
              <AdminProductFormPage
                productToEdit={selectedProductToEdit}
                onBack={() => {
                  setProductSubView('list');
                  setSelectedProductToEdit(null);
                }}
                onSaved={() => {
                  setProductSubView('list');
                  setSelectedProductToEdit(null);
                }}
              />
            )}

            {productSubView === 'import' && (
              <AdminCSVImportPage
                onBack={() => setProductSubView('list')}
                onImportComplete={() => setProductSubView('list')}
              />
            )}
          </>
        )}

        {adminTab === 'stock' && <AdminStockPage />}
        {adminTab === 'categories' && <AdminCategoriesPage />}
        {adminTab === 'transactions' && <AdminTransactionsPage />}
        {adminTab === 'reports' && <AdminReportsPage />}
        {adminTab === 'settings' && <AdminSettingsPage />}
      </AdminLayout>
    );
  }

  // Public Storefront View
  return (
    <div className="min-h-screen bg-[#F3F3EE] flex flex-col font-sans text-[#151515] antialiased selection:bg-[#151515] selection:text-[#F8F8F4]">
      {/* Public Header */}
      <PublicHeader />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <PublicCatalogPage />
      </main>

      {/* Floating WhatsApp Quick Order Button */}
      {storeSettings?.whatsappNumber && (
        <a
          href={`https://wa.me/${storeSettings.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
            'Halo Admin CLO.EAST, saya ingin menanyakan katalog koleksi hijab terbaru...'
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-5 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-semibold text-xs tracking-wider uppercase shadow-2xl hover:scale-105 transition-all"
        >
          <MessageCircle className="w-5 h-5 fill-white" />
          <span className="hidden sm:inline">Tanya Admin WhatsApp</span>
        </a>
      )}

      {/* Public Footer */}
      <footer className="mt-20 border-t border-[#DCDCD5] bg-[#EAEAE3]/70 pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-[#DCDCD5]">
            {/* Brand column */}
            <div className="md:col-span-2 space-y-4">
              <h3 className="text-xl font-bold tracking-tight text-[#151515] uppercase">
                CLO.EAST
              </h3>
              <p className="text-xs text-[#6D6D68] leading-relaxed max-w-md">
                {storeSettings?.storeDescription ||
                  'Katalog hijab modest modern dengan kurasi palet warna lembut, material voal dan sutra pilihan, serta kenyamanan pemakaian sehari-hari.'}
              </p>
              <div className="flex items-center gap-4 text-xs font-semibold text-[#151515]">
                {storeSettings?.instagramHandle && (
                  <span className="flex items-center gap-1.5">
                    <Instagram className="w-4 h-4 text-[#6D6D68]" />
                    {storeSettings.instagramHandle}
                  </span>
                )}
                {storeSettings?.address && (
                  <span className="text-[#6D6D68]">
                    &bull; {storeSettings.address}
                  </span>
                )}
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#151515]">
                Koleksi & Marketplace
              </h4>
              <ul className="space-y-2 text-xs text-[#6D6D68]">
                <li>
                  <a href="#catalog" className="hover:text-[#151515] transition-colors">
                    Paris Jadul & Voal
                  </a>
                </li>
                <li>
                  <a href="#catalog" className="hover:text-[#151515] transition-colors">
                    Pashmina Silk & Jersey
                  </a>
                </li>
                {storeSettings?.shopeeUrl && (
                  <li>
                    <a
                      href={storeSettings.shopeeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#151515] transition-colors"
                    >
                      Official Shopee Store &rarr;
                    </a>
                  </li>
                )}
                {storeSettings?.tokopediaUrl && (
                  <li>
                    <a
                      href={storeSettings.tokopediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#151515] transition-colors"
                    >
                      Official Tokopedia Store &rarr;
                    </a>
                  </li>
                )}
              </ul>
            </div>

            {/* Management & Admin Portal */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#151515]">
                Akses Pengelola
              </h4>
              <p className="text-xs text-[#6D6D68]">
                Portal manajemen stok real-time, audit laba kotor, dan integrasi katalog.
              </p>
              <div>
                <button
                  onClick={handleNavigateToAdmin}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#151515] text-[#F8F8F4] hover:bg-[#2A2A2A] rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors shadow-xs"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Admin Portal</span>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom copyright */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#6D6D68]">
            <p>&copy; {new Date().getFullYear()} CLO.EAST. All rights reserved.</p>
            <p className="font-mono text-[10px]">
              Powered by Cloud Firestore & Firebase Auth
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
