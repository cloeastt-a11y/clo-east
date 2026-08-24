import React from 'react';
import { ArrowDown } from 'lucide-react';

interface PublicHeroProps {
  onExploreClick: () => void;
}

export const PublicHero: React.FC<PublicHeroProps> = ({ onExploreClick }) => {
  return (
    <section className="relative overflow-hidden py-12 sm:py-20 border-b border-[#DCDCD5] bg-gradient-to-b from-[#F8F8F4] to-[#F3F3EE]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Editorial Brand Eyebrow */}
        <p className="text-xs uppercase tracking-[0.3em] text-[#6D6D68] font-medium mb-3">
          CLO.EAST Modest Studio
        </p>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#151515] uppercase font-heading max-w-3xl mx-auto">
          Curated Hijab Collection
        </h1>

        {/* Hero Tagline */}
        <p className="mt-4 text-base sm:text-lg text-[#6D6D68] max-w-xl mx-auto font-light leading-relaxed">
          Timeless pieces for everyday wear. Dibuat dengan material premium, tekstur breathable, dan varian warna signature yang elegan.
        </p>

        {/* CTA */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={onExploreClick}
            className="group flex items-center gap-3 px-8 py-3.5 bg-[#151515] text-[#F8F8F4] hover:bg-[#2A2A2A] rounded-full text-sm font-medium tracking-wider uppercase transition-all shadow-xs hover:shadow-md active:scale-98"
          >
            <span>Explore Collection</span>
            <ArrowDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
          </button>
        </div>
      </div>
    </section>
  );
};
