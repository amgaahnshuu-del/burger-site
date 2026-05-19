import Image from "next/image";
import Link from "next/link";
import { HeartIcon } from "@heroicons/react/24/outline";
import { ArrowRightIcon } from "@heroicons/react/24/solid";

import { formatCurrency } from "@/lib/helpers";

type ComboBannerProps = {
  price?: number;
};

export default function ComboBanner({ price = 24900 }: ComboBannerProps) {
  return (
    <section className="group relative overflow-hidden rounded-[2.2rem] border border-orange-500/14 bg-[linear-gradient(135deg,rgba(29,17,13,0.98)_0%,rgba(13,11,12,0.99)_52%,rgba(9,9,10,1)_100%)] p-5 shadow-[0_30px_84px_rgba(0,0,0,0.42)] sm:p-7">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(255,152,92,0.2),transparent_20%),radial-gradient(circle_at_84%_26%,rgba(255,68,0,0.2),transparent_24%),linear-gradient(135deg,rgba(255,255,255,0.04)_0%,transparent_34%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)]" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-28 w-28 rounded-full bg-orange-500/12 blur-3xl" />

      <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:items-center lg:gap-8">
        <div className="max-w-2xl">
          <div className="flex items-start justify-between gap-3">
            <span className="inline-flex items-center rounded-full border border-orange-300/18 bg-orange-500/12 px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.32em] text-orange-200">
              Signature combo
            </span>
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/24 text-white/72 backdrop-blur">
              <HeartIcon className="h-5 w-5" />
            </span>
          </div>

          <h3 className="mt-5 max-w-xl text-[2.35rem] font-black leading-[0.94] tracking-[-0.05em] text-white sm:text-[3rem]">
            Burger, fries, and cola in one sharper visual.
          </h3>
          <p className="mt-4 max-w-xl text-sm leading-7 text-white/62 sm:text-[0.96rem]">
            A cleaner promo block for your best-selling combo, with a richer glow,
            stronger hierarchy, and a more premium product spotlight.
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5">
            {["Bold presentation", "Fast craving pick", "Best for combo promos"].map((item) => (
              <span
                className="rounded-full border border-white/8 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-white/70"
                key={item}
              >
                {item}
              </span>
            ))}
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <p className="text-[0.68rem] uppercase tracking-[0.28em] text-white/34">
                Starting at
              </p>
              <p className="mt-2 text-[1.9rem] font-black tracking-[-0.04em] text-white">
                {formatCurrency(price)}
              </p>
            </div>

            <Link
              className="inline-flex min-h-12 items-center justify-center gap-3 rounded-[1.1rem] bg-orange-500 px-5 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(255,106,0,0.28)] transition hover:-translate-y-0.5 hover:bg-orange-400"
              href="/public/explore"
            >
              Explore menu
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[360px] rounded-[2rem] border border-white/8 bg-[radial-gradient(circle_at_50%_22%,rgba(255,255,255,0.08),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.015)_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_24px_54px_rgba(0,0,0,0.38)]">
          <div className="pointer-events-none absolute -left-7 bottom-5 h-24 w-24 rounded-full bg-orange-500/16 blur-3xl" />
          <div className="pointer-events-none absolute -right-5 top-8 h-24 w-24 rounded-full bg-red-500/16 blur-3xl" />
          <div className="pointer-events-none absolute inset-x-10 top-5 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.34),transparent)]" />

          <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/26 px-3 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-white/64 backdrop-blur">
            Burger combo
          </div>
          <div className="absolute bottom-4 right-4 rounded-full border border-orange-300/16 bg-orange-500/10 px-3 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-orange-100">
            Premium look
          </div>

          <div className="relative h-[230px] w-full sm:h-[260px]">
            <Image
              alt="Combo meal"
              className="object-contain object-center drop-shadow-[0_28px_50px_rgba(0,0,0,0.55)] transition duration-500 group-hover:scale-[1.05] group-hover:-translate-y-1"
              fill
              sizes="(max-width: 1024px) 100vw, 360px"
              src="/home-crops/combo-clean-v2.png"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
