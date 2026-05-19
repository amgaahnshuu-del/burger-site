type CategoryProps = {
  activeCategory: string;
  categories: string[];
  onSelect: (category: string) => void;
};

export default function Category({
  activeCategory,
  categories,
  onSelect,
}: CategoryProps) {
  return (
    <section className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="dashboard-card-soft flex min-w-max gap-3 rounded-[24px] p-2">
        {categories.map((category) => {
          const active = activeCategory === category;

          return (
            <button
              className={
                active
                  ? "rounded-[18px] border border-orange-300/18 bg-[linear-gradient(180deg,#ff7a1a_0%,#ff5a00_100%)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(255,90,0,0.24)] lg:px-5 lg:py-3"
                  : "rounded-[18px] border border-transparent bg-transparent px-4 py-2.5 text-sm font-medium text-white/62 transition hover:bg-white/[0.04] hover:text-white lg:px-5 lg:py-3"
              }
              key={category}
              onClick={() => onSelect(category)}
              type="button"
            >
              {category}
            </button>
          );
        })}
      </div>
    </section>
  );
}
