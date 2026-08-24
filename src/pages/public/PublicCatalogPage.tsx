import React, { useState, useEffect } from 'react';
import {
  Search,
  SlidersHorizontal,
  Package,
  Layers,
  Sparkles,
  ShoppingBag,
  MessageCircle,
} from 'lucide-react';
import { Product, Category, StoreSettings } from '../../types';
import { getProducts } from '../../services/productService';
import { getCategories } from '../../services/categoryService';
import { getStoreSettings } from '../../services/settingsService';
import { PublicHero } from '../../components/public/PublicHero';
import { ProductCard } from '../../components/public/ProductCard';
import { ProductDetailModal } from '../../components/public/ProductDetailModal';

export const PublicCatalogPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedColor, setSelectedColor] = useState<string>('all');
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high' | 'name'>(
    'newest'
  );

  // Selected product for detail modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    const loadInitial = async () => {
      setLoading(true);
      const [fetchedProducts, fetchedCats, fetchedSettings] = await Promise.all([
        getProducts(),
        getCategories(),
        getStoreSettings(),
      ]);
      setProducts(fetchedProducts);
      setCategories(fetchedCats);
      setSettings(fetchedSettings);
      setLoading(false);
    };

    loadInitial();
  }, []);

  // Collect unique colors across all products for quick color filtering
  const allColors = Array.from(
    new Set(
      products.flatMap((p) => (p.colors || []).map((c) => c.name.trim()))
    )
  ).filter(Boolean);

  // Filter and sort products
  const filteredProducts = products
    .filter((product) => {
      // Category filter
      if (selectedCategory !== 'all') {
        const catObj = categories.find((c) => c.id === selectedCategory);
        if (
          product.categoryId !== selectedCategory &&
          product.categoryName?.toLowerCase() !== catObj?.name.toLowerCase()
        ) {
          return false;
        }
      }

      // Color filter
      if (selectedColor !== 'all') {
        const hasColor = product.colors?.some(
          (c) => c.name.toLowerCase() === selectedColor.toLowerCase()
        );
        if (!hasColor) return false;
      }

      // Stock filter
      if (onlyAvailable && product.stock <= 0) {
        return false;
      }

      // Search term
      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        const matchName = product.name.toLowerCase().includes(term);
        const matchCat = product.categoryName?.toLowerCase().includes(term);
        const matchDesc = product.description?.toLowerCase().includes(term);
        const matchColors = product.colors?.some((c) =>
          c.name.toLowerCase().includes(term)
        );
        if (!matchName && !matchCat && !matchDesc && !matchColors) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      // default newest
      return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
    });

  return (
    <div className="space-y-12 animate-in fade-in duration-300">
      {/* Hero Banner */}
      <PublicHero />

      {/* Catalog & Filter Section */}
      <section id="catalog" className="space-y-6">
        {/* Category Pills Bar */}
        <div className="flex items-center justify-between gap-4 border-b border-[#DCDCD5] pb-4 overflow-x-auto">
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
                selectedCategory === 'all'
                  ? 'bg-[#151515] text-[#F8F8F4] shadow-xs'
                  : 'bg-[#F8F8F4] text-[#6D6D68] hover:text-[#151515] border border-[#DCDCD5]'
              }`}
            >
              Semua Koleksi ({products.length})
            </button>

            {categories.map((category) => {
              const count = products.filter(
                (p) =>
                  p.categoryId === category.id ||
                  p.categoryName?.toLowerCase() === category.name.toLowerCase()
              ).length;

              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all shrink-0 ${
                    selectedCategory === category.id
                      ? 'bg-[#151515] text-[#F8F8F4] shadow-xs'
                      : 'bg-[#F8F8F4] text-[#6D6D68] hover:text-[#151515] border border-[#DCDCD5]'
                  }`}
                >
                  {category.name} ({count})
                </button>
              );
            })}
          </div>

          <div className="text-xs text-[#6D6D68] shrink-0 font-medium hidden md:block">
            Menampilkan {filteredProducts.length} model hijab
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-[#F8F8F4] border border-[#DCDCD5] rounded-3xl p-4 shadow-xs">
          {/* Search Input */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-[#6D6D68] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari model, warna favorit (contoh: Sage, Moca)..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#F3F3EE] border border-[#DCDCD5] rounded-2xl text-xs text-[#151515] focus:outline-hidden focus:border-[#151515]"
            />
          </div>

          {/* Color Filter */}
          <div>
            <select
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#F3F3EE] border border-[#DCDCD5] rounded-2xl text-xs text-[#151515] focus:outline-hidden focus:border-[#151515]"
            >
              <option value="all">Semua Varian Warna</option>
              {allColors.map((colorName) => (
                <option key={colorName} value={colorName}>
                  Warna: {colorName}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3.5 py-2.5 bg-[#F3F3EE] border border-[#DCDCD5] rounded-2xl text-xs text-[#151515] focus:outline-hidden focus:border-[#151515]"
            >
              <option value="newest">Koleksi Terbaru</option>
              <option value="price-low">Harga: Rendah ke Tinggi</option>
              <option value="price-high">Harga: Tinggi ke Rendah</option>
              <option value="name">Nama Model (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Stock Toggle Filter */}
        <div className="flex items-center justify-between gap-4">
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyAvailable}
              onChange={(e) => setOnlyAvailable(e.target.checked)}
              className="w-4 h-4 rounded-md border-[#DCDCD5] text-[#151515] focus:ring-0"
            />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#151515]">
              Hanya Tampilkan Stok Tersedia (In Stock)
            </span>
          </label>

          {(searchTerm ||
            selectedCategory !== 'all' ||
            selectedColor !== 'all' ||
            onlyAvailable) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setSelectedColor('all');
                setOnlyAvailable(false);
                setSortBy('newest');
              }}
              className="text-xs text-[#6D6D68] hover:text-[#151515] underline font-medium"
            >
              Reset Semua Filter
            </button>
          )}
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="py-24 text-center space-y-4">
            <div className="w-8 h-8 border-2 border-[#151515] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-[#6D6D68] font-medium tracking-wide">
              Memuat koleksi hijab CLO.EAST...
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-[#F8F8F4] border border-[#DCDCD5] rounded-3xl p-16 text-center space-y-4">
            <Package className="w-12 h-12 text-[#6D6D68] mx-auto opacity-40" />
            <h3 className="text-base font-bold text-[#151515] uppercase tracking-wide">
              Produk Tidak Ditemukan
            </h3>
            <p className="text-xs text-[#6D6D68] max-w-sm mx-auto">
              Tidak ada model hijab yang sesuai dengan filter atau kata kunci pencarian Anda.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setSelectedColor('all');
                setOnlyAvailable(false);
              }}
              className="px-5 py-2.5 bg-[#151515] text-[#F8F8F4] hover:bg-[#2A2A2A] rounded-xl text-xs font-semibold tracking-wider uppercase transition-all shadow-xs"
            >
              Lihat Semua Koleksi
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => setSelectedProduct(product)}
                onSelect={(p) => setSelectedProduct(p)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Product Detail Modal with marketplace checkout */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={Boolean(selectedProduct)}
        whatsappNumber={settings?.whatsappNumber}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
};
