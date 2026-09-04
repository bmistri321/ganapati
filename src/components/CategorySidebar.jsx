import React from 'react';
import { LayoutGrid, Package, ChevronRight } from 'lucide-react';

export const CategorySidebar = ({ 
  categories, 
  products, 
  selectedCategory, 
  onSelectCategory 
}) => {
  const categoryData = categories.map((cat) => {
    if (cat === 'All Products') {
      return {
        name: 'All Products',
        displayName: 'All Items',
        count: products.length,
        image: null,
        isAll: true
      };
    }

    const catProds = products.filter(
      (p) => p.category && p.category.toLowerCase() === cat.toLowerCase()
    );
    const firstImage = catProds.find((p) => p.image)?.image || null;

    return {
      name: cat,
      displayName: cat,
      count: catProds.length,
      image: firstImage,
      isAll: false
    };
  });

  return (
    <aside className="w-full lg:w-56 flex-shrink-0">
      {/* Sticky Container on Desktop */}
      <div className="bg-white rounded border border-slate-200/90 shadow-sm overflow-hidden sticky top-20">
        
        {/* Sidebar Header */}
        <div className="p-3 bg-slate-50 border-b border-slate-200/80">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-700">
            Departments
          </h2>
        </div>

        {/* Category List */}
        <div className="flex lg:flex-col overflow-x-auto lg:overflow-visible divide-x lg:divide-x-0 lg:divide-y divide-slate-100 scrollbar-none">
          {categoryData.map((cat) => {
            const isSelected = selectedCategory === cat.name;

            return (
              <button
                key={cat.name}
                type="button"
                onClick={() => onSelectCategory(cat.name)}
                className={`flex-shrink-0 lg:flex-shrink flex items-center gap-3 p-2.5 sm:p-3 text-left transition-all duration-150 relative cursor-pointer group ${
                  isSelected
                    ? 'bg-emerald-50/80 text-emerald-950 font-bold'
                    : 'bg-white hover:bg-slate-50 text-slate-700 font-medium'
                }`}
              >
                {/* Active Left Accent Bar */}
                {isSelected && (
                  <div className="hidden lg:block absolute left-0 top-0 bottom-0 w-1 bg-emerald-600 rounded-r" />
                )}

                {/* Category Thumbnail */}
                <div 
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded overflow-hidden flex-shrink-0 flex items-center justify-center border transition-all ${
                    isSelected
                      ? 'border-emerald-500 bg-white shadow-xs'
                      : 'border-slate-200 bg-slate-50 group-hover:border-slate-300'
                  }`}
                >
                  {cat.isAll ? (
                    <LayoutGrid className="w-5 h-5 text-emerald-600" />
                  ) : cat.image ? (
                    <img
                      src={cat.image}
                      alt={cat.displayName}
                      className="w-full h-full object-contain p-0.5"
                    />
                  ) : (
                    <Package className="w-5 h-5 text-slate-400 group-hover:text-emerald-600" />
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <span className={`block text-xs truncate ${
                    isSelected ? 'text-emerald-900 font-black' : 'text-slate-800'
                  }`}>
                    {cat.displayName}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium block">
                    {cat.count} {cat.count === 1 ? 'item' : 'items'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

      </div>
    </aside>
  );
};
