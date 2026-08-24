import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Search,
  Plus,
  Minus,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Palette,
  Layers,
} from 'lucide-react';
import { Product, ProductColor, PendingStockChange, TransactionType } from '../../types';
import { getProducts } from '../../services/productService';
import { submitStockBatch } from '../../services/stockService';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

export const AdminStockPage: React.FC = () => {
  const { adminUser } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Pending Batch state
  const [pendingChanges, setPendingChanges] = useState<PendingStockChange[]>([]);
  const [batchNotes, setBatchNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Quick Action Modal for custom qty & note
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    product: Product | null;
    color: ProductColor | null;
    type: TransactionType;
    quantity: number;
    note: string;
  }>({
    isOpen: false,
    product: null,
    color: null,
    type: 'SALE',
    quantity: 1,
    note: '',
  });

  const loadData = async () => {
    setLoading(true);
    const fetched = await getProducts();
    setProducts(fetched);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered products list
  const filteredProducts = products.filter((p) => {
    const matchCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
    const matchSearch =
      searchTerm.trim() === '' ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.categoryName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.colors?.some((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchCategory && matchSearch;
  });

  // Open Quick Modal
  const handleOpenAction = (
    product: Product,
    color: ProductColor | null,
    type: TransactionType
  ) => {
    setActionModal({
      isOpen: true,
      product,
      color,
      type,
      quantity: 1,
      note: '',
    });
  };

  // Add change to pending batch
  const handleApplyAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionModal.product || actionModal.quantity <= 0) return;

    const { product, color, type, quantity, note } = actionModal;
    const currentStock = color ? Number(color.stock) || 0 : Number(product.stock) || 0;

    // Check existing pending changes for this item to prevent overselling in pending list
    const existingSold = pendingChanges
      .filter(
        (c) =>
          c.productId === product.id &&
          c.colorId === color?.id &&
          c.type === 'SALE'
      )
      .reduce((sum, c) => sum + c.quantity, 0);

    if (type === 'SALE' && currentStock - existingSold < quantity) {
      alert(
        `Stok tidak mencukupi! Stok saat ini: ${currentStock}, sudah direncanakan jual: ${existingSold}, permintaan baru: ${quantity}.`
      );
      return;
    }

    const newChange: PendingStockChange = {
      productId: product.id,
      productName: product.name,
      colorId: color?.id,
      colorName: color?.name,
      currentStock,
      type,
      quantity,
      price: product.price,
      hpp: product.hpp,
      note: note.trim(),
    };

    setPendingChanges((prev) => [...prev, newChange]);
    setActionModal({ isOpen: false, product: null, color: null, type: 'SALE', quantity: 1, note: '' });
  };

  // Remove individual change from batch
  const handleRemovePending = (index: number) => {
    setPendingChanges((prev) => prev.filter((_, i) => i !== index));
  };

  // Clear batch
  const handleClearBatch = () => {
    setPendingChanges([]);
    setSubmitError(null);
    setSubmitSuccess(null);
  };

  // Calculate Batch Totals
  const addedChanges = pendingChanges.filter((c) => c.type === 'ADD');
  const soldChanges = pendingChanges.filter((c) => c.type === 'SALE');

  const totalAdded = addedChanges.reduce((sum, c) => sum + c.quantity, 0);
  const totalSold = soldChanges.reduce((sum, c) => sum + c.quantity, 0);
  const totalRevenue = soldChanges.reduce((sum, c) => sum + c.quantity * c.price, 0);
  const totalGrossProfit = soldChanges.reduce(
    (sum, c) => sum + c.quantity * (c.price - c.hpp),
    0
  );
  const totalNetProfit = totalGrossProfit;

  // Submit Batch to Firebase Firestore
  const handleSubmitBatch = async () => {
    if (pendingChanges.length === 0) return;

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    const userUid = adminUser?.uid || 'admin';
    const userName = adminUser?.displayName || adminUser?.username || 'Admin';

    const result = await submitStockBatch(pendingChanges, userUid, userName, batchNotes);
    setIsSubmitting(false);

    if (result.success) {
      setSubmitSuccess(
        `Perubahan stok berhasil disimpan ke Firestore! (+${result.totalAdded} restock, -${result.totalSold} terjual, Omset: ${formatCurrency(result.totalRevenue)})`
      );
      setPendingChanges([]);
      setBatchNotes('');
      await loadData();
    } else {
      setSubmitError(result.error || 'Gagal menyimpan transaksi perubahan stok.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DCDCD5]">
        <div>
          <h2 className="text-xl font-bold text-[#151515] tracking-tight">
            Update Cepat Stok (Quick Stock)
          </h2>
          <p className="text-xs text-[#6D6D68] mt-0.5">
            Tambah stok masuk atau catat penjualan secara batch. Sistem memverifikasi stok realtime dan mencegah stok minus.
          </p>
        </div>

        {pendingChanges.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-full animate-pulse">
              {pendingChanges.length} perubahan siap di-review
            </span>
          </div>
        )}
      </div>

      {/* Notifications */}
      {submitError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-xs text-red-700">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{submitError}</span>
        </div>
      )}

      {submitSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-xs text-emerald-800">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{submitSuccess}</span>
        </div>
      )}

      {/* Main Grid: Products List & Batch Summary Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 Cols: Products List */}
        <div className="lg:col-span-8 space-y-4">
          {/* Search toolbar */}
          <div className="bg-[#F8F8F4] border border-[#DCDCD5] rounded-2xl p-3.5 flex items-center gap-3">
            <Search className="w-4 h-4 text-[#6D6D68]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari produk hijab atau warna untuk update stok..."
              className="w-full bg-transparent border-none text-xs text-[#151515] focus:outline-hidden"
            />
          </div>

          {/* Products List Table */}
          <div className="bg-[#F8F8F4] border border-[#DCDCD5] rounded-3xl overflow-hidden shadow-xs">
            {loading ? (
              <div className="py-12 text-center text-xs text-[#6D6D68]">
                <div className="w-6 h-6 border-2 border-[#151515] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Memuat data produk...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#6D6D68]">
                Tidak ada produk ditemukan.
              </div>
            ) : (
              <div className="divide-y divide-[#E7E7E0]">
                {filteredProducts.map((product) => {
                  const colors = product.colors || [];

                  return (
                    <div key={product.id} className="p-4 space-y-3 hover:bg-[#F3F3EE]/60 transition-colors">
                      {/* Product Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-12 bg-[#E7E7E0] rounded-lg overflow-hidden border border-[#DCDCD5] shrink-0">
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-[#6D6D68]">
                                CLO
                              </div>
                            )}
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-[#151515] uppercase tracking-tight">
                              {product.name}
                            </h4>
                            <p className="text-[11px] text-[#6D6D68]">
                              {product.categoryName} &bull; Harga: {formatCurrency(product.price)} (HPP: {formatCurrency(product.hpp)})
                            </p>
                          </div>
                        </div>

                        {/* Total Stock & Fast Action if no colors */}
                        <div className="flex items-center gap-3 self-end sm:self-auto">
                          <div className="text-right">
                            <span className="text-xs font-bold text-[#151515]">
                              {formatNumber(product.stock)} pcs
                            </span>
                            <p className="text-[10px] text-[#6D6D68]">Total Stok</p>
                          </div>

                          {colors.length === 0 && (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleOpenAction(product, null, 'ADD')}
                                className="px-2.5 py-1.5 bg-[#E7E7E0] hover:bg-[#DCDCD5] text-[#151515] rounded-lg text-xs font-semibold flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" /> Add
                              </button>
                              <button
                                onClick={() => handleOpenAction(product, null, 'SALE')}
                                disabled={product.stock <= 0}
                                className="px-2.5 py-1.5 bg-[#151515] hover:bg-[#2A2A2A] text-[#F8F8F4] rounded-lg text-xs font-semibold flex items-center gap-1 disabled:opacity-40"
                              >
                                <Minus className="w-3 h-3" /> Sold
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Color-level Stock Cards */}
                      {colors.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                          {colors.map((color) => {
                            const isColorEmpty = Number(color.stock) <= 0;

                            return (
                              <div
                                key={color.id}
                                className="p-2.5 bg-[#F3F3EE] border border-[#DCDCD5] rounded-xl flex items-center justify-between gap-2 shadow-2xs"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span
                                    className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0"
                                    style={{ backgroundColor: color.hex }}
                                  />
                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold text-[#151515] truncate">
                                      {color.name}
                                    </p>
                                    <p className="text-[10px] text-[#6D6D68]">
                                      Stok: <span className="font-semibold text-[#151515]">{color.stock ?? 0}</span> pcs
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={() => handleOpenAction(product, color, 'ADD')}
                                    title="Tambah Stok"
                                    className="p-1 bg-[#E7E7E0] hover:bg-[#DCDCD5] text-[#151515] rounded-md transition-colors"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleOpenAction(product, color, 'SALE')}
                                    disabled={isColorEmpty}
                                    title="Catat Penjualan"
                                    className="p-1 bg-[#151515] hover:bg-[#2A2A2A] text-white rounded-md transition-colors disabled:opacity-30"
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right 4 Cols: Pending Batch Review Summary */}
        <div className="lg:col-span-4 sticky top-24 space-y-4">
          <div className="bg-[#F8F8F4] border border-[#DCDCD5] rounded-3xl p-6 shadow-md space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCDCD5]">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#151515] flex items-center gap-2">
                <Boxes className="w-4 h-4 text-[#6D6D68]" />
                <span>UPDATE SUMMARY</span>
              </h3>
              {pendingChanges.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearBatch}
                  className="text-xs text-red-600 hover:underline font-medium"
                >
                  Reset
                </button>
              )}
            </div>

            {pendingChanges.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#6D6D68]">
                Belum ada perubahan stok pending. Klik tombol <strong>+</strong> atau <strong>-</strong> pada produk di sebelah kiri untuk memulai.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Items List */}
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {pendingChanges.map((change, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-[#F3F3EE] border border-[#DCDCD5] rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-[#151515]">
                          {change.productName}{' '}
                          {change.colorName && (
                            <span className="text-[#6D6D68] font-normal">
                              ({change.colorName})
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-[#6D6D68]">
                          {change.note || (batchNotes.trim() ? batchNotes : (change.type === 'SALE' ? 'Penjualan' : 'Restock'))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`font-bold px-2 py-0.5 rounded-md ${
                            change.type === 'SALE'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {change.type === 'SALE' ? `-${change.quantity}` : `+${change.quantity}`} pcs
                        </span>
                        <button
                          onClick={() => handleRemovePending(idx)}
                          className="text-[#6D6D68] hover:text-red-600 p-1"
                        >
                          &times;
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Batch Financial Totals */}
                <div className="pt-3 border-t border-[#DCDCD5] space-y-2 text-xs">
                  <div className="flex justify-between text-[#6D6D68]">
                    <span>Total Stok Masuk (Restock):</span>
                    <span className="font-semibold text-blue-700">+{totalAdded} pcs</span>
                  </div>
                  <div className="flex justify-between text-[#6D6D68]">
                    <span>Total Stok Terjual (Sold):</span>
                    <span className="font-semibold text-red-700">-{totalSold} pcs</span>
                  </div>
                  <div className="flex justify-between text-[#151515] pt-2 border-t border-[#E7E7E0]">
                    <span className="font-medium">Estimasi Omset (Revenue):</span>
                    <span className="font-bold">{formatCurrency(totalRevenue)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-800">
                    <span className="font-medium">Gross Profit:</span>
                    <span className="font-bold">{formatCurrency(totalGrossProfit)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-900 font-bold text-sm pt-1">
                    <span>Net Profit:</span>
                    <span>{formatCurrency(totalNetProfit)}</span>
                  </div>
                </div>

                {/* Note Field */}
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-[#6D6D68]">
                    Catatan Sesi Batch
                  </label>
                  <input
                    type="text"
                    value={batchNotes}
                    onChange={(e) => setBatchNotes(e.target.value)}
                    placeholder="Contoh: Penjualan Event Bazar / Restock Suplier"
                    className="w-full px-3 py-2 bg-[#F3F3EE] border border-[#DCDCD5] rounded-xl text-xs text-[#151515] focus:outline-hidden"
                  />
                  <p className="text-[10px] text-[#6D6D68]">
                    Catatan ini otomatis tercatat pada riwayat transaksi setiap item dalam batch ini.
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="button"
                  onClick={handleSubmitBatch}
                  disabled={isSubmitting}
                  className="w-full py-3 bg-[#151515] text-[#F8F8F4] hover:bg-[#2A2A2A] rounded-xl text-xs font-semibold tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Submit Perubahan Stok</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Action Modal */}
      {actionModal.isOpen && actionModal.product && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="w-full max-w-sm bg-[#F8F8F4] border border-[#DCDCD5] rounded-3xl p-6 shadow-2xl space-y-4"
            role="dialog"
            aria-modal="true"
          >
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#6D6D68]">
                {actionModal.type === 'SALE' ? 'Catat Penjualan (Sold)' : 'Tambah Stok (Restock)'}
              </span>
              <h3 className="text-base font-bold text-[#151515] uppercase tracking-tight mt-0.5">
                {actionModal.product.name}
              </h3>
              {actionModal.color && (
                <div className="flex items-center gap-1.5 mt-1">
                  <span
                    className="w-3 h-3 rounded-full border border-black/20"
                    style={{ backgroundColor: actionModal.color.hex }}
                  />
                  <span className="text-xs text-[#6D6D68]">
                    Warna: {actionModal.color.name} (Stok: {actionModal.color.stock} pcs)
                  </span>
                </div>
              )}
            </div>

            <form onSubmit={handleApplyAction} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#151515] mb-1">
                  Jumlah (Quantity)
                </label>
                <input
                  type="number"
                  min="1"
                  max={
                    actionModal.type === 'SALE'
                      ? actionModal.color
                        ? actionModal.color.stock
                        : actionModal.product.stock
                      : 9999
                  }
                  required
                  value={actionModal.quantity}
                  onChange={(e) =>
                    setActionModal((prev) => ({
                      ...prev,
                      quantity: Math.max(1, parseInt(e.target.value, 10) || 1),
                    }))
                  }
                  className="w-full px-3.5 py-2.5 bg-[#F3F3EE] border border-[#DCDCD5] rounded-xl text-base font-bold text-center text-[#151515] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#151515] mb-1">
                  Keterangan Khusus Item (Opsional)
                </label>
                <input
                  type="text"
                  value={actionModal.note}
                  onChange={(e) =>
                    setActionModal((prev) => ({ ...prev, note: e.target.value }))
                  }
                  placeholder={
                    batchNotes.trim() ||
                    (actionModal.type === 'SALE'
                      ? 'Misal: Order WA / Kasir'
                      : 'Misal: Masuk dari Penjahit')
                  }
                  className="w-full px-3.5 py-2 bg-[#F3F3EE] border border-[#DCDCD5] rounded-xl text-xs text-[#151515] focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    setActionModal({
                      isOpen: false,
                      product: null,
                      color: null,
                      type: 'SALE',
                      quantity: 1,
                      note: '',
                    })
                  }
                  className="px-4 py-2 text-xs font-semibold text-[#151515] bg-[#E7E7E0] hover:bg-[#DCDCD5] rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold tracking-wider uppercase text-white bg-[#151515] hover:bg-[#2A2A2A] rounded-xl transition-colors shadow-xs"
                >
                  Terapkan ke Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
