import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Upload,
  Save,
  ArrowLeft,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Palette,
  Link as LinkIcon,
  Loader2,
  X,
  Sparkles,
} from 'lucide-react';
import { Product, Category, ProductColor, MarketplaceLinks } from '../../types';
import { getCategories } from '../../services/categoryService';
import { createProduct, createBulkProducts, updateProduct, uploadProductImage } from '../../services/productService';
import { slugify } from '../../utils/formatters';
import { compressImage } from '../../utils/imageCompressor';
import { useAuth } from '../../context/AuthContext';

interface ProductFormRow {
  tempId: string;
  name: string;
  categoryId: string;
  categoryName: string;
  price: string;
  hpp: string;
  stock: string;
  colors: ProductColor[];
  imageFile?: File | null;
  imageUrl?: string;
  imagePath?: string;
  imageInfo?: string;
  imageProcessing?: boolean;
  imageError?: string;
  description: string;
  links: MarketplaceLinks;
  error?: string;
}

interface AdminProductFormPageProps {
  productToEdit?: Product | null;
  onBack: () => void;
  onSaved: () => void;
}

export const AdminProductFormPage: React.FC<AdminProductFormPageProps> = ({
  productToEdit,
  onBack,
  onSaved,
}) => {
  const { adminUser } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const isEditMode = Boolean(productToEdit);

  const [rows, setRows] = useState<ProductFormRow[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadCategories = async () => {
      const cats = await getCategories();
      setCategories(cats);

      if (isEditMode && productToEdit) {
        setRows([
          {
            tempId: productToEdit.id,
            name: productToEdit.name,
            categoryId: productToEdit.categoryId,
            categoryName: productToEdit.categoryName,
            price: productToEdit.price.toString(),
            hpp: productToEdit.hpp.toString(),
            stock: productToEdit.stock.toString(),
            colors: productToEdit.colors || [],
            imageUrl: productToEdit.imageUrl,
            imagePath: productToEdit.imagePath,
            description: productToEdit.description || '',
            links: productToEdit.links || {},
          },
        ]);
      } else {
        // Initial empty row for bulk entry
        const defaultCat = cats.length > 0 ? cats[0] : null;
        setRows([
          {
            tempId: `row-${Date.now()}`,
            name: '',
            categoryId: defaultCat?.id || '',
            categoryName: defaultCat?.name || '',
            price: '',
            hpp: '',
            stock: '0',
            colors: [
              { id: 'c1', name: 'Black', hex: '#171717', stock: 10 },
              { id: 'c2', name: 'Cream', hex: '#E8E1D5', stock: 10 },
              { id: 'c3', name: 'Moca', hex: '#A78C78', stock: 10 },
            ],
            description: '',
            links: {},
          },
        ]);
      }
    };

    loadCategories();
  }, [productToEdit]);

  // Add new empty row
  const handleAddRow = () => {
    const defaultCat = categories.length > 0 ? categories[0] : null;
    setRows((prev) => [
      ...prev,
      {
        tempId: `row-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        name: '',
        categoryId: defaultCat?.id || '',
        categoryName: defaultCat?.name || '',
        price: '',
        hpp: '',
        stock: '0',
        colors: [
          { id: 'c1', name: 'Black', hex: '#171717', stock: 10 },
          { id: 'c2', name: 'Cream', hex: '#E8E1D5', stock: 10 },
        ],
        description: '',
        links: {},
      },
    ]);
  };

  // Remove row
  const handleRemoveRow = (index: number) => {
    if (rows.length === 1) return;
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  // Update row field
  const handleUpdateRow = (index: number, field: keyof ProductFormRow, value: any) => {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };

      if (field === 'categoryId') {
        const cat = categories.find((c) => c.id === value);
        if (cat) {
          next[index].categoryName = cat.name;
        }
      }
      return next;
    });
  };

  // Add color to row
  const handleAddColor = (rowIndex: number) => {
    setRows((prev) => {
      const next = [...prev];
      const row = next[rowIndex];
      const newColor: ProductColor = {
        id: `col-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        name: 'Warna Baru',
        hex: '#A78C78',
        stock: 5,
      };
      row.colors = [...row.colors, newColor];
      return next;
    });
  };

  // Remove color from row
  const handleRemoveColor = (rowIndex: number, colorId: string) => {
    setRows((prev) => {
      const next = [...prev];
      next[rowIndex].colors = next[rowIndex].colors.filter((c) => c.id !== colorId);
      return next;
    });
  };

  // Update color in row
  const handleUpdateColor = (
    rowIndex: number,
    colorId: string,
    field: keyof ProductColor,
    val: any
  ) => {
    setRows((prev) => {
      const next = [...prev];
      next[rowIndex].colors = next[rowIndex].colors.map((c) =>
        c.id === colorId ? { ...c, [field]: val } : c
      );
      return next;
    });
  };

  // Handle Image File selection with instant client-side compression and validation
  const handleImageChange = async (rowIndex: number, file: File) => {
    // Validate file size and type
    if (!file.type.startsWith('image/')) {
      setRows((prev) => {
        const next = [...prev];
        next[rowIndex].imageError = 'File yang dipilih bukan gambar valid. Gunakan format JPG, PNG, atau WebP.';
        return next;
      });
      return;
    }

    // Set processing state
    setRows((prev) => {
      const next = [...prev];
      next[rowIndex].imageProcessing = true;
      next[rowIndex].imageError = undefined;
      return next;
    });

    try {
      // Compress image client-side for rapid uploads (< 150KB)
      const compressed = await compressImage(file, 1200, 1200, 0.85);

      setRows((prev) => {
        const next = [...prev];
        next[rowIndex].imageFile = compressed.file;
        next[rowIndex].imageUrl = compressed.previewUrl;
        next[rowIndex].imageProcessing = false;
        next[rowIndex].imageError = undefined;
        next[rowIndex].imageInfo = `Siap diunggah (${Math.round(compressed.compressedSize / 1024)} KB, hemat ${compressed.compressionRatio}%)`;
        return next;
      });
    } catch (err: any) {
      console.error('Image compression error:', err);
      const fallbackUrl = URL.createObjectURL(file);
      setRows((prev) => {
        const next = [...prev];
        next[rowIndex].imageFile = file;
        next[rowIndex].imageUrl = fallbackUrl;
        next[rowIndex].imageProcessing = false;
        next[rowIndex].imageError = undefined;
        next[rowIndex].imageInfo = `Ukuran asli: ${Math.round(file.size / 1024)} KB`;
        return next;
      });
    }
  };

  // Remove image from row
  const handleClearImage = (rowIndex: number) => {
    setRows((prev) => {
      const next = [...prev];
      next[rowIndex].imageFile = null;
      next[rowIndex].imageUrl = '';
      next[rowIndex].imagePath = '';
      next[rowIndex].imageInfo = undefined;
      next[rowIndex].imageError = undefined;
      return next;
    });
  };

  // Submit and save to Firestore
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);
    setSuccessMessage(null);
    setUploadStatusText(null);

    // Validate rows
    let hasError = false;
    const validatedRows = rows.map((row) => {
      const errors: string[] = [];
      if (!row.name.trim()) errors.push('Nama produk wajib diisi.');
      if (!row.price || isNaN(Number(row.price)) || Number(row.price) < 0) {
        errors.push('Harga jual harus berupa angka >= 0.');
      }
      if (!row.hpp || isNaN(Number(row.hpp)) || Number(row.hpp) < 0) {
        errors.push('HPP modal harus berupa angka >= 0.');
      }
      if (errors.length > 0) {
        hasError = true;
        return { ...row, error: errors.join(' ') };
      }
      return { ...row, error: undefined };
    });

    setRows(validatedRows);

    if (hasError) {
      setGlobalError('Harap periksa isian formulir yang ditandai merah.');
      return;
    }

    setIsSaving(true);
    const userUid = adminUser?.uid || 'admin';
    const userName = adminUser?.displayName || adminUser?.username || 'Admin';

    try {
      if (isEditMode && productToEdit) {
        const row = validatedRows[0];
        let finalImageUrl = row.imageUrl || '';
        let finalImagePath = row.imagePath || '';

        // Upload new image if provided
        if (row.imageFile) {
          setUploadStatusText('Mengunggah foto produk ke Firebase Storage...');
          try {
            const uploadRes = await uploadProductImage(productToEdit.id, row.imageFile, (status) => {
              setUploadStatusText(status);
            });
            finalImageUrl = uploadRes.imageUrl;
            finalImagePath = uploadRes.imagePath;

            if (uploadRes.error) {
              console.warn('Image upload note:', uploadRes.error);
            }
          } catch (uploadErr: any) {
            console.error('Image upload failed:', uploadErr);
            setGlobalError(`Gagal mengunggah foto: ${uploadErr.message || 'Koneksi terputus'}.`);
            setIsSaving(false);
            return;
          }
        }

        setUploadStatusText('Menyimpan pembaruan data ke Firestore...');

        const totalStock = row.colors.length > 0
          ? row.colors.reduce((sum, c) => sum + (Number(c.stock) || 0), 0)
          : Number(row.stock) || 0;

        await updateProduct(
          productToEdit.id,
          {
            name: row.name.trim(),
            categoryId: row.categoryId,
            categoryName: row.categoryName,
            price: Number(row.price),
            hpp: Number(row.hpp),
            stock: totalStock,
            colors: row.colors,
            imageUrl: finalImageUrl,
            imagePath: finalImagePath,
            description: row.description.trim(),
            links: row.links,
          },
          userUid,
          userName
        );

        setSuccessMessage('Produk berhasil diperbarui dan tersimpan di database.');
        setTimeout(() => onSaved(), 1000);
      } else {
        // Bulk or single create
        const productsToCreate = [];
        const totalRowsCount = validatedRows.length;

        for (let i = 0; i < totalRowsCount; i++) {
          const row = validatedRows[i];
          const tempDocId = `prd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          let finalImageUrl = row.imageUrl?.startsWith('http') ? row.imageUrl : '';
          let finalImagePath = '';

          if (row.imageFile) {
            setUploadStatusText(`Mengunggah foto produk (${i + 1}/${totalRowsCount}): "${row.name || 'Produk'}"...`);
            try {
              const uploadRes = await uploadProductImage(tempDocId, row.imageFile, (status) => {
                setUploadStatusText(`(${i + 1}/${totalRowsCount}) ${status}`);
              });
              finalImageUrl = uploadRes.imageUrl;
              finalImagePath = uploadRes.imagePath;
            } catch (uploadErr: any) {
              console.error(`Image upload failed for row ${i + 1}:`, uploadErr);
              setGlobalError(`Gagal mengunggah foto untuk produk "${row.name}": ${uploadErr.message || 'Gangguan koneksi'}.`);
              setIsSaving(false);
              return;
            }
          }

          const totalStock = row.colors.length > 0
            ? row.colors.reduce((sum, c) => sum + (Number(c.stock) || 0), 0)
            : Number(row.stock) || 0;

          productsToCreate.push({
            name: row.name.trim(),
            slug: slugify(row.name),
            categoryId: row.categoryId,
            categoryName: row.categoryName,
            price: Number(row.price),
            hpp: Number(row.hpp),
            stock: totalStock,
            status: totalStock > 0 ? ('AVAILABLE' as const) : ('OUT_OF_STOCK' as const),
            colors: row.colors,
            imageUrl: finalImageUrl,
            imagePath: finalImagePath,
            description: row.description.trim(),
            links: row.links,
          });
        }

        setUploadStatusText('Menyimpan data produk ke Firestore...');

        if (productsToCreate.length === 1) {
          await createProduct(productsToCreate[0], userUid, userName);
        } else {
          await createBulkProducts(productsToCreate, userUid, userName);
        }

        setSuccessMessage(
          `Berhasil menyimpan ${productsToCreate.length} produk ke database Firestore.`
        );
        setTimeout(() => onSaved(), 1000);
      }
    } catch (err: any) {
      console.error('Save product error:', err);
      setGlobalError(err?.message || 'Gagal menyimpan produk ke Firebase. Periksa koneksi internet Anda.');
    } finally {
      setIsSaving(false);
      setUploadStatusText(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DCDCD5]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 text-[#6D6D68] hover:text-[#151515] hover:bg-[#E7E7E0] rounded-xl transition-colors"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-[#151515] tracking-tight">
              {isEditMode ? `Edit Produk: ${productToEdit?.name}` : 'Tambah Produk Baru (Bulk Entry)'}
            </h2>
            <p className="text-xs text-[#6D6D68]">
              {isEditMode
                ? 'Perbarui detail produk, varian warna, harga, atau foto.'
                : 'Input satu atau banyak produk sekaligus dalam satu form lalu simpan ke Firestore.'}
            </p>
          </div>
        </div>

        {!isEditMode && (
          <button
            type="button"
            onClick={handleAddRow}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-[#E7E7E0] hover:bg-[#DCDCD5] text-[#151515] rounded-xl text-xs font-semibold tracking-wider uppercase transition-all shrink-0 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Baris Produk</span>
          </button>
        )}
      </div>

      {/* Upload Status Banner */}
      {uploadStatusText && (
        <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-2xl flex items-center gap-3 text-xs text-amber-900 shadow-xs animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin text-amber-700 shrink-0" />
          <span className="font-semibold">{uploadStatusText}</span>
        </div>
      )}

      {/* Global Alerts */}
      {globalError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-xs text-red-700 shadow-xs">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">Terjadi Kesalahan:</span>
            <p>{globalError}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-xs text-emerald-800 shadow-xs">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {/* Form / Rows Container */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {rows.map((row, rIdx) => (
          <div
            key={row.tempId}
            className={`bg-[#F8F8F4] border rounded-3xl p-6 shadow-xs space-y-6 transition-all ${
              row.error || row.imageError ? 'border-red-400 bg-red-50/10' : 'border-[#DCDCD5]'
            }`}
          >
            {/* Row Header & Delete Row button */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E7E0]">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#151515] text-[#F8F8F4] text-xs font-bold flex items-center justify-center">
                  {rIdx + 1}
                </span>
                <h3 className="text-sm font-bold text-[#151515] uppercase tracking-wide">
                  {row.name ? row.name : `Produk #${rIdx + 1}`}
                </h3>
              </div>

              {!isEditMode && rows.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveRow(rIdx)}
                  className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1 font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Baris</span>
                </button>
              )}
            </div>

            {row.error && (
              <p className="text-xs text-red-600 font-medium">{row.error}</p>
            )}

            {/* Grid: Main Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Product Name */}
              <div className="lg:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#151515] mb-1">
                  Nama Produk <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={row.name}
                  onChange={(e) => handleUpdateRow(rIdx, 'name', e.target.value)}
                  placeholder="Contoh: Paris Jadul, Pashmina Silk..."
                  className="w-full px-3.5 py-2.5 bg-[#F3F3EE] border border-[#DCDCD5] rounded-xl text-xs text-[#151515] focus:outline-hidden focus:border-[#151515]"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#151515] mb-1">
                  Kategori
                </label>
                <select
                  value={row.categoryId}
                  onChange={(e) => handleUpdateRow(rIdx, 'categoryId', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F3F3EE] border border-[#DCDCD5] rounded-xl text-xs text-[#151515] focus:outline-hidden focus:border-[#151515]"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Enhanced Image Upload Section with Loading & Error Status */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#151515] mb-1">
                  Foto Produk
                </label>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    {/* Thumbnail preview */}
                    <div className="relative w-11 h-11 rounded-xl bg-[#E7E7E0] border border-[#DCDCD5] overflow-hidden shrink-0 flex items-center justify-center">
                      {row.imageProcessing ? (
                        <Loader2 className="w-5 h-5 text-[#151515] animate-spin" />
                      ) : row.imageUrl ? (
                        <>
                          <img
                            src={row.imageUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleClearImage(rIdx)}
                            title="Hapus Foto"
                            className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/70 hover:bg-black text-white rounded-full flex items-center justify-center"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </>
                      ) : (
                        <ImageIcon className="w-5 h-5 text-[#6D6D68]" />
                      )}
                    </div>

                    {/* File picker button */}
                    <label className={`cursor-pointer px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
                      row.imageProcessing
                        ? 'bg-amber-100 text-amber-900 pointer-events-none'
                        : 'bg-[#E7E7E0] hover:bg-[#DCDCD5] text-[#151515]'
                    }`}>
                      {row.imageProcessing ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Memproses...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>{row.imageUrl ? 'Ganti Foto' : 'Pilih Foto'}</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/jpg"
                        disabled={row.imageProcessing || isSaving}
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleImageChange(rIdx, e.target.files[0]);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Compression / Info Tag */}
                  {row.imageInfo && !row.imageError && (
                    <p className="text-[10px] text-emerald-700 font-medium flex items-center gap-1">
                      <Sparkles className="w-3 h-3 shrink-0" />
                      <span>{row.imageInfo}</span>
                    </p>
                  )}

                  {/* Image Error Alert */}
                  {row.imageError && (
                    <p className="text-[10px] text-red-600 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{row.imageError}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Price (Harga Jual) */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#151515] mb-1">
                  Harga Jual (Rp) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={row.price}
                  onChange={(e) => handleUpdateRow(rIdx, 'price', e.target.value)}
                  placeholder="35000"
                  className="w-full px-3.5 py-2.5 bg-[#F3F3EE] border border-[#DCDCD5] rounded-xl text-xs text-[#151515] font-semibold focus:outline-hidden focus:border-[#151515]"
                />
              </div>

              {/* HPP Modal */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#151515] mb-1">
                  HPP Modal (Rp) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={row.hpp}
                  onChange={(e) => handleUpdateRow(rIdx, 'hpp', e.target.value)}
                  placeholder="22000"
                  className="w-full px-3.5 py-2.5 bg-[#F3F3EE] border border-[#DCDCD5] rounded-xl text-xs text-[#151515] focus:outline-hidden focus:border-[#151515]"
                />
              </div>

              {/* Description */}
              <div className="lg:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#151515] mb-1">
                  Deskripsi / Catatan Bahan
                </label>
                <input
                  type="text"
                  value={row.description}
                  onChange={(e) => handleUpdateRow(rIdx, 'description', e.target.value)}
                  placeholder="Bahan voal premium, tegak di dahi, tidak terawang..."
                  className="w-full px-3.5 py-2.5 bg-[#F3F3EE] border border-[#DCDCD5] rounded-xl text-xs text-[#151515] focus:outline-hidden focus:border-[#151515]"
                />
              </div>
            </div>

            {/* Colors Section */}
            <div className="pt-3 border-t border-[#E7E7E0] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-[#6D6D68]" />
                  <label className="text-xs font-bold uppercase tracking-wider text-[#151515]">
                    Varian Warna & Stok Fisik per Warna ({row.colors.length})
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => handleAddColor(rIdx)}
                  className="text-xs text-[#151515] font-semibold hover:underline flex items-center gap-1"
                >
                  + Tambah Warna
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {row.colors.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 bg-[#F3F3EE] border border-[#DCDCD5] rounded-2xl flex items-center gap-2.5 shadow-2xs"
                  >
                    {/* Native color picker */}
                    <input
                      type="color"
                      value={c.hex.startsWith('#') ? c.hex : `#${c.hex}`}
                      onChange={(e) =>
                        handleUpdateColor(rIdx, c.id, 'hex', e.target.value)
                      }
                      className="w-8 h-8 rounded-lg cursor-pointer border-none bg-transparent shrink-0"
                      title="Pilih warna HEX"
                    />

                    {/* Color Name */}
                    <input
                      type="text"
                      value={c.name}
                      onChange={(e) =>
                        handleUpdateColor(rIdx, c.id, 'name', e.target.value)
                      }
                      placeholder="Nama Warna"
                      className="w-full px-2 py-1 bg-white border border-[#DCDCD5] rounded-lg text-xs text-[#151515] focus:outline-hidden"
                    />

                    {/* Color Stock */}
                    <div className="flex items-center gap-1 shrink-0">
                      <input
                        type="number"
                        min="0"
                        value={c.stock}
                        onChange={(e) =>
                          handleUpdateColor(
                            rIdx,
                            c.id,
                            'stock',
                            parseInt(e.target.value, 10) || 0
                          )
                        }
                        placeholder="Qty"
                        className="w-14 px-2 py-1 bg-white border border-[#DCDCD5] rounded-lg text-xs font-semibold text-center text-[#151515] focus:outline-hidden"
                        title="Stok fisik warna ini"
                      />
                      <span className="text-[10px] text-[#6D6D68]">pcs</span>
                    </div>

                    {/* Remove color */}
                    <button
                      type="button"
                      onClick={() => handleRemoveColor(rIdx, c.id)}
                      className="p-1 text-[#6D6D68] hover:text-red-600 rounded-md"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Marketplace Links Accordion */}
            <div className="pt-3 border-t border-[#E7E7E0] space-y-2">
              <div className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-[#6D6D68]" />
                <label className="text-xs font-bold uppercase tracking-wider text-[#151515]">
                  Link Marketplace (Shopee, Tokopedia, TikTok Shop, WhatsApp)
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <input
                  type="url"
                  value={row.links?.shopee || ''}
                  onChange={(e) =>
                    handleUpdateRow(rIdx, 'links', {
                      ...row.links,
                      shopee: e.target.value,
                    })
                  }
                  placeholder="URL Shopee (https://...)"
                  className="px-3 py-2 bg-[#F3F3EE] border border-[#DCDCD5] rounded-xl text-xs text-[#151515] focus:outline-hidden"
                />
                <input
                  type="url"
                  value={row.links?.tokopedia || ''}
                  onChange={(e) =>
                    handleUpdateRow(rIdx, 'links', {
                      ...row.links,
                      tokopedia: e.target.value,
                    })
                  }
                  placeholder="URL Tokopedia (https://...)"
                  className="px-3 py-2 bg-[#F3F3EE] border border-[#DCDCD5] rounded-xl text-xs text-[#151515] focus:outline-hidden"
                />
                <input
                  type="url"
                  value={row.links?.tiktokShop || ''}
                  onChange={(e) =>
                    handleUpdateRow(rIdx, 'links', {
                      ...row.links,
                      tiktokShop: e.target.value,
                    })
                  }
                  placeholder="URL TikTok Shop (https://...)"
                  className="px-3 py-2 bg-[#F3F3EE] border border-[#DCDCD5] rounded-xl text-xs text-[#151515] focus:outline-hidden"
                />
                <input
                  type="text"
                  value={row.links?.whatsapp || ''}
                  onChange={(e) =>
                    handleUpdateRow(rIdx, 'links', {
                      ...row.links,
                      whatsapp: e.target.value,
                    })
                  }
                  placeholder="Nomor WA (cth: 628123456789)"
                  className="px-3 py-2 bg-[#F3F3EE] border border-[#DCDCD5] rounded-xl text-xs text-[#151515] focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        ))}

        {/* Sticky Submit Bar */}
        <div className="sticky bottom-4 z-20 bg-[#F8F8F4]/95 backdrop-blur-md border border-[#DCDCD5] rounded-2xl p-4 shadow-xl flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            disabled={isSaving}
            className="px-4 py-2.5 text-xs font-semibold text-[#151515] bg-[#E7E7E0] hover:bg-[#DCDCD5] rounded-xl transition-colors disabled:opacity-50"
          >
            Batal
          </button>

          <div className="flex items-center gap-3">
            {uploadStatusText ? (
              <span className="text-xs text-amber-800 font-medium animate-pulse flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{uploadStatusText}</span>
              </span>
            ) : (
              <span className="text-xs text-[#6D6D68] hidden sm:inline">
                {rows.length} produk siap disimpan ke Cloud Firestore
              </span>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#151515] text-[#F8F8F4] hover:bg-[#2A2A2A] rounded-xl text-xs font-semibold tracking-wider uppercase transition-all shadow-md disabled:opacity-50"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isEditMode ? 'Simpan Perubahan' : 'Simpan Semua Produk'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
