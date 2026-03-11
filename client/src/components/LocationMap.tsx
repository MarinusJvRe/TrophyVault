import { useEffect, useRef, useState } from "react";
import { useGoogleMaps } from "@/hooks/use-google-maps";

interface LocationMapProps {
  latitude: number;
  longitude: number;
  locationName?: string;
  height?: string;
  className?: string;
}

const MAP_TYPES = [
  { label: "Terrain", value: "terrain" },
  { label: "Satellite", value: "satellite" },
] as const;

export function LocationMap({
  latitude,
  longitude,
  locationName,
  height = "200px",
  className = "",
}: LocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const { ready, error } = useGoogleMaps();
  const [mapType, setMapType] = useState<string>("terrain");

  useEffect(() => {
    if (!ready || !mapRef.current) return;

    const position = { lat: latitude, lng: longitude };

    const map = new google.maps.Map(mapRef.current, {
      center: position,
      zoom: 8,
      disableDefaultUI: true,
      gestureHandling: "none",
      mapTypeId: mapType,
    });

    const marker = new google.maps.Marker({
      map,
      position,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 7,
        fillColor: "#b87333",
        fillOpacity: 1,
        strokeColor: "white",
        strokeWeight: 2,
      },
      title: locationName || undefined,
    });

    if (locationName) {
      const contentEl = document.createElement("span");
      contentEl.style.cssText = "font-size:12px;font-weight:500;";
      contentEl.textContent = locationName;

      const infoWindow = new google.maps.InfoWindow({ content: contentEl });
      marker.addListener("click", () => {
        infoWindow.open({ anchor: marker, map });
      });
    }

    mapInstanceRef.current = map;
    markerRef.current = marker;

    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
      mapInstanceRef.current = null;
    };
  }, [ready, latitude, longitude, locationName]);

  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setMapTypeId(mapType);
    }
  }, [mapType]);

  if (error) {
    return (
      <div
        style={{ height }}
        className={`rounded-lg overflow-hidden border border-border/50 flex items-center justify-center bg-muted/20 ${className}`}
        data-testid="map-location"
      >
        <span className="text-xs text-muted-foreground">Map unavailable</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div
        ref={mapRef}
        style={{ height }}
        className="rounded-lg overflow-hidden border border-border/50"
        data-testid="map-location"
      />
      <div className="absolute top-2 right-2 flex rounded-md border border-border/50 overflow-hidden shadow-sm" data-testid="map-type-toggle-detail">
        {MAP_TYPES.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`px-2 py-1 text-[10px] font-medium transition-colors ${
              mapType === opt.value
                ? "bg-primary text-primary-foreground"
                : "bg-card/90 text-muted-foreground hover:bg-muted backdrop-blur-sm"
            }`}
            onClick={() => setMapType(opt.value)}
            data-testid={`button-detail-map-type-${opt.value}`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
