import React from 'react';
import { Category } from '../../types';

interface CategoryNavProps {
  categories: Category[];
  selectedCategoryId: string;
  onSelectCategory: (id: string) => void;
}

export const CategoryNav: React.FC<CategoryNavProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
}) => {
  return (
    <div className="py-6 overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-2 sm:gap-3 min-w-max pb-1">
        {/* ALL Pill */}
        <button
          type="button"
          onClick={() => onSelectCategory('all')}
          className={`px-5 py-2 rounded-full text-xs font-semibold tracking-wider uppercase transition-all ${
            selectedCategoryId === 'all'
              ? 'bg-[#151515] text-[#F8F8F4] shadow-xs'
              : 'bg-[#F8F8F4] text-[#6D6D68] hover:text-[#151515] hover:bg-[#E7E7E0] border border-[#DCDCD5]'
          }`}
        >
          ALL
        </button>

        {/* Dynamic Categories */}
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelectCategory(cat.id)}
            className={`px-5 py-2 rounded-full text-xs font-semibold tracking-wider uppercase transition-all ${
              selectedCategoryId === cat.id
                ? 'bg-[#151515] text-[#F8F8F4] shadow-xs'
                : 'bg-[#F8F8F4] text-[#6D6D68] hover:text-[#151515] hover:bg-[#E7E7E0] border border-[#DCDCD5]'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
};
