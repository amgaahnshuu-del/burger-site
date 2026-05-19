import Image from "next/image";
import { SparklesIcon } from "@heroicons/react/24/outline";

import ChatBox from "@/components/ai/ChatBox";

export default function AIAgentPage() {
  return (
    <main className="relative isolate overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[#050505]" />
        <div className="absolute right-[-84px] top-[-66px] h-[240px] w-[240px] rounded-full bg-[rgba(255,118,24,0.16)] blur-[90px]" />
        <div className="absolute left-[20%] top-[4%] h-[140px] w-[140px] rounded-full bg-[rgba(255,140,45,0.07)] blur-[72px]" />
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: "radial-gradient(rgba(255,148,69,0.42) 1px, transparent 1.6px)",
            backgroundSize: "118px 118px",
          }}
        />
      </div>

      <div className="mx-auto w-full max-w-full">
        <section className="relative mb-3 h-[84px] overflow-hidden lg:mb-0 lg:h-[88px]">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(5,5,5,0.98)_0%,rgba(5,5,5,0.84)_44%,rgba(255,110,20,0.04)_100%)]" />
          <div className="pointer-events-none absolute right-[-18px] top-[-10px] hidden h-[118px] w-[190px] rounded-full bg-[radial-gradient(circle,rgba(255,106,0,0.18),transparent_66%)] blur-[34px] lg:block" />
          <div className="pointer-events-none absolute right-[-8px] top-[-16px] hidden h-[122px] w-[198px] lg:block">
            <Image
              alt=""
              aria-hidden
              className="object-cover object-[right_top] opacity-[0.92]"
              fill
              priority
              sizes="198px"
              src="/ai-agenthero.png"
            />
          </div>
          <span className="pointer-events-none absolute left-[34%] top-[10px] hidden h-[3px] w-[3px] rounded-full bg-orange-400/70 shadow-[0_0_12px_rgba(255,106,0,0.65)] lg:block" />
          <span className="pointer-events-none absolute left-[58%] top-[30px] hidden h-[2px] w-[2px] rounded-full bg-orange-300/70 shadow-[0_0_10px_rgba(255,106,0,0.55)] lg:block" />
          <span className="pointer-events-none absolute left-[68%] top-[16px] hidden h-[2px] w-[2px] rounded-full bg-orange-400/60 shadow-[0_0_8px_rgba(255,106,0,0.45)] lg:block" />

          <div className="relative z-10 flex h-full max-w-[480px] flex-col justify-center pl-1 pr-5">
            <div className="flex items-center gap-2.5">
              <SparklesIcon className="h-4 w-4 text-orange-300" />
              <h1 className="text-[28px] font-black leading-none tracking-[-0.05em] text-white sm:text-[30px] lg:text-[34px]">
                AI Туслах
              </h1>
            </div>

            <p className="mt-1.5 max-w-[470px] text-[10px] leading-[1.45] text-white/[0.58] lg:text-[11px]">
              Таны ухаалаг туслах. Асуулт асууж, захиалгаа амархан удирдаарай.
            </p>
          </div>
        </section>

        <ChatBox />
      </div>
    </main>
  );
}
