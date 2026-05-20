"use client";

import Link from "next/link";

import OrderSummary from "@/components/order/OrderSummary";
import TopBar from "@/components/layout/TopBar";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Loader from "@/components/ui/Loader";
import PageHeader from "@/components/ui/PageHeader";
import Toast from "@/components/ui/Toast";
import { useCart } from "@/features/cart/cart.hooks";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/lib/helpers";

export default function CartPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { cart, error, isLoading, isMutating, removeItem, updateItem } = useCart(
    isAuthenticated
  );

  if (authLoading || isLoading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <Loader />
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="space-y-6">
        <PageHeader
          description="Sign in to sync your basket and continue the checkout flow."
          eyebrow="Cart"
          title="Сагс"
        />
        <EmptyState
          action={
            <Button asChild>
              <Link href="/auth/login?redirect=/protected/cart">Go to login</Link>
            </Button>
          }
          description="The cart route is protected by your backend session endpoint."
          title="Sign in to open your cart."
        />
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <TopBar searchPlaceholder="Search your cart items" />
      <PageHeader
        description="Review quantities, remove items, and move directly into the premium checkout flow."
        eyebrow="Cart"
        title="Сагс"
      />

      {error ? <Toast message={error} tone="error" /> : null}

      {cart && cart.items.length > 0 ? (
        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            {cart.items.map((item) => (
              <Card className="p-5" key={item.id} variant="default">
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-orange-300/72">
                      {item.food.category}
                    </p>
                    <h2 className="font-display mt-2 text-2xl font-semibold text-white">
                      {item.food.name}
                    </h2>
                    <p className="mt-4 max-w-xl text-sm leading-7 text-white/58">
                      {item.food.description ?? "Freshly synced menu item from backend."}
                    </p>
                  </div>

                  <div className="flex flex-col items-start gap-4 md:items-end">
                    <p className="text-xl font-semibold text-orange-300">
                      {formatCurrency(item.food.price * item.quantity)}
                    </p>
                    <div className="flex items-center gap-3">
                      <Button
                        disabled={isMutating || item.quantity <= 1}
                        onClick={() => {
                          void updateItem(item.foodId, item.quantity - 1);
                        }}
                        size="sm"
                        variant="secondary"
                      >
                        -
                      </Button>
                      <span className="min-w-8 text-center text-sm text-white/78">
                        {item.quantity}
                      </span>
                      <Button
                        disabled={isMutating}
                        onClick={() => {
                          void updateItem(item.foodId, item.quantity + 1);
                        }}
                        size="sm"
                        variant="secondary"
                      >
                        +
                      </Button>
                    </div>
                    <Button
                      disabled={isMutating}
                      onClick={() => {
                        void removeItem(item.foodId);
                      }}
                      size="sm"
                      variant="ghost"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="space-y-4">
            <OrderSummary items={cart.items} subtotal={cart.subtotal} />
            <Button asChild fullWidth size="lg" variant="secondary">
              <Link href="/menu">Add food</Link>
            </Button>
            <Button asChild fullWidth size="lg">
              <Link href="/protected/order">Continue to checkout</Link>
            </Button>
          </div>
        </section>
      ) : (
        <EmptyState
          action={
            <Button asChild>
              <Link href="/public/explore">Explore menu</Link>
            </Button>
          }
          description="Add products from the explore page and they will show up here instantly."
          title="Your cart is empty."
        />
      )}
    </main>
  );
}
