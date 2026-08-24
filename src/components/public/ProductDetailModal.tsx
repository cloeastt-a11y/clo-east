import React, { useState, useEffect } from 'react';
import {
  X,
  ExternalLink,
  MessageCircle,
  ShoppingBag,
  Check,
  Share2,
  Copy,
  Sparkles,
  Info,
  ShieldCheck,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { Product, ProductColor } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen?: boolean;
  onClose: () => void;
  whatsappNumber?: string;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen = true,
  onClose,
  whatsappNumber = '628123456789',
}) => {
  // If product is null or isOpen explicitly false, don't render
  if (!product || isOpen === false) return null;

  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Sync selected color on product change
  useEffect(() => {
    if (product?.colors && product.colors.length > 0) {
      setSelectedColor(product.colors[0]);
    } else {
      setSelectedColor(null);
    }
  }, [product]);

  const isOutOfStock = product.status === 'OUT_OF_STOCK' || Number(product.stock) <= 0;
  const isColorOutOfStock = selectedColor && Number(selectedColor.stock) <= 0;

  // Format WhatsApp message
  const cleanWaNumber = (product.links?.whatsapp || whatsappNumber || '628123456789').replace(
    /[^0-9]/g,
    ''
  );
  const colorNameText = selectedColor ? selectedColor.name : 'Standar';
  const waText = encodeURIComponent(
    `Halo CLO.EAST, saya tertarik memesan hijab:\n\n*Produk*: ${product.name}\n*Kategori*: ${
      product.categoryName || 'Hijab Collection'
    }\n*Varian Warna*: ${colorNameText}\n*Harga*: ${formatCurrency(
      product.price
    )}\n\nApakah stok warna ini masih tersedia? Mohon info cara pemesanannya. Terima kasih.`
  );
  const waLink = `https://wa.me/${cleanWaNumber}?text=${waText}`;

  // External marketplace links
  const links = product.links || {};

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-[#F8F8F4] border border-[#DCDCD5] rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col md:flex-row"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2.5 text-[#151515] bg-[#F8F8F4]/90 hover:bg-[#E7E7E0] rounded-full border border-[#DCDCD5] backdrop-blur-md transition-all shadow-xs"
          aria-label="Tutup detail produk"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Column: High-Res Product Image & Swatch Preview */}
        <div className="w-full md:w-1/2 relative bg-[#E7E7E0] border-b md:border-b-0 md:border-r border-[#DCDCD5] flex flex-col justify-center items-center overflow-hidden min-h-[300px] md:min-h-[500px]">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center max-h-[400px] md:max-h-none"
            />
          ) : (
            <div className="w-full h-full min-h-[320px] flex flex-col items-center justify-center p-8 text-center bg-[#ECECE5]">
              <span className="text-xs uppercase tracking-widest text-[#6D6D68] font-semibold">
                CLO.EAST Modest Studio
              </span>
              <h4 className="text-2xl font-bold text-[#151515] mt-2 uppercase font-heading">
                {product.name}
              </h4>
              <p className="text-xs text-[#6D6D68] mt-2">
                {product.categoryName || 'Koleksi Hijab'}
              </p>
            </div>
          )}

          {/* Active color badge overlay on image */}
          {selectedColor && (
            <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-[#F8F8F4]/95 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-[#DCDCD5] shadow-md">
              <span
                className="w-3.5 h-3.5 rounded-full border border-black/20 shadow-2xs"
                style={{ backgroundColor: selectedColor.hex }}
              />
              <span className="text-xs font-bold text-[#151515]">
                {selectedColor.name}
              </span>
              <span className="text-[10px] text-[#6D6D68] border-l border-[#DCDCD5] pl-2 font-medium">
                {Number(selectedColor.stock) > 0
                  ? `Stok: ${selectedColor.stock} pcs`
                  : 'Habis'}
              </span>
            </div>
          )}
        </div>

        {/* Right Column: Full Product Details & E-Commerce Purchase Actions */}
        <div className="w-full md:w-1/2 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto space-y-6">
          <div className="space-y-5">
            {/* Category, SKU & Stock Status Badge */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs uppercase tracking-widest text-[#6D6D68] font-bold">
                {product.categoryName || 'Hijab Collection'}
              </span>

              {isOutOfStock ? (
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#151515] text-[#F8F8F4]">
                  Stok Habis
                </span>
              ) : product.stock <= 5 ? (
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                  Sisa {product.stock} pcs
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300">
                  Tersedia ({product.stock} pcs)
                </span>
              )}
            </div>

            {/* Product Title */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#151515] uppercase tracking-tight font-heading leading-tight">
                {product.name}
              </h2>
              {/* Price */}
              <p className="text-2xl sm:text-3xl font-extrabold text-[#151515] mt-2">
                {formatCurrency(product.price)}
              </p>
            </div>

            {/* Product Description */}
            {product.description ? (
              <div className="space-y-1.5 pt-3 border-t border-[#E7E7E0]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#151515]">
                  Deskripsi & Detail Bahan
                </h4>
                <p className="text-xs sm:text-sm text-[#4A4A45] leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            ) : (
              <div className="space-y-1.5 pt-3 border-t border-[#E7E7E0]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#151515]">
                  Deskripsi Produk
                </h4>
                <p className="text-xs sm:text-sm text-[#6D6D68] leading-relaxed">
                  Material hijab premium pilihan dengan jahitan rapi tepi, tekstur lembut, adem, mudah dibentuk tegak di dahi, dan nyaman untuk penggunaan sehari-hari maupun acara formal.
                </p>
              </div>
            )}

            {/* Color Selection Palette */}
            {product.colors && product.colors.length > 0 && (
              <div className="pt-4 border-t border-[#E7E7E0] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#151515]">
                    Pilihan Warna ({product.colors.length})
                  </label>
                  {selectedColor && (
                    <span className="text-[11px] text-[#6D6D68] font-medium">
                      Pilihan: <strong className="text-[#151515]">{selectedColor.name}</strong>
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => {
                    const isSelected = selectedColor?.id === color.id;
                    const isColorEmpty = Number(color.stock) <= 0;

                    return (
                      <button
                        key={color.id}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={`group relative flex items-center gap-2 px-3.5 py-2 rounded-xl border transition-all ${
                          isSelected
                            ? 'border-[#151515] bg-[#151515] text-[#F8F8F4] shadow-sm ring-2 ring-black/10'
                            : 'border-[#DCDCD5] bg-[#F8F8F4] text-[#151515] hover:border-[#151515]'
                        } ${isColorEmpty ? 'opacity-50' : ''}`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/20 shadow-2xs shrink-0"
                          style={{ backgroundColor: color.hex || '#A78C78' }}
                        />
                        <span className="text-xs font-semibold">{color.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 ml-0.5 text-white" />}
                        {isColorEmpty && (
                          <span className="text-[9px] uppercase tracking-wider ml-1 text-red-500 font-bold">
                            Habis
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* E-Commerce Purchase Actions & Links */}
          <div className="pt-6 border-t border-[#DCDCD5] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#151515]">
                Beli Produk Ini
              </span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="text-[11px] font-medium text-[#6D6D68] hover:text-[#151515] flex items-center gap-1 transition-colors"
                title="Bagikan produk"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-600 font-bold">Link Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3 h-3" />
                    <span>Bagikan</span>
                  </>
                )}
              </button>
            </div>

            {/* Direct WhatsApp Order Button */}
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 bg-[#151515] text-[#F8F8F4] hover:bg-[#2A2A2A] rounded-xl text-xs font-bold tracking-wider uppercase transition-all shadow-md hover:scale-[1.01]"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400 fill-emerald-400" />
              <span>Order Langsung via WhatsApp</span>
            </a>

            {/* Marketplace Link Badges Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {/* Shopee */}
              {links.shopee ? (
                <a
                  href={links.shopee}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-4 py-2.5 bg-[#EE4D2D]/10 hover:bg-[#EE4D2D]/20 text-[#EE4D2D] border border-[#EE4D2D]/30 rounded-xl text-xs font-bold tracking-wider uppercase transition-all"
                >
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4" />
                    <span>Beli di Shopee</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : null}

              {/* Tokopedia */}
              {links.tokopedia ? (
                <a
                  href={links.tokopedia}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-4 py-2.5 bg-[#03AC0E]/10 hover:bg-[#03AC0E]/20 text-[#03AC0E] border border-[#03AC0E]/30 rounded-xl text-xs font-bold tracking-wider uppercase transition-all"
                >
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4" />
                    <span>Beli di Tokopedia</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : null}

              {/* TikTok Shop */}
              {links.tiktokShop ? (
                <a
                  href={links.tiktokShop}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-4 py-2.5 bg-[#151515]/10 hover:bg-[#151515]/20 text-[#151515] border border-[#151515]/30 rounded-xl text-xs font-bold tracking-wider uppercase transition-all"
                >
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4" />
                    <span>TikTok Shop</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : null}

              {/* Lazada */}
              {links.lazada ? (
                <a
                  href={links.lazada}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-4 py-2.5 bg-[#0f146d]/10 hover:bg-[#0f146d]/20 text-[#0f146d] border border-[#0f146d]/30 rounded-xl text-xs font-bold tracking-wider uppercase transition-all"
                >
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4" />
                    <span>Lazada</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : null}
            </div>

            {/* Quality & Service Guarantee Note */}
            <div className="pt-3 flex items-center justify-center gap-4 text-[10px] text-[#6D6D68] uppercase tracking-wider font-semibold border-t border-[#E7E7E0]">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 100% Original
              </span>
              <span>&bull;</span>
              <span>Pengiriman Cepat</span>
              <span>&bull;</span>
              <span>Real Picture</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
