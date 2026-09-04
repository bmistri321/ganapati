import React from 'react';
import { ProductCard } from './ProductCard';
import { ChevronRight, Layers } from 'lucide-react';

export const CategoryShelf = ({ 
  categoryName, 
  products, 
  onSelectProduct, 
  onViewCategory 
}) => {
  if (!products || products.length === 0) return null;

  return (
    <section className="space-y-4 pt-2">
      {/* Category Section Header */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            {categoryName}
          </h2>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
            {products.length} {products.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        {onViewCategory && (
          <button
            type="button"
            onClick={() => onViewCategory(categoryName)}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded transition-all flex items-center gap-1 group"
          >
            <span>See All</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>

      {/* Products Grid (High Density) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onSelectProduct={onSelectProduct}
          />
        ))}
      </div>
    </section>
  );
};
