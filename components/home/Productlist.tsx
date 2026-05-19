import ProductCard from "@/components/home/ProductCard";
import EmptyState from "@/components/ui/EmptyState";
import type { Food } from "@/features/food/food.types";

type ProductlistProps = {
  description?: string;
  foods: Food[];
  isLoading?: boolean;
  onAddToCart?: (food: Food) => void;
  title: string;
};

export default function Productlist({
  description,
  foods,
  isLoading = false,
  onAddToCart,
  title,
}: ProductlistProps) {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-[1.8rem] font-bold tracking-tight text-white lg:text-[2.2rem]">
            {title}
          </h2>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm leading-7 text-white/52">
              {description}
            </p>
          ) : null}
        </div>

        <div className="dashboard-pill inline-flex items-center rounded-full px-4 py-2 text-sm text-white/62">
          {foods.length} items
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              className="dashboard-card h-[26rem] animate-pulse rounded-[1.8rem]"
              key={index}
            />
          ))}
        </div>
      ) : foods.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {foods.map((food) => (
            <ProductCard food={food} key={food.id} onAddToCart={onAddToCart} />
          ))}
        </div>
      ) : (
        <EmptyState
          description="Try another category or add more products from the backend menu."
          title="No dishes found."
        />
      )}
    </section>
  );
}
