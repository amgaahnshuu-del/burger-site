import Image from "next/image";
import Link from "next/link";
import {
  BoltIcon,
  FireIcon as FireOutlineIcon,
  ShieldCheckIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import { ArrowRightIcon, FireIcon as FireSolidIcon } from "@heroicons/react/24/solid";

import Container from "@/components/layout/Container";

const HERO_COPY = {
  badge: "\u0425\u0410\u041b\u0423\u0423\u041d \u0428\u0418\u041d\u042d \u0425\u041e\u041e\u041b",
  descriptionFirst:
    "\u0428\u0438\u043d\u044d\u0445\u044d\u043d \u043e\u0440\u0446, \u0445\u0430\u043b\u0443\u0443\u043d \u0441\u044d\u0442\u0433\u044d\u043b\u044d\u044d\u0440",
  descriptionSecond:
    "\u0442\u0430\u043d\u044c\u0434 \u0445\u04af\u0440\u0433\u044d\u0436 \u0431\u0430\u0439\u043d\u0430.",
  headingAccent: "захиал!",
  headingFirst: "\u0425\u0430\u043c\u0433\u0438\u0439\u043d \u0430\u043c\u0442\u0442\u0430\u0439",
  headingSecond: "\u0431\u0443\u0440\u0433\u0435\u0440\u044b\u0433",
  primaryCta: "\u0417\u0430\u0445\u0438\u0430\u043b\u0430\u0445",
  secondaryCta: "\u0426\u044d\u0441 \u04af\u0437\u044d\u0445",
} as const;

const HERO_FEATURES = [
  {
    description: "30-60 \u043c\u0438\u043d\u0443\u0442\u0442\u0430\u0439",
    icon: BoltIcon,
    title: "\u0422\u04af\u0440\u0433\u044d\u043d \u0445\u04af\u0440\u0433\u044d\u043b\u0442",
  },
  {
    description: "\u0428\u0438\u043d\u044d\u0445\u044d\u043d, \u0445\u0430\u043b\u0443\u0443\u043d",
    icon: FireOutlineIcon,
    title: "\u0425\u0430\u043b\u0443\u0443\u043d \u0445\u043e\u043e\u043b",
  },
  {
    description:
      "\u0427\u0430\u043d\u0430\u0440\u0442\u0430\u0439 \u0431\u0430\u0442\u0430\u043b\u0433\u0430\u0430\u0442\u0430\u0439",
    icon: ShieldCheckIcon,
    title: "\u0410\u044e\u0443\u043b\u0433\u04af\u0439 \u043e\u0440\u0446",
  },
  {
    description:
      "\u0442\u04e9\u043b\u0431\u04e9\u0440\u0438\u0439\u043d \u0441\u043e\u043d\u0433\u043e\u043b\u0442",
    icon: Squares2X2Icon,
    title: "\u041e\u043b\u043e\u043d \u0442\u04e9\u0440\u043b\u0438\u0439\u043d",
  },
] as const;

function FeatureStrip() {
  return (
    <div className="grid gap-3 bg-[#000000] px-4 pb-4 sm:grid-cols-2 lg:grid-cols-4 lg:rounded-[1.65rem] lg:border lg:border-white/6 lg:bg-[#161616]/92 lg:px-6 lg:py-5 lg:backdrop-blur-sm">
      {HERO_FEATURES.map((feature) => {
        const Icon = feature.icon;

        return (
          <article
            className="flex items-start gap-3 rounded-[1rem] border border-white/6 bg-[#161616] px-4 py-4 lg:border-0 lg:bg-transparent lg:px-2 lg:py-1"
            key={feature.title}
          >
            <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[0.9rem] border border-orange-500/24 bg-[#1b140f] text-orange-400">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white lg:text-base">
                {feature.title}
              </p>
              <p className="mt-1 text-sm text-white/52">{feature.description}</p>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function HeroContent() {
  return (
    <div className="max-w-[19rem] lg:max-w-[48rem] lg:ml-10">
      <span className="inline-flex items-center gap-2 rounded-[1rem] bg-orange-500 px-4 py-2 text-[0.72rem] font-semibold tracking-[0.04em] text-white shadow-[0_14px_32px_rgba(255,106,0,0.28)] lg:px-5 lg:py-2.5 lg:text-sm">
        <FireSolidIcon className="h-4 w-4" />
        {HERO_COPY.badge}
      </span>

      <h1 className="mt-6 text-[3rem] font-black leading-[0.92] tracking-[-0.05em] text-white sm:text-[3.6rem] lg:mt-7 lg:max-w-none lg:text-[5rem]">
        <span className="block lg:whitespace-nowrap">{HERO_COPY.headingFirst}</span>
        <span className="block lg:whitespace-nowrap">
          {HERO_COPY.headingSecond}{" "}
          <span className="text-orange-500">{HERO_COPY.headingAccent}</span>
        </span>
      </h1>

      <p className="mt-5 max-w-[20rem] text-base leading-8 text-white/68 lg:mt-6 lg:max-w-[27rem] lg:text-[1.15rem] lg:leading-10">
        <span className="block">{HERO_COPY.descriptionFirst}</span>
        <span className="block">{HERO_COPY.descriptionSecond}</span>
      </p>

      <div className="mt-7 flex flex-wrap gap-3 lg:mt-8 lg:gap-4">
        <Link
          className="inline-flex min-h-12 items-center justify-center gap-3 rounded-[1.1rem] bg-orange-500 px-6 text-base font-semibold text-white transition hover:bg-[#ff812d] lg:min-h-14 lg:rounded-[1.25rem] lg:px-8 lg:text-lg"
          href="#popular-menu"
        >
          <span>{HERO_COPY.primaryCta}</span>
          <ArrowRightIcon className="h-5 w-5" />
        </Link>
        <Link
          className="inline-flex min-h-12 items-center justify-center rounded-[1.1rem] bg-[#161616] px-6 text-base font-medium text-white transition hover:bg-[#1d1d1d] lg:min-h-14 lg:rounded-[1.25rem] lg:px-8 lg:text-lg"
          href="/public/explore"
        >
          {HERO_COPY.secondaryCta}
        </Link>
      </div>
    </div>
  );
}

export default function Hero() {
  return (
    <section className="pb-6 lg:pb-8">
      <div className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden bg-black">
        <div className="relative min-h-[34rem] lg:min-h-[52rem]">
          <Image
            alt="Burger hero background"
            className="object-cover object-[71%_50%] brightness-[1.18] contrast-[1.06] saturate-[1.08]"
            fill
            priority
            sizes="100vw"
            src="/hero-ref/hero-bg-clean.jpg"
          />
          <div className="pointer-events-none absolute  bg-[linear-gradient(180deg,rgba(0,0,0,0.2)_0%,rgba(0,0,0,0.42)_18%,rgba(0,0,0,0.72)_42%,rgba(0,0,0,0.92)_100%)] lg:bg-[linear-gradient(90deg,rgba(0,0,0,0.88)_0%,rgba(0,0,0,0.76)_28%,rgba(0,0,0,0.38)_56%,rgba(0,0,0,0.1)_100%)]" />
          <div className="pointer-events-none absolute bg-[radial-gradient(circle_at_74%_28%,rgba(255,106,0,0.24),transparent_28%)]" />

          <Container className="relative z-10 lg:max-w-none lg:px-4 xl:px-6">
            <div className="flex min-h-[34rem] flex-col justify-center px-1 pb-10 pt-24 sm:px-2 lg:min-h-[52rem] lg:px-0 lg:pb-40 lg:pt-28">
              <HeroContent />
            </div>
          </Container>

          <div className="relative z-10 lg:absolute lg:bottom-7 lg:left-1/2 lg:w-full lg:max-w-[1180px] lg:-translate-x-1/2 lg:px-0">
            <Container className="max-w-[1180px] lg:px-0">
              <FeatureStrip />
            </Container>
          </div>
        </div>
      </div>
    </section>
  );
}
