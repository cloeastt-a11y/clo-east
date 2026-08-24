import React, { useState } from 'react';
import { Search, Menu, X } from 'lucide-react';

interface PublicHeaderProps {
  onOpenSearch?: () => void;
  onNavigate?: (view: 'catalog' | 'categories') => void;
  currentView?: string;
}

export const PublicHeader: React.FC<PublicHeaderProps> = ({
  onOpenSearch,
  onNavigate,
  currentView = 'catalog',
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (view: 'catalog' | 'categories') => {
    if (onNavigate) {
      onNavigate(view);
    } else {
      const el = document.getElementById(view === 'categories' ? 'categories-section' : 'catalog');
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSearch = () => {
    if (onOpenSearch) {
      onOpenSearch();
    } else {
      const input = document.querySelector('input[type="text"]') as HTMLInputElement;
      input?.focus();
      input?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#F3F3EE]/90 backdrop-blur-md border-b border-[#DCDCD5] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        {/* Mobile menu trigger */}
        <div className="flex items-center lg:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#151515] hover:bg-[#E7E7E0] rounded-xl transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => handleNav('catalog')}
            className="text-2xl sm:text-3xl font-bold tracking-widest text-[#151515] hover:opacity-85 transition-opacity font-heading uppercase"
          >
            CLO.EAST
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8 pl-6 border-l border-[#DCDCD5]">
            <button
              onClick={() => handleNav('catalog')}
              className={`text-sm font-medium tracking-wide transition-colors ${
                currentView === 'catalog'
                  ? 'text-[#151515] border-b-2 border-[#151515] pb-0.5 font-semibold'
                  : 'text-[#6D6D68] hover:text-[#151515]'
              }`}
            >
              Koleksi Produk
            </button>
            <button
              onClick={() => handleNav('categories')}
              className={`text-sm font-medium tracking-wide transition-colors ${
                currentView === 'categories'
                  ? 'text-[#151515] border-b-2 border-[#151515] pb-0.5 font-semibold'
                  : 'text-[#6D6D68] hover:text-[#151515]'
              }`}
            >
              Kategori
            </button>
          </nav>
        </div>

        {/* Action icons: Search only */}
        <div className="flex items-center gap-3">
          {/* Quick Search */}
          <button
            onClick={handleSearch}
            className="flex items-center gap-2 px-3.5 py-2 text-sm text-[#6D6D68] hover:text-[#151515] bg-[#F8F8F4] hover:bg-[#E7E7E0] border border-[#DCDCD5] rounded-full transition-all shadow-2xs"
            aria-label="Cari produk"
          >
            <Search className="w-4 h-4 text-[#6D6D68]" />
            <span className="hidden md:inline text-xs font-semibold tracking-wider uppercase">CARI</span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#DCDCD5] bg-[#F8F8F4] px-6 py-5 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col space-y-3">
            <button
              onClick={() => {
                handleNav('catalog');
                setMobileMenuOpen(false);
              }}
              className="text-left text-base font-medium text-[#151515] py-1"
            >
              Koleksi Produk (Catalog)
            </button>
            <button
              onClick={() => {
                handleNav('categories');
                setMobileMenuOpen(false);
              }}
              className="text-left text-base font-medium text-[#151515] py-1"
            >
              Kategori Hijab
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
