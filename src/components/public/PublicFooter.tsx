import React from 'react';
import { Instagram, MessageCircle, ShoppingBag, Shield } from 'lucide-react';
import { StoreSettings } from '../../types';

interface PublicFooterProps {
  settings: StoreSettings;
  onOpenAdmin: () => void;
}

export const PublicFooter: React.FC<PublicFooterProps> = ({ settings, onOpenAdmin }) => {
  return (
    <footer className="bg-[#E7E7E0] border-t border-[#DCDCD5] pt-12 pb-8 text-[#151515]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-3">
            <h3 className="text-2xl font-bold tracking-widest uppercase font-heading">
              {settings.storeName || 'CLO.EAST'}
            </h3>
            <p className="text-sm text-[#6D6D68] max-w-md leading-relaxed">
              {settings.storeDescription || 'Modern hijab catalog and boutique stock management. Timeless pieces curated for daily modest elegance.'}
            </p>
            {settings.address && (
              <p className="text-xs text-[#6D6D68] font-light">
                {settings.address}
              </p>
            )}
          </div>

          {/* Customer Care / Marketplace */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#151515]">
              Marketplace & Order
            </h4>
            <ul className="space-y-2 text-sm text-[#6D6D68]">
              {settings.whatsappNumber && (
                <li>
                  <a
                    href={`https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#151515] transition-colors flex items-center gap-1.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    WhatsApp Order
                  </a>
                </li>
              )}
              {settings.shopeeUrl && (
                <li>
                  <a
                    href={settings.shopeeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#151515] transition-colors"
                  >
                    Shopee Official
                  </a>
                </li>
              )}
              {settings.tokopediaUrl && (
                <li>
                  <a
                    href={settings.tokopediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#151515] transition-colors"
                  >
                    Tokopedia Store
                  </a>
                </li>
              )}
              {settings.tiktokShopUrl && (
                <li>
                  <a
                    href={settings.tiktokShopUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#151515] transition-colors"
                  >
                    TikTok Shop
                  </a>
                </li>
              )}
            </ul>
          </div>

          {/* Social & Admin Portal */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#151515]">
              Follow Us & Portal
            </h4>
            <ul className="space-y-2 text-sm text-[#6D6D68]">
              {settings.instagramHandle && (
                <li>
                  <a
                    href={`https://instagram.com/${settings.instagramHandle.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#151515] transition-colors flex items-center gap-1.5"
                  >
                    <Instagram className="w-3.5 h-3.5" />
                    {settings.instagramHandle}
                  </a>
                </li>
              )}
              <li>
                <button
                  onClick={onOpenAdmin}
                  className="hover:text-[#151515] transition-colors flex items-center gap-1.5 text-xs text-[#6D6D68]"
                >
                  <Shield className="w-3.5 h-3.5" />
                  Staff / Admin Login
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-[#DCDCD5] flex flex-col sm:flex-row items-center justify-between text-xs text-[#6D6D68] gap-3">
          <p>&copy; {new Date().getFullYear()} {settings.storeName || 'CLO.EAST'}. All rights reserved.</p>
          <p className="tracking-widest uppercase font-mono text-[10px]">
            Curated Hijab & Inventory System
          </p>
        </div>
      </div>
    </footer>
  );
};
