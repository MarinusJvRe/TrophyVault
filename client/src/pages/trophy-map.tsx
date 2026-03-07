import Layout from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Trophy } from "@shared/schema";

export default function TrophyMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [, navigate] = useLocation();

  const { data: trophies = [], isLoading } = useQuery<Trophy[]>({
    queryKey: ["/api/trophies"],
  });

  const trophiesWithCoords = trophies.filter(
    (t) => t.latitude != null && t.longitude != null
  );

  useEffect(() => {
    if (!mapRef.current || isLoading) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapRef.current, {
      center: [20, 0],
      zoom: 2,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const markers: L.Marker[] = [];

    trophiesWithCoords.forEach((trophy) => {
      const icon = L.divIcon({
        html: `<div style="background:#b87333;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>`,
        className: "",
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      const marker = L.marker([trophy.latitude!, trophy.longitude!], { icon }).addTo(map);

      const dateStr = trophy.date
        ? new Date(trophy.date).toLocaleDateString(undefined, { month: "short", year: "numeric" })
        : "";

      const container = document.createElement("div");
      container.style.cssText = "min-width:160px;font-family:system-ui,sans-serif;";

      if (trophy.imageUrl) {
        const img = document.createElement("img");
        img.src = trophy.imageUrl;
        img.alt = trophy.species;
        img.style.cssText = "width:100%;height:80px;object-fit:cover;border-radius:4px;margin-bottom:6px;";
        container.appendChild(img);
      }

      const speciesEl = document.createElement("div");
      speciesEl.style.cssText = "font-weight:600;font-size:13px;color:#1a1a1a;";
      speciesEl.textContent = trophy.species;
      container.appendChild(speciesEl);

      if (trophy.name) {
        const nameEl = document.createElement("div");
        nameEl.style.cssText = "font-size:11px;color:#666;margin-top:2px;";
        nameEl.textContent = trophy.name;
        container.appendChild(nameEl);
      }

      if (trophy.location) {
        const locEl = document.createElement("div");
        locEl.style.cssText = "font-size:11px;color:#888;margin-top:2px;";
        locEl.textContent = trophy.location;
        container.appendChild(locEl);
      }

      if (dateStr) {
        const dateEl = document.createElement("div");
        dateEl.style.cssText = "font-size:11px;color:#888;margin-top:2px;";
        dateEl.textContent = dateStr;
        container.appendChild(dateEl);
      }

      if (trophy.score) {
        const scoreEl = document.createElement("div");
        scoreEl.style.cssText = "font-size:11px;color:#b87333;font-weight:600;margin-top:4px;";
        scoreEl.textContent = `Score: ${trophy.score}`;
        container.appendChild(scoreEl);
      }

      const link = document.createElement("a");
      link.href = `/trophies/${trophy.id}`;
      link.style.cssText = "display:inline-block;margin-top:6px;font-size:11px;color:#b87333;text-decoration:none;font-weight:500;";
      link.textContent = "View Details →";
      link.dataset.trophyId = String(trophy.id);
      container.appendChild(link);

      marker.bindPopup(container);
      markers.push(marker);
    });

    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.2));
    }

    map.getContainer().addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a[data-trophy-id]") as HTMLAnchorElement | null;
      if (link) {
        e.preventDefault();
        const trophyId = link.getAttribute("data-trophy-id");
        if (trophyId) {
          navigate(`/trophies/${trophyId}`);
        }
      }
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [trophies, isLoading]);

  return (
    <Layout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto h-full flex flex-col">
        <header className="mb-4">
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-primary mb-1" data-testid="text-map-title">
            Trophy Map
          </h1>
          <p className="text-sm text-muted-foreground" data-testid="text-map-subtitle">
            {trophiesWithCoords.length} of {trophies.length} trophies with locations plotted
          </p>
        </header>

        {isLoading ? (
          <div className="flex items-center justify-center flex-1">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div
            ref={mapRef}
            className="flex-1 min-h-[400px] rounded-lg overflow-hidden border border-border/50"
            style={{ height: "calc(100vh - 200px)" }}
            data-testid="map-trophies"
          />
        )}
      </div>
    </Layout>
  );
}
