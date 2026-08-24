import React, { useState, useEffect } from 'react';
import {
  Package,
  Search,
  Plus,
  Trash2,
  Edit2,
  FileSpreadsheet,
  AlertCircle,
  CheckSquare,
  Square,
  Layers,
  Filter,
} from 'lucide-react';
import { Product, Category } from '../../types';
import { getProducts, deleteProduct, deleteBulkProducts } from '../../services/productService';
import { getCategories } from '../../services/categoryService';
import { formatCurrency, formatNumber, formatDate } from '../../utils/formatters';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { useAuth } from '../../context/AuthContext';

interface AdminProductsPageProps {
  onAddNew: () => void;
  onEditProduct: (product: Product) => void;
  onImportCSV: () => void;
}

export const AdminProductsPage: React.FC<AdminProductsPageProps> = ({
  onAddNew,
  onEditProduct,
  onImportCSV,
}) => {
  const { adminUser } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Multi-select state
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Confirmation Modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isProcessingDelete, setIsProcessingDelete] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const [fetchedProducts, fetchedCategories] = await Promise.all([
      getProducts({
        categoryId: selectedCategory,
        status: selectedStatus,
        search: searchTerm,
      }),
      getCategories(),
    ]);
    setProducts(fetchedProducts);
    setCategories(fetchedCategories);
    setSelectedProductIds([]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory, selectedStatus]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Handle single delete request
  const handleRequestDelete = (product: Product) => {
    setProductToDelete(product);
    setIsBulkDeleting(false);
    setDeleteModalOpen(true);
  };

  // Handle bulk delete request
  const handleRequestBulkDelete = () => {
    if (selectedProductIds.length === 0) return;
    setIsBulkDeleting(true);
    setProductToDelete(null);
    setDeleteModalOpen(true);
  };

  // Confirm delete action
  const handleConfirmDelete = async () => {
    setIsProcessingDelete(true);
    const userUid = adminUser?.uid || 'admin';
    const userName = adminUser?.displayName || adminUser?.username || 'Admin';

    if (isBulkDeleting) {
      const itemsToDelete = products
        .filter((p) => selectedProductIds.includes(p.id))
        .map((p) => ({ id: p.id, name: p.name, imagePath: p.imagePath }));

      await deleteBulkProducts(itemsToDelete, userUid, userName);
    } else if (productToDelete) {
      await deleteProduct(
        productToDelete.id,
        productToDelete.name,
        productToDelete.imagePath,
        userUid,
        userName
      );
    }

    setIsProcessingDelete(false);
    setDeleteModalOpen(false);
    setProductToDelete(null);
    setIsBulkDeleting(false);
    await loadData();
  };

  // Select all / Deselect all
  const handleToggleSelectAll = () => {
    if (selectedProductIds.length === products.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(products.map((p) => p.id));
    }
  };

  const handleToggleProduct = (id: string) => {
    if (selectedProductIds.includes(id)) {
      setSelectedProductIds(selectedProductIds.filter((item) => item !== id));
    } else {
      setSelectedProductIds([...selectedProductIds, id]);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#151515] tracking-tight">
            Katalog Produk & Inventori
          </h2>
          <p className="text-xs text-[#6D6D68] mt-0.5">
            Kelola model hijab, varian warna, harga jual, HPP modal, dan ketersediaan stok fisik.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {selectedProductIds.length > 0 && (
            <button
              onClick={handleRequestBulkDelete}
              className="flex items-center gap-2 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold tracking-wider uppercase transition-all shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus ({selectedProductIds.length})</span>
            </button>
          )}

          <button
            onClick={onImportCSV}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#E7E7E0] hover:bg-[#DCDCD5] text-[#151515] rounded-xl text-xs font-semibold tracking-wider uppercase transition-all"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={onAddNew}
            className="flex items-center gap-2 px-4 py-2 bg-[#151515] text-[#F8F8F4] hover:bg-[#2A2A2A] rounded-xl text-xs font-semibold tracking-wider uppercase transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Produk</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-[#F8F8F4] border border-[#DCDCD5] rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#6D6D68] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama produk, kategori, atau warna..."
            className="w-full pl-10 pr-4 py-2 bg-[#F3F3EE] border border-[#DCDCD5] rounded-xl text-xs text-[#151515] focus:outline-hidden focus:border-[#151515]"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-[#F3F3EE] border border-[#DCDCD5] rounded-xl text-xs text-[#151515] focus:outline-hidden focus:border-[#151515]"
          >
            <option value="all">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-[#F3F3EE] border border-[#DCDCD5] rounded-xl text-xs text-[#151515] focus:outline-hidden focus:border-[#151515]"
          >
            <option value="all">Semua Status Stok</option>
            <option value="AVAILABLE">Tersedia (Available)</option>
            <option value="OUT_OF_STOCK">Habis (Out of Stock)</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-[#F8F8F4] border border-[#DCDCD5] rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#DCDCD5] bg-[#F3F3EE] text-[#6D6D68]">
                <th className="py-3 px-4 w-10 text-center">
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="p-1 hover:text-[#151515]"
                    aria-label="Pilih semua"
                  >
                    {selectedProductIds.length > 0 &&
                    selectedProductIds.length === products.length ? (
                      <CheckSquare className="w-4 h-4 text-[#151515]" />
                    ) : (
                      <Square className="w-4 h-4 text-[#6D6D68]" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Foto</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Nama Produk</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Kategori</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Warna (HEX)</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Harga Jual</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">HPP (Modal)</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Stok Fisik</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E7E0]">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-xs text-[#6D6D68]">
                    <div className="w-6 h-6 border-2 border-[#151515] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Memuat data produk dari Firestore...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-xs text-[#6D6D68]">
                    <Package className="w-8 h-8 mx-auto text-[#6D6D68] mb-2 opacity-50" />
                    Tidak ada produk ditemukan. Tambahkan produk baru atau impor CSV.
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const isSelected = selectedProductIds.includes(product.id);
                  const colors = product.colors || [];

                  return (
                    <tr
                      key={product.id}
                      className={`hover:bg-[#F3F3EE]/80 transition-colors ${
                        isSelected ? 'bg-[#E7E7E0]/50' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleProduct(product.id)}
                          className="p-1"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#151515]" />
                          ) : (
                            <Square className="w-4 h-4 text-[#6D6D68]" />
                          )}
                        </button>
                      </td>

                      {/* Image Thumbnail */}
                      <td className="py-3 px-4">
                        <div className="w-12 h-14 rounded-lg bg-[#E7E7E0] overflow-hidden border border-[#DCDCD5] shrink-0">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-[#6D6D68]">
                              CLO
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Name & Slug */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#151515] uppercase tracking-tight">
                          {product.name}
                        </div>
                        <div className="text-[10px] text-[#6D6D68] font-mono">
                          /{product.slug}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 text-[#6D6D68]">
                        {product.categoryName || '-'}
                      </td>

                      {/* Colors */}
                      <td className="py-3 px-4">
                        {colors.length > 0 ? (
                          <div className="flex items-center gap-1 flex-wrap max-w-[160px]">
                            {colors.map((c, i) => (
                              <span
                                key={i}
                                className="w-3.5 h-3.5 rounded-full border border-black/20 inline-block shrink-0 shadow-2xs"
                                style={{ backgroundColor: c.hex }}
                                title={`${c.name} (${c.hex}): ${c.stock ?? 0} pcs`}
                              />
                            ))}
                            <span className="text-[10px] text-[#6D6D68] ml-1">
                              ({colors.length})
                            </span>
                          </div>
                        ) : (
                          <span className="text-[#6D6D68]">-</span>
                        )}
                      </td>

                      {/* Selling Price */}
                      <td className="py-3 px-4 font-bold text-[#151515]">
                        {formatCurrency(product.price)}
                      </td>

                      {/* HPP (Modal) */}
                      <td className="py-3 px-4 text-[#6D6D68]">
                        {formatCurrency(product.hpp)}
                      </td>

                      {/* Stock */}
                      <td className="py-3 px-4 font-semibold text-[#151515]">
                        {formatNumber(product.stock)} pcs
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                            product.stock > 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-zinc-200 text-zinc-700'
                          }`}
                        >
                          {product.stock > 0 ? 'Tersedia' : 'Habis'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onEditProduct(product)}
                            title="Edit Produk"
                            className="p-1.5 text-[#6D6D68] hover:text-[#151515] hover:bg-[#E7E7E0] rounded-lg transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleRequestDelete(product)}
                            title="Hapus Produk"
                            className="p-1.5 text-[#6D6D68] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        title={
          isBulkDeleting
            ? `Hapus ${selectedProductIds.length} Produk Terpilih?`
            : `Hapus Produk ${productToDelete?.name || ''}?`
        }
        message="Produk yang dihapus akan dihapus secara permanen dari database Cloud Firestore beserta file gambarnya. Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Hapus Permanen"
        cancelLabel="Batal"
        isDestructive={true}
        isLoading={isProcessingDelete}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setProductToDelete(null);
          setIsBulkDeleting(false);
        }}
      />
    </div>
  );
};
