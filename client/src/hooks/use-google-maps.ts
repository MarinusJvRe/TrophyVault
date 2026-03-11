import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

let googleMapsLoadPromise: Promise<void> | null = null;
let googleMapsLoaded = false;

function loadGoogleMapsScript(apiKey: string): Promise<void> {
  if (googleMapsLoaded) return Promise.resolve();
  if (googleMapsLoadPromise) return googleMapsLoadPromise;

  googleMapsLoadPromise = new Promise<void>((resolve, reject) => {
    if (window.google?.maps) {
      googleMapsLoaded = true;
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      googleMapsLoaded = true;
      resolve();
    };
    script.onerror = () => {
      googleMapsLoadPromise = null;
      reject(new Error("Failed to load Google Maps script"));
    };
    document.head.appendChild(script);
  });

  return googleMapsLoadPromise;
}

export function useGoogleMaps() {
  const [ready, setReady] = useState(googleMapsLoaded);
  const [error, setError] = useState<string | null>(null);

  const { data: config, error: configError } = useQuery<{ apiKey: string }>({
    queryKey: ["/api/maps-config"],
    staleTime: Infinity,
    retry: 1,
  });

  useEffect(() => {
    if (configError) {
      setError("Failed to load maps configuration. Please check API key setup.");
      return;
    }
    if (!config?.apiKey) return;
    loadGoogleMapsScript(config.apiKey)
      .then(() => setReady(true))
      .catch((err) => setError(err.message));
  }, [config?.apiKey, configError]);

  return { ready, error };
}

export async function waitForGoogleMaps(): Promise<boolean> {
  if (googleMapsLoaded) return true;
  if (googleMapsLoadPromise) {
    try {
      await googleMapsLoadPromise;
      return true;
    } catch {
      return false;
    }
  }
  return false;
}
