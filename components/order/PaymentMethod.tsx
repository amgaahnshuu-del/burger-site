"use client";

import { DocumentDuplicateIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

import type { PaymentMethod as PaymentMethodValue } from "@/features/order/order.types";

type PaymentMethodProps = {
  onChange: (value: PaymentMethodValue) => void;
  value: PaymentMethodValue;
};

export default function PaymentMethod({
  onChange,
  value,
}: PaymentMethodProps) {
  const [copyLabel, setCopyLabel] = useState("Copy");

  void onChange;
  void value;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText("5005413360");
      setCopyLabel("Copied");
    } catch {
      setCopyLabel("Failed");
    }

    window.setTimeout(() => {
      setCopyLabel("Copy");
    }, 1800);
  }

  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-white/50">
        Payment method
      </p>
      <div className="rounded-[1.3rem] border border-orange-400/18 bg-orange-500/10 px-4 py-4 text-left">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-orange-200/78">
          Bank account
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <p className="text-2xl font-black tracking-[0.02em] text-white">
            5005413360
          </p>
          <button
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-semibold text-white/78 transition hover:border-orange-400/30 hover:text-white"
            onClick={() => {
              void handleCopy();
            }}
            type="button"
          >
            <DocumentDuplicateIcon className="h-4 w-4" />
            {copyLabel}
          </button>
        </div>
        <p className="mt-3 text-sm leading-6 text-white/72">
          Гүйлгээний утган дээр утасны дугаараа бичнэ үү.
        </p>
      </div>
    </div>
  );
}
