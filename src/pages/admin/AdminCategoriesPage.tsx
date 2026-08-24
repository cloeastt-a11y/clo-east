import React, { useState, useEffect } from 'react';
import {
  FolderTree,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Category } from '../../types';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  seedInitialCategories,
} from '../../services/categoryService';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { useAuth } from '../../context/AuthContext';

export const AdminCategoriesPage: React.FC = () => {
  const { adminUser } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal form state
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState('1');
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [catToDelete, setCatToDelete] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const data = await getCategories();
    setCategories(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setCategoryName('');
    setDescription('');
    setSortOrder((categories.length + 1).toString());
    setFormError(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setCategoryName(cat.name);
    setDescription(cat.description || '');
    setSortOrder((cat.sortOrder || 1).toString());
    setFormError(null);
    setFormOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      setFormError('Nama kategori wajib diisi.');
      return;
    }

    setIsSaving(true);
    setFormError(null);
    const userUid = adminUser?.uid || 'admin';
    const userName = adminUser?.displayName || adminUser?.username || 'Admin';

    try {
      if (editingCategory) {
        await updateCategory(
          editingCategory.id,
          {
            name: categoryName.trim(),
            description: description.trim(),
            sortOrder: parseInt(sortOrder, 10) || 0,
          },
          userUid,
          userName
        );
      } else {
        await createCategory(
          {
            name: categoryName.trim(),
            slug: '',
            description: description.trim(),
            sortOrder: parseInt(sortOrder, 10) || 0,
            isActive: true,
          },
          userUid,
          userName
        );
      }
      setFormOpen(false);
      await loadData();
    } catch (err: any) {
      console.error('Save category error:', err);
      setFormError(err?.message || 'Gagal menyimpan kategori.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!catToDelete) return;
    setIsDeleting(true);
    const userUid = adminUser?.uid || 'admin';
    const userName = adminUser?.displayName || adminUser?.username || 'Admin';

    await deleteCategory(catToDelete.id, catToDelete.name, userUid, userName);
    setIsDeleting(false);
    setDeleteModalOpen(false);
    setCatToDelete(null);
    await loadData();
  };

  const handleSeedDefaults = async () => {
    setLoading(true);
    await seedInitialCategories(adminUser?.uid || 'system');
    await loadData();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DCDCD5]">
        <div>
          <h2 className="text-xl font-bold text-[#151515] tracking-tight">
            Manajemen Kategori Hijab
          </h2>
          <p className="text-xs text-[#6D6D68] mt-0.5">
            Atur pengelompokan produk seperti Paris, Pashmina, Segi Empat, Hijab Jadul, dll.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {categories.length === 0 && (
            <button
              onClick={handleSeedDefaults}
              className="flex items-center gap-2 px-4 py-2 bg-[#E7E7E0] hover:bg-[#DCDCD5] text-[#151515] rounded-xl text-xs font-semibold tracking-wider uppercase transition-all"
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Inisialisasi Kategori Default</span>
            </button>
          )}

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 bg-[#151515] text-[#F8F8F4] hover:bg-[#2A2A2A] rounded-xl text-xs font-semibold tracking-wider uppercase transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Kategori</span>
          </button>
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-[#F8F8F4] border border-[#DCDCD5] rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#DCDCD5] bg-[#F3F3EE] text-[#6D6D68]">
                <th className="py-3 px-4 uppercase tracking-wider w-16">Urutan</th>
                <th className="py-3 px-4 uppercase tracking-wider">Nama Kategori</th>
                <th className="py-3 px-4 uppercase tracking-wider">Slug URL</th>
                <th className="py-3 px-4 uppercase tracking-wider">Deskripsi</th>
                <th className="py-3 px-4 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E7E0]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-[#6D6D68]">
                    Memuat kategori...
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-[#6D6D68]">
                    Belum ada kategori terdaftar. Klik 'Inisialisasi Kategori Default' untuk membuat kategori standar.
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-[#F3F3EE]/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#151515]">
                      #{cat.sortOrder || 0}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#151515] uppercase tracking-wide">
                      {cat.name}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-[#6D6D68]">
                      /{cat.slug}
                    </td>
                    <td className="py-3.5 px-4 text-[#6D6D68] max-w-xs truncate">
                      {cat.description || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(cat)}
                          title="Edit"
                          className="p-1.5 text-[#6D6D68] hover:text-[#151515] hover:bg-[#E7E7E0] rounded-lg transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setCatToDelete(cat);
                            setDeleteModalOpen(true);
                          }}
                          title="Hapus"
                          className="p-1.5 text-[#6D6D68] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Create/Edit Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#F8F8F4] border border-[#DCDCD5] rounded-3xl p-6 shadow-2xl space-y-4">
            <div>
              <h3 className="text-base font-bold text-[#151515] uppercase tracking-tight">
                {editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
              </h3>
              <p className="text-xs text-[#6D6D68]">
                Kategori akan muncul di navigasi filter katalog publik.
              </p>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#151515] mb-1">
                  Nama Kategori <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="Contoh: Paris, Pashmina, Segi Empat"
                  className="w-full px-3.5 py-2.5 bg-[#F3F3EE] border border-[#DCDCD5] rounded-xl text-xs text-[#151515] focus:outline-hidden focus:border-[#151515]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#151515] mb-1">
                  Urutan Tampil (Sort Order)
                </label>
                <input
                  type="number"
                  min="0"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F3F3EE] border border-[#DCDCD5] rounded-xl text-xs text-[#151515] focus:outline-hidden focus:border-[#151515]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#151515] mb-1">
                  Deskripsi Kategori (Opsional)
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Keterangan singkat mengenai bahan atau karakteristik hijab..."
                  className="w-full px-3.5 py-2.5 bg-[#F3F3EE] border border-[#DCDCD5] rounded-xl text-xs text-[#151515] focus:outline-hidden focus:border-[#151515]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-semibold text-[#151515] bg-[#E7E7E0] hover:bg-[#DCDCD5] rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 text-xs font-semibold tracking-wider uppercase text-white bg-[#151515] hover:bg-[#2A2A2A] rounded-xl transition-colors shadow-xs disabled:opacity-50"
                >
                  {isSaving ? 'Menyimpan...' : 'Simpan Kategori'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        title={`Hapus Kategori ${catToDelete?.name || ''}?`}
        message="Kategori yang dihapus tidak akan lagi muncul pada filter katalog publik. Produk yang terkait tidak akan terhapus."
        confirmLabel="Hapus Kategori"
        cancelLabel="Batal"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setCatToDelete(null);
        }}
      />
    </div>
  );
};
