import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowRight, Loader2 } from 'lucide-react';
import { Product } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSelectProduct: (product: Product) => void;
}

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({
  isOpen,
  onClose,
  products,
  onSelectProduct,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredProducts = searchTerm.trim()
    ? products.filter((p) => {
        const query = searchTerm.toLowerCase();
        return (
          p.name.toLowerCase().includes(query) ||
          p.categoryName?.toLowerCase().includes(query) ||
          p.colors?.some((c) => c.name.toLowerCase().includes(query))
        );
      })
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 pt-16 sm:pt-24 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-2xl bg-[#F8F8F4] border border-[#DCDCD5] rounded-2xl shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#DCDCD5] bg-[#F3F3EE]">
          <Search className="w-5 h-5 text-[#6D6D68] mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari hijab, model, kategori, atau warna..."
            className="w-full bg-transparent border-none text-base text-[#151515] placeholder:text-[#6D6D68] focus:outline-hidden"
          />
          <button
            onClick={onClose}
            className="p-1 text-[#6D6D68] hover:text-[#151515] rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-2">
          {searchTerm.trim() === '' ? (
            <div className="py-8 text-center text-xs uppercase tracking-widest text-[#6D6D68]">
              Ketik nama hijab (cth: Paris Jadul, Pashmina Silk, Moca...)
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-12 text-center text-sm text-[#6D6D68]">
              Tidak ada produk yang cocok dengan "{searchTerm}"
            </div>
          ) : (
            filteredProducts.map((prod) => (
              <button
                key={prod.id}
                onClick={() => {
                  onSelectProduct(prod);
                  onClose();
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-[#E7E7E0] transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-14 bg-[#E7E7E0] rounded-lg overflow-hidden shrink-0 border border-[#DCDCD5]">
                    {prod.imageUrl ? (
                      <img
                        src={prod.imageUrl}
                        alt={prod.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-[#6D6D68]">
                        CLO
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#151515] uppercase tracking-tight">
                      {prod.name}
                    </h4>
                    <p className="text-xs text-[#6D6D68]">
                      {prod.categoryName} &bull; {formatCurrency(prod.price)}
                    </p>
                    {prod.colors && prod.colors.length > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        {prod.colors.slice(0, 4).map((c, i) => (
                          <span
                            key={i}
                            className="w-2 h-2 rounded-full border border-black/20 inline-block"
                            style={{ backgroundColor: c.hex }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      prod.stock > 0
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-zinc-200 text-zinc-700'
                    }`}
                  >
                    {prod.stock > 0 ? `${prod.stock} pcs` : 'Habis'}
                  </span>
                  <ArrowRight className="w-4 h-4 text-[#6D6D68] group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
