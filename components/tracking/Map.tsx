"use client";

import { useEffect, useState } from "react";
import {
  ArrowTopRightOnSquareIcon,
  MapPinIcon,
} from "@heroicons/react/24/solid";

import type { Tracking } from "@/features/order/order.types";

type Coordinates = {
  latitude: number;
  longitude: number;
};

type ViewerLocationStatus =
  | "idle"
  | "loading"
  | "ready"
  | "blocked"
  | "unsupported"
  | "error";

type MapProps = {
  address: string;
  tracking: Tracking | null;
};

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
const DEFAULT_LOCATION_QUERY = "Ulaanbaatar, Mongolia";

function getDestinationQuery(address: string) {
  const normalizedAddress = address.trim();

  if (!normalizedAddress) {
    return DEFAULT_LOCATION_QUERY;
  }

  return `${normalizedAddress}, Ulaanbaatar, Mongolia`;
}

function getTrackingCoordinates(tracking: Tracking | null) {
  if (tracking?.latitude == null || tracking?.longitude == null) {
    return null;
  }

  return {
    latitude: tracking.latitude,
    longitude: tracking.longitude,
  };
}

function getCoordinatesValue(coords: Coordinates | null) {
  if (!coords) {
    return null;
  }

  return `${coords.latitude},${coords.longitude}`;
}

function formatCoordinates(coords: Coordinates | null) {
  if (!coords) {
    return null;
  }

  return `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`;
}

function getViewerLocationLabel(status: ViewerLocationStatus) {
  switch (status) {
    case "blocked":
      return "User location blocked";
    case "error":
      return "User location unavailable";
    case "loading":
      return "Finding your location";
    case "ready":
      return "Your location ready";
    case "unsupported":
      return "Browser GPS unavailable";
    default:
      return "Location inactive";
  }
}

function buildGoogleMapsEmbedUrl(
  address: string,
  tracking: Tracking | null,
  viewerCoords: Coordinates | null
) {
  const courierCoords = getTrackingCoordinates(tracking);
  const destinationCoords = getCoordinatesValue(viewerCoords);
  const destination = destinationCoords ?? getDestinationQuery(address);
  const origin = getCoordinatesValue(courierCoords);

  if (GOOGLE_MAPS_API_KEY && origin) {
    const params = new URLSearchParams({
      destination,
      key: GOOGLE_MAPS_API_KEY,
      language: "mn",
      mode: "driving",
      origin,
    });

    return `https://www.google.com/maps/embed/v1/directions?${params.toString()}`;
  }

  if (origin && destination) {
    const params = new URLSearchParams({
      daddr: destination,
      dirflg: "d",
      hl: "mn",
      output: "embed",
      saddr: origin,
    });

    return `https://www.google.com/maps?${params.toString()}`;
  }

  const params = new URLSearchParams({
    hl: "mn",
    output: "embed",
    q: destination,
    z: "13",
  });

  return `https://www.google.com/maps?${params.toString()}`;
}

function buildGoogleMapsLink(
  address: string,
  tracking: Tracking | null,
  viewerCoords: Coordinates | null
) {
  const courierCoords = getTrackingCoordinates(tracking);
  const liveDestination = getCoordinatesValue(viewerCoords);
  const destination = liveDestination ?? getDestinationQuery(address);
  const origin = getCoordinatesValue(courierCoords ?? viewerCoords);

  if (origin) {
    const params = new URLSearchParams({
      api: "1",
      destination,
      origin,
      travelmode: "driving",
    });

    return `https://www.google.com/maps/dir/?${params.toString()}`;
  }

  const params = new URLSearchParams({
    api: "1",
    query: destination,
  });

  return `https://www.google.com/maps/search/?${params.toString()}`;
}

