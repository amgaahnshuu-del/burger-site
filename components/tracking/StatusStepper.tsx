import {
  CheckCircleIcon,
  ClockIcon,
  TruckIcon,
} from "@heroicons/react/24/solid";

import type { TrackingStatus } from "@/features/order/order.types";
import { TRACKING_STEPS } from "@/lib/constants";
import { cn, getTrackingStatusLabel } from "@/lib/helpers";

type StatusStepperProps = {
  status: TrackingStatus;
};

const STEP_ICON_MAP = {
  DELIVERED: CheckCircleIcon,
  ON_THE_WAY: TruckIcon,
  PREPARING: ClockIcon,
} as const;

export default function StatusStepper({ status }: StatusStepperProps) {
  const currentIndex = TRACKING_STEPS.indexOf(status);

  return (
    <div className="surface-card rounded-[2rem] p-5 sm:p-6">
      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.34em] text-white/34">
        Delivery progress
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {TRACKING_STEPS.map((step, index) => {
          const active = index <= currentIndex;
          const Icon = STEP_ICON_MAP[step];

          return (
            <div
              className={cn(
                "relative rounded-[1.35rem] border p-4",
                active
                  ? "border-orange-400/40 bg-orange-500/10"
                  : "border-white/10 bg-white/[0.03]"
              )}
              key={step}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full",
                    active ? "bg-orange-500 text-white" : "bg-white/6 text-white/40"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-white/36">
                    Step {index + 1}
                  </p>
                  <p className="mt-1 font-medium text-white">
                    {getTrackingStatusLabel(step)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
