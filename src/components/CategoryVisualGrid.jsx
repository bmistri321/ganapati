import React from 'react';
import { Package, Sparkles, LayoutGrid, ChevronRight } from 'lucide-react';

export const CategoryVisualGrid = ({ 
  categories, 
  products, 
  selectedCategory, 
  onSelectCategory 
}) => {
  // Build metadata for each category
  const categoryData = categories.map((cat) => {
    if (cat === 'All Products') {
      return {
        name: 'All Products',
        count: products.length,
        images: products.filter((p) => p.image).slice(0, 3).map((p) => p.image),
        isAll: true
      };
    }

    const catProds = products.filter(
      (p) => p.category && p.category.toLowerCase() === cat.toLowerCase()
    );

    return {
      name: cat,
      count: catProds.length,
      images: catProds.filter((p) => p.image).slice(0, 3).map((p) => p.image),
      isAll: false
    };
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight uppercase">
            Explore By Categories
          </h2>
        </div>
        <span className="text-xs text-slate-500 font-medium">
          {categories.length - 1} categories available
        </span>
      </div>

      {/* Visual Category Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        {categoryData.map((cat) => {
          const isSelected = selectedCategory === cat.name;
          const hasImages = cat.images.length > 0;

          return (
            <button
              key={cat.name}
              type="button"
              onClick={() => onSelectCategory(cat.name)}
              className={`group relative p-3 sm:p-4 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer ${
                isSelected
                  ? 'bg-emerald-50/80 border-emerald-600 shadow-md ring-2 ring-emerald-500/20'
                  : 'bg-white hover:bg-slate-50 border-slate-200/80 hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              {/* Card Image / Preview Area */}
              <div className="w-full aspect-[4/3] rounded-lg bg-slate-100 mb-2.5 overflow-hidden flex items-center justify-center relative">
                {cat.isAll ? (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-teal-700 flex flex-col items-center justify-center text-white p-2">
                    <LayoutGrid className="w-8 h-8 opacity-90 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold mt-1 uppercase tracking-wider">
                      All Items
                    </span>
                  </div>
                ) : hasImages ? (
                  <img
                    src={cat.images[0]}
                    alt={cat.name}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col items-center justify-center text-slate-400 p-2">
                    <Package className="w-7 h-7 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                  </div>
                )}

                {/* Pill count badge */}
                <span className={`absolute top-1.5 right-1.5 text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-sm ${
                  isSelected 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-slate-900/80 text-white backdrop-blur-sm'
                }`}>
                  {cat.count}
                </span>
              </div>

              {/* Title & Chevron */}
              <div className="flex items-center justify-between gap-1 w-full">
                <span className={`text-xs font-bold truncate ${
                  isSelected ? 'text-emerald-900' : 'text-slate-800 group-hover:text-emerald-700'
                }`}>
                  {cat.name}
                </span>
                <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 transition-transform group-hover:translate-x-0.5 ${
                  isSelected ? 'text-emerald-600' : 'text-slate-300'
                }`} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