export default function Map({ address, tracking }: MapProps) {
  const [viewerCoords, setViewerCoords] = useState<Coordinates | null>(null);
  const [viewerLocationStatus, setViewerLocationStatus] =
    useState<ViewerLocationStatus>("idle");

  useEffect(() => {
    let cancelled = false;

    const scheduleStatusUpdate = (status: ViewerLocationStatus) => {
      queueMicrotask(() => {
        if (!cancelled) {
          setViewerLocationStatus(status);
        }
      });
    };

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      scheduleStatusUpdate("unsupported");
      return () => {
        cancelled = true;
      };
    }

    scheduleStatusUpdate("loading");

    const handleSuccess = (position: GeolocationPosition) => {
      if (cancelled) {
        return;
      }

      setViewerCoords({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      setViewerLocationStatus("ready");
    };

    const handleError = (error: GeolocationPositionError) => {
      if (cancelled) {
        return;
      }

      if (error.code === error.PERMISSION_DENIED) {
        setViewerLocationStatus("blocked");
        return;
      }

      setViewerLocationStatus("error");
    };

    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      maximumAge: 15000,
      timeout: 10000,
    });

    const watchId = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      {
        enableHighAccuracy: true,
        maximumAge: 15000,
        timeout: 15000,
      }
    );

    return () => {
      cancelled = true;
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  const courierCoords = getTrackingCoordinates(tracking);
  const embedUrl = buildGoogleMapsEmbedUrl(address, tracking, viewerCoords);
  const googleMapsHref = buildGoogleMapsLink(address, tracking, viewerCoords);
  const hasCourierLocation = courierCoords !== null;
  const hasViewerLocation = viewerCoords !== null;
  const viewerCoordinatesLabel = formatCoordinates(viewerCoords);
  const courierCoordinatesLabel = formatCoordinates(courierCoords);

  return (
    <div className="relative h-[360px] overflow-hidden rounded-[22px] border border-white/8 bg-[#09090B] shadow-[0_24px_60px_rgba(0,0,0,0.34)]">
      <iframe
        aria-label="Google Maps delivery tracking"
        className="h-full w-full"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        src={embedUrl}
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[linear-gradient(180deg,rgba(9,9,11,0.82),rgba(9,9,11,0))]" />

      <div className="absolute left-4 top-4 z-10 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-black/72 px-3 py-1 text-[11px] text-white/78 backdrop-blur">
          <MapPinIcon className="h-3.5 w-3.5 text-[var(--accent-3)]" />
          Google Maps
        </span>
        <span className="rounded-full border border-white/8 bg-black/72 px-3 py-1 text-[11px] text-white/60 backdrop-blur">
          {hasCourierLocation && hasViewerLocation
            ? "Courier to user route"
            : hasCourierLocation
              ? "Live courier GPS"
              : "Destination preview"}
        </span>
        <span className="rounded-full border border-white/8 bg-black/72 px-3 py-1 text-[11px] text-white/60 backdrop-blur">
          {getViewerLocationLabel(viewerLocationStatus)}
        </span>
      </div>

      <a
        className="absolute right-4 top-4 z-10 inline-flex items-center gap-2 rounded-full border border-white/8 bg-black/72 px-3 py-1 text-[11px] text-white/78 backdrop-blur hover:border-white/14 hover:text-white"
        href={googleMapsHref}
        rel="noreferrer"
        target="_blank"
      >
        Open in Google Maps
        <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
      </a>

      <div className="absolute bottom-4 left-4 right-4 z-10 max-w-2xl rounded-[20px] border border-white/8 bg-black/78 px-4 py-3 text-sm text-white/65 backdrop-blur">
        <p>
          {viewerCoordinatesLabel
            ? `Your location: ${viewerCoordinatesLabel}`
            : viewerLocationStatus === "loading"
              ? "Checking your current location..."
              : viewerLocationStatus === "blocked"
                ? "Enable browser location access to show your current position."
                : viewerLocationStatus === "unsupported"
                  ? "This browser does not support location access."
                : "Your location will appear here after GPS permission is granted."}
        </p>
        <p className="mt-2">
          {courierCoordinatesLabel
            ? `Courier ping: ${courierCoordinatesLabel}`
            : "Live courier coordinates will appear automatically after the courier shares GPS access."}
        </p>
        <p className="mt-2 text-white/48">
          {hasCourierLocation && hasViewerLocation
            ? GOOGLE_MAPS_API_KEY
              ? "Google Maps is drawing the live courier-to-user route."
              : "Google Maps fallback route is loaded between the courier and your location."
            : hasViewerLocation && !hasCourierLocation
              ? "Waiting for courier GPS to draw the route on Google Maps."
              : hasCourierLocation && !hasViewerLocation
                ? "Allow browser GPS access so Google Maps can connect your location to the courier."
                : "Enable GPS on both sides to show the live courier-to-user route on Google Maps."}
        </p>
      </div>
    </div>
  );
}
