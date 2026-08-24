import React from 'react';
import { Eye, ArrowUpRight } from 'lucide-react';
import { Product } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface ProductCardProps {
  product: Product;
  onClick?: () => void;
  onSelect?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onClick, onSelect }) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (onSelect) {
      onSelect(product);
    }
  };

  const isOutOfStock = product.status === 'OUT_OF_STOCK' || Number(product.stock) <= 0;
  const colors = product.colors || [];

  return (
    <article
      onClick={handleClick}
      className="group cursor-pointer flex flex-col space-y-3 focus:outline-hidden transition-all duration-300"
      tabIndex={0}
      role="button"
      aria-label={`Lihat detail produk ${product.name}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Product Image Container */}
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-[#E7E7E0] border border-[#DCDCD5] shadow-xs group-hover:border-[#151515] group-hover:shadow-md transition-all duration-300">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-[#ECECE5]">
            <span className="text-xs uppercase tracking-widest text-[#6D6D68] font-medium">
              CLO.EAST
            </span>
            <span className="text-sm font-semibold text-[#151515] mt-1 line-clamp-2">
              {product.name}
            </span>
          </div>
        )}

        {/* Stock Badge Overlay */}
        <div className="absolute top-3 left-3 z-10">
          {isOutOfStock ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[#151515]/90 text-[#F8F8F4] backdrop-blur-xs">
              Habis
            </span>
          ) : product.stock <= 5 ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-amber-600 text-white shadow-xs">
              Sisa {product.stock} pcs
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[#F8F8F4]/90 text-[#151515] border border-[#DCDCD5] backdrop-blur-xs">
              Tersedia
            </span>
          )}
        </div>

        {/* Hover Quick Action Indicator */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3 pointer-events-none">
          <div className="w-full py-2 bg-[#F8F8F4]/95 backdrop-blur-md rounded-xl text-center flex items-center justify-center gap-1.5 text-xs font-bold text-[#151515] uppercase tracking-wider shadow-md transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            <Eye className="w-3.5 h-3.5" />
            <span>Lihat Detail</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#6D6D68]" />
          </div>
        </div>
      </div>

      {/* Product Details */}
      <div className="space-y-1">
        {/* Category */}
        <p className="text-[11px] uppercase tracking-wider text-[#6D6D68] font-medium">
          {product.categoryName || 'Hijab Collection'}
        </p>

        {/* Title */}
        <h3 className="text-sm sm:text-base font-semibold text-[#151515] tracking-tight uppercase group-hover:text-black transition-colors line-clamp-1">
          {product.name}
        </h3>

        {/* Price & Colors Row */}
        <div className="flex items-center justify-between pt-1">
          <p className="text-sm sm:text-base font-bold text-[#151515]">
            {formatCurrency(product.price)}
          </p>

          {/* Color Dots */}
          {colors.length > 0 && (
            <div className="flex items-center gap-1.5" title={`${colors.length} varian warna`}>
              {colors.slice(0, 4).map((color, idx) => (
                <span
                  key={color.id || idx}
                  className="w-3 h-3 rounded-full border border-black/15 shadow-2xs inline-block"
                  style={{ backgroundColor: color.hex || '#A78C78' }}
                  title={color.name}
                />
              ))}
              {colors.length > 4 && (
                <span className="text-[10px] text-[#6D6D68] font-medium">
                  +{colors.length - 4}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
};
