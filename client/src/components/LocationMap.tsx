import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface LocationMapProps {
  latitude: number;
  longitude: number;
  locationName?: string;
  height?: string;
  className?: string;
}

export function LocationMap({
  latitude,
  longitude,
  locationName,
  height = "200px",
  className = "",
}: LocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    const map = L.map(mapRef.current, {
      center: [latitude, longitude],
      zoom: 8,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: false,
      dragging: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    const icon = L.divIcon({
      html: `<div style="background:#b87333;width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4);"></div>`,
      className: "",
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    });

    const marker = L.marker([latitude, longitude], { icon }).addTo(map);
    if (locationName) {
      const el = document.createElement("span");
      el.style.fontSize = "12px";
      el.style.fontWeight = "500";
      el.textContent = locationName;
      marker.bindPopup(el);
    }

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [latitude, longitude, locationName]);

  return (
    <div
      ref={mapRef}
      style={{ height }}
      className={`rounded-lg overflow-hidden border border-border/50 ${className}`}
      data-testid="map-location"
    />
  );
}
