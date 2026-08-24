import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2, AlertCircle, Store, Shield, Phone, Instagram } from 'lucide-react';
import { StoreSettings } from '../../types';
import { getStoreSettings, updateStoreSettings } from '../../services/settingsService';
import { useAuth } from '../../context/AuthContext';

export const AdminSettingsPage: React.FC = () => {
  const { adminUser } = useAuth();
  const [settings, setSettings] = useState<StoreSettings>({
    storeName: 'CLO.EAST',
    storeTagline: 'Curated Hijab Collection',
    storeDescription: 'Timeless modest pieces for everyday wear with signature color palettes.',
    whatsappNumber: '628123456789',
    instagramHandle: '@clo.east',
    shopeeUrl: 'https://shopee.co.id',
    tokopediaUrl: 'https://tokopedia.com',
    tiktokShopUrl: 'https://tiktok.com',
    defaultCurrency: 'IDR',
    enableStockBadges: true,
    lowStockThreshold: 5,
    address: 'Bandung Timur, Jawa Barat, Indonesia',
  });

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await getStoreSettings();
      setSettings(data);
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const userUid = adminUser?.uid || 'admin';
    const userName = adminUser?.displayName || adminUser?.username || 'Admin';

    try {
      await updateStoreSettings(settings, userUid, userName);
      setSuccessMsg('Pengaturan toko berhasil diperbarui di Firestore.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error('Settings update error:', err);
      setErrorMsg(err?.message || 'Gagal menyimpan pengaturan.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DCDCD5]">
        <div>
          <h2 className="text-xl font-bold text-[#151515] tracking-tight">
            Pengaturan Toko & Marketplace
          </h2>
          <p className="text-xs text-[#6D6D68] mt-0.5">
            Konfigurasi informasi publik butik, link pemesanan WhatsApp, dan akun marketplace.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-xs text-emerald-800">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-xs text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* General Store Info */}
        <div className="bg-[#F8F8F4] border border-[#DCDCD5] rounded-3xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#151515] flex items-center gap-2">
            <Store className="w-4 h-4 text-[#6D6D68]" />
            <span>Identitas Butik</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#151515] mb-1">
                Nama Brand Toko
              </label>
              <input
                type="text"
                required
                value={settings.storeName}
                onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#F3F3EE] border border-[#DCDCD5] rounded-xl text-xs text-[#151515] focus:outline-hidden focus:border-[#151515]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#151515] mb-1">
                Slogan / Tagline
              </label>
              <input
                type="text"
                value={settings.storeTagline}
                onChange={(e) => setSettings({ ...settings, storeTagline: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#F3F3EE] border border-[#DCDCD5] rounded-xl text-xs text-[#151515] focus:outline-hidden focus:border-[#151515]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#151515] mb-1">
                Deskripsi Toko
              </label>
              <textarea
                rows={2}
                value={settings.storeDescription}
                onChange={(e) => setSettings({ ...settings, storeDescription: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#F3F3EE] border border-[#DCDCD5] rounded-xl text-xs text-[#151515] focus:outline-hidden focus:border-[#151515]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#151515] mb-1">
                Alamat / Lokasi Operasional
              </label>
              <input
                type="text"
                value={settings.address || ''}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#F3F3EE] border border-[#DCDCD5] rounded-xl text-xs text-[#151515] focus:outline-hidden focus:border-[#151515]"
              />
            </div>
          </div>
        </div>

        {/* Contact & Social Links */}
        <div className="bg-[#F8F8F4] border border-[#DCDCD5] rounded-3xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#151515] flex items-center gap-2">
            <Phone className="w-4 h-4 text-[#6D6D68]" />
            <span>Kontak & Channel Marketplace</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#151515] mb-1">
                Nomor WhatsApp Order (Format 62...)
              </label>
              <input
                type="text"
                value={settings.whatsappNumber}
                onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                placeholder="628123456789"
                className="w-full px-3.5 py-2.5 bg-[#F3F3EE] border border-[#DCDCD5] rounded-xl text-xs text-[#151515] focus:outline-hidden focus:border-[#151515]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#151515] mb-1">
                Username Instagram
              </label>
              <input
                type="text"
                value={settings.instagramHandle}
                onChange={(e) => setSettings({ ...settings, instagramHandle: e.target.value })}
                placeholder="@clo.east"
                className="w-full px-3.5 py-2.5 bg-[#F3F3EE] border border-[#DCDCD5] rounded-xl text-xs text-[#151515] focus:outline-hidden focus:border-[#151515]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#151515] mb-1">
                URL Shopee Store
              </label>
              <input
                type="url"
                value={settings.shopeeUrl}
                onChange={(e) => setSettings({ ...settings, shopeeUrl: e.target.value })}
                placeholder="https://shopee.co.id/..."
                className="w-full px-3.5 py-2.5 bg-[#F3F3EE] border border-[#DCDCD5] rounded-xl text-xs text-[#151515] focus:outline-hidden focus:border-[#151515]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#151515] mb-1">
                URL Tokopedia Store
              </label>
              <input
                type="url"
                value={settings.tokopediaUrl}
                onChange={(e) => setSettings({ ...settings, tokopediaUrl: e.target.value })}
                placeholder="https://tokopedia.com/..."
                className="w-full px-3.5 py-2.5 bg-[#F3F3EE] border border-[#DCDCD5] rounded-xl text-xs text-[#151515] focus:outline-hidden focus:border-[#151515]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#151515] mb-1">
                URL TikTok Shop
              </label>
              <input
                type="url"
                value={settings.tiktokShopUrl}
                onChange={(e) => setSettings({ ...settings, tiktokShopUrl: e.target.value })}
                placeholder="https://tiktok.com/@..."
                className="w-full px-3.5 py-2.5 bg-[#F3F3EE] border border-[#DCDCD5] rounded-xl text-xs text-[#151515] focus:outline-hidden focus:border-[#151515]"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#151515] text-[#F8F8F4] hover:bg-[#2A2A2A] rounded-xl text-xs font-semibold tracking-wider uppercase transition-all shadow-xs disabled:opacity-50"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Simpan Pengaturan</span>
          </button>
        </div>
      </form>
    </div>
  );
};
