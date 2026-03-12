import Layout from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGoogleMaps } from "@/hooks/use-google-maps";
import type { Trophy } from "@shared/schema";

function buildPopupContent(trophy: Trophy, navigate: (path: string) => void): HTMLDivElement {
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

  if (trophy.date) {
    const dateStr = new Date(trophy.date).toLocaleDateString(undefined, { month: "short", year: "numeric" });
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
  link.style.cssText = "display:inline-block;margin-top:6px;font-size:11px;color:#b87333;text-decoration:none;font-weight:500;cursor:pointer;";
  link.textContent = "View Details →";
  link.addEventListener("click", (e) => {
    e.preventDefault();
    navigate(`/trophies/${trophy.id}`);
  });
  container.appendChild(link);

  return container;
}

export default function TrophyMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [, navigate] = useLocation();
  const { ready: mapsReady, error: mapsError } = useGoogleMaps();
  const [mapType, setMapType] = useState<string>("terrain");

  const { data: trophies = [], isLoading } = useQuery<Trophy[]>({
    queryKey: ["/api/trophies"],
  });

  const trophiesWithCoords = trophies.filter(
    (t) => t.latitude != null && t.longitude != null
  );

  useEffect(() => {
    if (!mapRef.current || isLoading || !mapsReady) return;

    const map = new google.maps.Map(mapRef.current, {
      center: { lat: 20, lng: 0 },
      zoom: 2,
      mapTypeId: mapType,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    const bounds = new google.maps.LatLngBounds();
    const markers: google.maps.Marker[] = [];
    let openInfoWindow: google.maps.InfoWindow | null = null;

    trophiesWithCoords.forEach((trophy) => {
      const position = { lat: trophy.latitude!, lng: trophy.longitude! };
      const labelText = trophy.name || trophy.species;

      const marker = new google.maps.Marker({
        map,
        position,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#b87333",
          fillOpacity: 1,
          strokeColor: "white",
          strokeWeight: 2,
        },
        label: {
          text: labelText.length > 15 ? labelText.substring(0, 13) + "…" : labelText,
          fontSize: "10px",
          fontWeight: "600",
          color: "#1a1a1a",
          className: "trophy-marker-label",
        },
        title: labelText,
      });

      const popupContent = buildPopupContent(trophy, navigate);
      const infoWindow = new google.maps.InfoWindow({ content: popupContent });

      marker.addListener("mouseover", () => {
        if (openInfoWindow) openInfoWindow.close();
        infoWindow.open({ anchor: marker, map });
        openInfoWindow = infoWindow;
      });

      marker.addListener("click", () => {
        if (openInfoWindow === infoWindow) {
          navigate(`/trophies/${trophy.id}`);
        } else {
          if (openInfoWindow) openInfoWindow.close();
          infoWindow.open({ anchor: marker, map });
          openInfoWindow = infoWindow;
        }
      });

      bounds.extend(position);
      markers.push(marker);
    });

    if (markers.length > 0) {
      map.fitBounds(bounds, 50);
    }

    markersRef.current = markers;
    mapInstanceRef.current = map;

    return () => {
      markers.forEach((m) => m.setMap(null));
      markersRef.current = [];
      mapInstanceRef.current = null;
    };
  }, [trophies, isLoading, mapsReady]);

  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setMapTypeId(mapType);
    }
  }, [mapType]);

  return (
    <Layout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto h-full flex flex-col">
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mb-4"
        >
          <Link href="/trophies">
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground mb-2 -ml-2" data-testid="button-back-to-vault">
              <ArrowLeft className="h-4 w-4" />
              Back to Vault
            </Button>
          </Link>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-primary mb-1" data-testid="text-map-title">
                Trophy Map
              </h1>
              <p className="text-sm text-muted-foreground" data-testid="text-map-subtitle">
                {trophiesWithCoords.length} of {trophies.length} trophies with locations plotted
              </p>
            </div>
            <div className="flex rounded-md border border-border/50 overflow-hidden" data-testid="map-type-toggle">
              {([
                { label: "Road", value: "roadmap" },
                { label: "Terrain", value: "terrain" },
                { label: "Satellite", value: "satellite" },
                { label: "Hybrid", value: "hybrid" },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    mapType === opt.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-muted-foreground hover:bg-muted"
                  }`}
                  onClick={() => setMapType(opt.value)}
                  data-testid={`button-map-type-${opt.value}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </motion.header>

        {mapsError ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-3 text-muted-foreground">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <p className="text-sm">Unable to load Google Maps. Please check your API key configuration.</p>
          </div>
        ) : isLoading || !mapsReady ? (
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
