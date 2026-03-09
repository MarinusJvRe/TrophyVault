import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, X, Loader2, Navigation } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LocationResult {
  display_name: string;
  lat: string;
  lon: string;
  type: string;
}

interface LocationSearchProps {
  value: string;
  latitude?: number | null;
  longitude?: number | null;
  onChange: (location: string, lat: number | null, lng: number | null) => void;
  placeholder?: string;
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
    { headers: { "Accept-Language": "en" } }
  );
  if (!response.ok) {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
  const data = await response.json();
  if (data.display_name) {
    return formatLocationName(data.display_name);
  }
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

export { reverseGeocode };

export function LocationSearch({
  value,
  latitude,
  longitude,
  onChange,
  placeholder = "Search for a location...",
}: LocationSearchProps) {
  const [query, setQuery] = useState(value || "");
  const [results, setResults] = useState<LocationResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchLocations = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&addressdetails=1`,
        { headers: { "Accept-Language": "en" } }
      );
      const data: LocationResult[] = await response.json();
      setResults(data);
      setShowResults(true);
    } catch (error) {
      console.error("Location search failed:", error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val, null, null);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchLocations(val), 400);
  };

  const selectLocation = (result: LocationResult) => {
    const shortName = formatLocationName(result.display_name);
    setQuery(shortName);
    setShowResults(false);
    setResults([]);
    onChange(shortName, parseFloat(result.lat), parseFloat(result.lon));
  };

  const clearLocation = () => {
    setQuery("");
    setResults([]);
    setShowResults(false);
    onChange("", null, null);
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: "Not supported", description: "Location is not available on this device.", variant: "destructive" });
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        try {
          const locationName = await reverseGeocode(lat, lng);
          setQuery(locationName);
          onChange(locationName, lat, lng);
        } catch {
          const fallback = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
          setQuery(fallback);
          onChange(fallback, lat, lng);
        } finally {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        setIsGettingLocation(false);
        let message = "Could not get your location.";
        if (error.code === error.PERMISSION_DENIED) {
          message = "Location access was denied. Please enable it in your browser settings.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = "Location information is unavailable.";
        } else if (error.code === error.TIMEOUT) {
          message = "Location request timed out.";
        }
        toast({ title: "Location unavailable", description: message, variant: "destructive" });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={query}
          onChange={handleInputChange}
          onFocus={() => results.length > 0 && setShowResults(true)}
          placeholder={placeholder}
          className="pl-8 pr-8"
          data-testid="input-location-search"
        />
        {isSearching && (
          <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground animate-spin" />
        )}
        {query && !isSearching && (
          <button
            type="button"
            onClick={clearLocation}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={useCurrentLocation}
        disabled={isGettingLocation}
        className="mt-1.5 h-7 px-2 text-[11px] text-primary hover:text-primary hover:bg-primary/10 gap-1.5"
        data-testid="button-use-current-location"
      >
        {isGettingLocation ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Navigation className="h-3 w-3" />
        )}
        {isGettingLocation ? "Getting location..." : "Use current location"}
      </Button>

      {showResults && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
          {results.map((result, i) => (
            <button
              key={i}
              type="button"
              onClick={() => selectLocation(result)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-accent/50 transition-colors border-b border-border/30 last:border-0 flex items-start gap-2"
              data-testid={`location-result-${i}`}
            >
              <MapPin className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
              <span className="text-foreground line-clamp-2">{result.display_name}</span>
            </button>
          ))}
        </div>
      )}

      {latitude != null && longitude != null && (
        <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
          <MapPin className="h-2.5 w-2.5" />
          <span>{latitude.toFixed(4)}, {longitude.toFixed(4)}</span>
        </div>
      )}
    </div>
  );
}

function formatLocationName(fullName: string): string {
  const parts = fullName.split(", ");
  if (parts.length <= 3) return fullName;
  return parts.slice(0, 3).join(", ");
}
