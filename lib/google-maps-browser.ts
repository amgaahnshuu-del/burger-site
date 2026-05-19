const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
const GOOGLE_MAPS_SCRIPT_ID = "burger-google-maps-script";

export type BrowserLatLngLiteral = {
  lat: number;
  lng: number;
};

export type BrowserGoogleGeocoderAddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

export type BrowserGoogleGeocoderResult = {
  address_components: BrowserGoogleGeocoderAddressComponent[];
  formatted_address: string;
};

export type BrowserGoogleMapsMouseEvent = {
  latLng?: {
    lat: () => number;
    lng: () => number;
  };
};

export type BrowserGoogleMap = {
  addListener: (
    eventName: string,
    handler: (event: BrowserGoogleMapsMouseEvent) => void
  ) => void;
  panTo: (position: BrowserLatLngLiteral) => void;
  setZoom: (zoom: number) => void;
};

export type BrowserGoogleMarker = {
  setMap: (map: BrowserGoogleMap | null) => void;
  setPosition: (position: BrowserLatLngLiteral) => void;
};

export type BrowserGoogleGeocoder = {
  geocode: (
    request: {
      location: BrowserLatLngLiteral;
    },
    callback: (
      results: BrowserGoogleGeocoderResult[] | null,
      status: string
    ) => void
  ) => void;
};

export type BrowserGoogleMapsApi = {
  Geocoder: new () => BrowserGoogleGeocoder;
  GeocoderStatus: {
    OK: string;
  };
  Map: new (
    element: HTMLElement,
    options: {
      center: BrowserLatLngLiteral;
      clickableIcons?: boolean;
      disableDefaultUI?: boolean;
      gestureHandling?: string;
      mapTypeControl?: boolean;
      streetViewControl?: boolean;
      styles?: unknown[];
      zoom: number;
      zoomControl?: boolean;
    }
  ) => BrowserGoogleMap;
  Marker: new (options: {
    draggable?: boolean;
    map: BrowserGoogleMap;
    position: BrowserLatLngLiteral;
  }) => BrowserGoogleMarker;
};

declare global {
  interface Window {
    __burgerGoogleMapsLoader?: Promise<BrowserGoogleMapsApi>;
    google?: {
      maps: BrowserGoogleMapsApi;
    };
  }
}

function createGoogleMapsScript() {
  const script = document.createElement("script");
  const params = new URLSearchParams({
    key: GOOGLE_MAPS_API_KEY ?? "",
    loading: "async",
    v: "weekly",
  });

  script.id = GOOGLE_MAPS_SCRIPT_ID;
  script.async = true;
  script.defer = true;
  script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;

  return script;
}

export function getGoogleMapsApiKey() {
  return GOOGLE_MAPS_API_KEY ?? "";
}

export async function loadGoogleMapsApi() {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error("GOOGLE_MAPS_API_KEY_MISSING");
  }

  if (typeof window === "undefined") {
    throw new Error("GOOGLE_MAPS_BROWSER_ONLY");
  }

  if (window.google?.maps) {
    return window.google.maps;
  }

  if (!window.__burgerGoogleMapsLoader) {
    window.__burgerGoogleMapsLoader = new Promise<BrowserGoogleMapsApi>(
      (resolve, reject) => {
        const existingScript = document.getElementById(
          GOOGLE_MAPS_SCRIPT_ID
        ) as HTMLScriptElement | null;

        const handleLoad = () => {
          if (window.google?.maps) {
            resolve(window.google.maps);
            return;
          }

          reject(new Error("GOOGLE_MAPS_API_UNAVAILABLE"));
        };

        if (existingScript) {
          existingScript.addEventListener("load", handleLoad, { once: true });
          existingScript.addEventListener(
            "error",
            () => reject(new Error("GOOGLE_MAPS_SCRIPT_FAILED")),
            { once: true }
          );
          return;
        }

        const script = createGoogleMapsScript();

        script.addEventListener("load", handleLoad, { once: true });
        script.addEventListener(
          "error",
          () => reject(new Error("GOOGLE_MAPS_SCRIPT_FAILED")),
          { once: true }
        );

        document.head.append(script);
      }
    ).catch((error) => {
      window.__burgerGoogleMapsLoader = undefined;
      throw error;
    });
  }

  return window.__burgerGoogleMapsLoader;
}
