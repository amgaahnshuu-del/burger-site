"use client";

import {
  ArrowPathIcon,
  MapPinIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { useCallback, useEffect, useRef, useState } from "react";

import type { DeliveryLocationInput } from "@/features/order/order.types";
import {
  getGoogleMapsApiKey,
  loadGoogleMapsApi,
  type BrowserGoogleGeocoder,
  type BrowserGoogleGeocoderResult,
  type BrowserGoogleMapsApi,
  type BrowserLatLngLiteral,
} from "@/lib/google-maps-browser";
import { cn } from "@/lib/helpers";

type DeliveryAddressProps = {
  error?: string;
  onChange: (value: DeliveryLocationInput) => void;
  value: DeliveryLocationInput;
};

type AddressMode = "current" | "manual";
type LocationStatus =
  | "idle"
  | "loading"
  | "ready"
  | "blocked"
  | "unsupported"
  | "error";

type Coordinates = {
  latitude: number;
  longitude: number;
};

function getInitialMode(value: DeliveryLocationInput): AddressMode {
  if (value.address.trim() && getCoordinatesFromValue(value) === null) {
    return "manual";
  }

  return "current";
}

function composeManualLocation(options: {
  apartmentUnit: string;
  details: string;
  district: string;
  khoroo: string;
  label: string;
}) {
  const address = [
    options.district.trim() ? `${options.district.trim()} duureg` : "",
    options.khoroo.trim() ? `${options.khoroo.trim()} khoroo` : "",
    options.apartmentUnit.trim() ? `${options.apartmentUnit.trim()} toot` : "",
    options.details.trim(),
  ]
    .filter(Boolean)
    .join(", ");

  return {
    address,
    addressDistrict: options.district.trim() || null,
    addressKhoroo: options.khoroo.trim() || null,
    addressLabel: options.label.trim() || "Manual address",
    addressLatitude: null,
    addressLongitude: null,
    addressNotes: null,
    addressUnit: options.apartmentUnit.trim() || null,
  } satisfies DeliveryLocationInput;
}

function formatCoordinateAddress(coords: Coordinates) {
  return `Detected location (${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)})`;
}

function formatCoordinateLabel(coords: Coordinates) {
  return `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`;
}

function getCoordinatesFromValue(value: DeliveryLocationInput) {
  if (
    typeof value.addressLatitude === "number" &&
    Number.isFinite(value.addressLatitude) &&
    typeof value.addressLongitude === "number" &&
    Number.isFinite(value.addressLongitude)
  ) {
    return {
      latitude: value.addressLatitude,
      longitude: value.addressLongitude,
    };
  }

  return null;
}

function findAddressComponent(
  result: BrowserGoogleGeocoderResult | null,
  types: string[]
) {
  if (!result) {
    return null;
  }

  const entry = result.address_components.find((component) =>
    types.some((type) => component.types.includes(type))
  );

  return entry?.long_name?.trim() || null;
}

function buildDetectedLocationValue(options: {
  coords: Coordinates;
  labelOverride?: string;
  result: BrowserGoogleGeocoderResult | null;
}) {
  const primaryLabel =
    options.labelOverride ||
    findAddressComponent(options.result, ["premise", "point_of_interest", "route"]) ||
    options.result?.formatted_address.split(",")[0]?.trim() ||
    "Current location";

  return {
    address:
      options.result?.formatted_address?.trim() ||
      formatCoordinateAddress(options.coords),
    addressDistrict: findAddressComponent(options.result, [
      "administrative_area_level_2",
      "administrative_area_level_1",
    ]),
    addressKhoroo: findAddressComponent(options.result, [
      "sublocality_level_1",
      "sublocality",
      "administrative_area_level_3",
      "neighborhood",
    ]),
    addressLabel: primaryLabel,
    addressLatitude: options.coords.latitude,
    addressLongitude: options.coords.longitude,
    addressNotes: null,
    addressUnit: findAddressComponent(options.result, [
      "subpremise",
      "street_number",
    ]),
  } satisfies DeliveryLocationInput;
}

function getLocationStatusMessage(status: LocationStatus) {
  switch (status) {
    case "blocked":
      return "Location permission is blocked. Allow GPS access or switch to manual entry.";
    case "error":
      return "Unable to detect your current location right now. Try again or enter it manually.";
    case "loading":
      return "Checking your live GPS position...";
    case "ready":
      return "Your selected delivery point is ready.";
    case "unsupported":
      return "This browser does not support location access. Use manual entry instead.";
    default:
      return "Use your current location, or type the address manually.";
  }
}

function toLatLngLiteral(coords: Coordinates): BrowserLatLngLiteral {
  return {
    lat: coords.latitude,
    lng: coords.longitude,
  };
}

function serializeLocation(value: DeliveryLocationInput) {
  return JSON.stringify({
    address: value.address,
    addressDistrict: value.addressDistrict ?? null,
    addressKhoroo: value.addressKhoroo ?? null,
    addressLabel: value.addressLabel ?? null,
    addressLatitude: value.addressLatitude ?? null,
    addressLongitude: value.addressLongitude ?? null,
    addressNotes: value.addressNotes ?? null,
    addressUnit: value.addressUnit ?? null,
  });
}

export default function DeliveryAddress({
  error,
  onChange,
  value,
}: DeliveryAddressProps) {
  const initialMode = getInitialMode(value);
  const [mode, setMode] = useState<AddressMode>(initialMode);
  const [manualLabel, setManualLabel] = useState(value.addressLabel ?? "");
  const [district, setDistrict] = useState(value.addressDistrict ?? "");
  const [khoroo, setKhoroo] = useState(value.addressKhoroo ?? "");
  const [apartmentUnit, setApartmentUnit] = useState(value.addressUnit ?? "");
  const [manualDetails, setManualDetails] = useState(value.address);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>(
    initialMode === "current" ? "idle" : "ready"
  );
  const [selectedCoords, setSelectedCoords] = useState<Coordinates | null>(
    getCoordinatesFromValue(value)
  );
  const [selectedAddress, setSelectedAddress] = useState(value.address);
  const [selectedLabel, setSelectedLabel] = useState(value.addressLabel ?? "");
  const [locationError, setLocationError] = useState<string | null>(null);
  const geocoderRef = useRef<BrowserGoogleGeocoder | null>(null);
  const mapsApiRef = useRef<BrowserGoogleMapsApi | null>(null);
  const lastEmittedRef = useRef("");

  useEffect(() => {
    const serializedValue = serializeLocation(value);

    if (serializedValue === lastEmittedRef.current) {
      return;
    }

    const nextMode = getInitialMode(value);

    setMode(nextMode);
    setManualLabel(value.addressLabel ?? "");
    setDistrict(value.addressDistrict ?? "");
    setKhoroo(value.addressKhoroo ?? "");
    setApartmentUnit(value.addressUnit ?? "");
    setManualDetails(value.address);
    setSelectedCoords(getCoordinatesFromValue(value));
    setSelectedAddress(value.address);
    setSelectedLabel(value.addressLabel ?? "");
    setLocationStatus(nextMode === "current" ? "idle" : "ready");
    setLocationError(null);
  }, [
    value,
    value.address,
    value.addressDistrict,
    value.addressKhoroo,
    value.addressLabel,
    value.addressLatitude,
    value.addressLongitude,
    value.addressUnit,
  ]);

  const emitChange = useCallback(
    (nextValue: DeliveryLocationInput) => {
      lastEmittedRef.current = serializeLocation(nextValue);
      onChange(nextValue);
    },
    [onChange]
  );

  const ensureGeocoderReady = useCallback(async () => {
    if (mapsApiRef.current && geocoderRef.current) {
      return mapsApiRef.current;
    }

    const maps = await loadGoogleMapsApi();

    mapsApiRef.current = maps;

    if (!geocoderRef.current) {
      geocoderRef.current = new maps.Geocoder();
    }

    return maps;
  }, []);

  const reverseGeocode = useCallback(
    async (coords: Coordinates) => {
      const maps = await ensureGeocoderReady();

      if (!geocoderRef.current) {
        geocoderRef.current = new maps.Geocoder();
      }

      return new Promise<BrowserGoogleGeocoderResult | null>((resolve) => {
        geocoderRef.current?.geocode(
          {
            location: toLatLngLiteral(coords),
          },
          (results, status) => {
            if (status === maps.GeocoderStatus.OK && results?.[0]) {
              resolve(results[0]);
              return;
            }

            resolve(null);
          }
        );
      });
    },
    [ensureGeocoderReady]
  );

  const applyDetectedLocation = useCallback(
    async (coords: Coordinates, labelOverride = "Current location") => {
      setLocationError(null);
      setSelectedCoords(coords);
      setSelectedLabel(labelOverride);

      try {
        const result = getGoogleMapsApiKey() ? await reverseGeocode(coords) : null;
        const nextValue = buildDetectedLocationValue({
          coords,
          labelOverride,
          result,
        });

        setSelectedAddress(nextValue.address);
        setSelectedLabel(nextValue.addressLabel ?? labelOverride);
        setLocationStatus("ready");
        emitChange(nextValue);
      } catch {
        const fallbackValue = buildDetectedLocationValue({
          coords,
          labelOverride,
          result: null,
        });

        setSelectedAddress(fallbackValue.address);
        setSelectedLabel(fallbackValue.addressLabel ?? labelOverride);
        setLocationStatus("ready");
        setLocationError(
          "Your coordinates were saved, but the full address could not be looked up."
        );
        emitChange(fallbackValue);
      }
    },
    [emitChange, reverseGeocode]
  );

  const syncManualAddress = useCallback(
    (nextValues?: {
      apartmentUnit?: string;
      details?: string;
      district?: string;
      khoroo?: string;
      label?: string;
    }) => {
      const nextValue = composeManualLocation({
        apartmentUnit: nextValues?.apartmentUnit ?? apartmentUnit,
        details: nextValues?.details ?? manualDetails,
        district: nextValues?.district ?? district,
        khoroo: nextValues?.khoroo ?? khoroo,
        label: nextValues?.label ?? manualLabel,
      });

      emitChange(nextValue);
    },
    [apartmentUnit, district, emitChange, khoroo, manualDetails, manualLabel]
  );

  async function handleSelectCurrent() {
    setMode("current");
    setLocationError(null);

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationStatus("unsupported");
      emitChange({
        address: "",
        addressDistrict: null,
        addressKhoroo: null,
        addressLabel: null,
        addressLatitude: null,
        addressLongitude: null,
        addressNotes: null,
        addressUnit: null,
      });
      return;
    }

    setLocationStatus("loading");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        void applyDetectedLocation(coords);
      },
      (geoError) => {
        if (geoError.code === geoError.PERMISSION_DENIED) {
          setLocationStatus("blocked");
        } else {
          setLocationStatus("error");
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 10000,
      }
    );
  }

  function handleSelectManual() {
    setMode("manual");
    setLocationError(null);
    syncManualAddress();
  }

  return (
    <div>
      <span className="mb-3 block text-xs font-semibold uppercase tracking-[0.24em] text-white/50">
        Delivery address
      </span>

      <div className="grid gap-3 md:grid-cols-2">
        <button
          className={cn(
            "rounded-[1.3rem] border px-4 py-4 text-left transition",
            mode === "current"
              ? "border-orange-400/50 bg-orange-500/10"
              : "border-white/10 bg-white/[0.03] hover:border-orange-400/24 hover:bg-white/[0.05]"
          )}
          onClick={handleSelectCurrent}
          type="button"
        >
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "inline-flex h-10 w-10 items-center justify-center rounded-[1rem]",
                mode === "current"
                  ? "bg-orange-500 text-white"
                  : "bg-white/[0.05] text-white/70"
              )}
            >
              <MapPinIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="font-medium text-white">Use current location</p>
              <p className="mt-2 text-sm leading-6 text-white/50">
                Detect your live GPS location and drop it straight into checkout.
              </p>
            </div>
          </div>
        </button>

        <button
          className={cn(
            "rounded-[1.3rem] border px-4 py-4 text-left transition",
            mode === "manual"
              ? "border-orange-400/50 bg-orange-500/10"
              : "border-white/10 bg-white/[0.03] hover:border-orange-400/24 hover:bg-white/[0.05]"
          )}
          onClick={handleSelectManual}
          type="button"
        >
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "inline-flex h-10 w-10 items-center justify-center rounded-[1rem]",
                mode === "manual"
                  ? "bg-orange-500 text-white"
                  : "bg-white/[0.05] text-white/70"
              )}
            >
              <PencilSquareIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="font-medium text-white">Enter manually</p>
              <p className="mt-2 text-sm leading-6 text-white/50">
                Type the district, apartment, and landmark details yourself.
              </p>
            </div>
          </div>
        </button>
      </div>

      {mode === "manual" ? (
        <div className="mt-4 space-y-4">
          <label className="block w-full rounded-[1.2rem] border border-white/10 bg-[#101011] p-4">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-white/42">
              Place label
            </span>
            <input
              className="mt-3 block w-full bg-transparent text-sm text-white outline-none placeholder:text-white/28"
              onChange={(event) => {
                setManualLabel(event.target.value);
                syncManualAddress({ label: event.target.value });
              }}
              placeholder="Home, Office, Campus"
              value={manualLabel}
            />
          </label>

          <div className="grid items-start gap-3 sm:grid-cols-3">
            <label className="block w-full rounded-[1.2rem] border border-white/10 bg-[#101011] p-4">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-white/42">
                Duureg
              </span>
              <input
                className="mt-3 block w-full bg-transparent text-sm text-white outline-none placeholder:text-white/28"
                onChange={(event) => {
                  setDistrict(event.target.value);
                  syncManualAddress({ district: event.target.value });
                }}
                placeholder="Sukhbaatar"
                value={district}
              />
            </label>

            <label className="block w-full rounded-[1.2rem] border border-white/10 bg-[#101011] p-4">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-white/42">
                Khoroo
              </span>
              <input
                className="mt-3 block w-full bg-transparent text-sm text-white outline-none placeholder:text-white/28"
                onChange={(event) => {
                  setKhoroo(event.target.value);
                  syncManualAddress({ khoroo: event.target.value });
                }}
                placeholder="8"
                value={khoroo}
              />
            </label>

            <label className="block w-full rounded-[1.2rem] border border-white/10 bg-[#101011] p-4">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-white/42">
                Unit
              </span>
              <input
                className="mt-3 block w-full bg-transparent text-sm text-white outline-none placeholder:text-white/28"
                onChange={(event) => {
                  setApartmentUnit(event.target.value);
                  syncManualAddress({ apartmentUnit: event.target.value });
                }}
                placeholder="1203"
                value={apartmentUnit}
              />
            </label>
          </div>

          <textarea
            className="min-h-28 w-full rounded-[1.4rem] border border-white/10 bg-[#101011] px-4 py-4 text-sm leading-7 text-white outline-none transition placeholder:text-white/32 focus:border-orange-400/60 focus:bg-[#151517]"
            onChange={(event) => {
              setManualDetails(event.target.value);
              syncManualAddress({ details: event.target.value });
            }}
            placeholder="Building name, entrance, landmark, and rider notes"
            value={manualDetails}
          />
          <p className="text-xs text-white/38">
            Include floor, entrance, gate code, or any landmark that helps the courier.
          </p>
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#101011]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-white">Current location</p>
              <p className="mt-1 text-xs text-white/46">
                {getLocationStatusMessage(locationStatus)}
              </p>
            </div>

            <button
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/72 transition hover:border-orange-400/30 hover:text-white"
              onClick={() => {
                void handleSelectCurrent();
              }}
              type="button"
            >
              <ArrowPathIcon className="h-4 w-4" />
              Refresh location
            </button>
          </div>

          <div className="grid gap-4 p-4 md:grid-cols-2">
            <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/42">
                Selected place
              </p>
              <p className="mt-3 text-base font-semibold text-white">
                {selectedLabel || "Current location"}
              </p>
              <p className="mt-2 text-sm leading-7 text-white/60">
                {selectedAddress ||
                  "Allow location access and we will use your live coordinates for delivery."}
              </p>
            </div>

            <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/42">
                Coordinates
              </p>
              <p className="mt-3 text-sm text-white/72">
                {selectedCoords
                  ? formatCoordinateLabel(selectedCoords)
                  : "No live coordinates detected yet."}
              </p>
              <p className="mt-2 text-xs leading-6 text-white/42">
                {selectedCoords
                  ? "We use your live GPS position for delivery and save the coordinates with the order."
                  : "Tap refresh location and allow browser location access to detect your current position."}
              </p>
            </div>

            {locationError ? (
              <p className="rounded-[1rem] border border-orange-400/18 bg-orange-500/10 px-4 py-3 text-sm text-orange-200 md:col-span-2">
                {locationError}
              </p>
            ) : null}
          </div>
        </div>
      )}

      {error ? <p className="mt-2 text-sm text-orange-300">{error}</p> : null}
    </div>
  );
}
