import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { MapPin, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGoogleMaps, ensureGoogleMapsLoaded } from "@/hooks/use-google-maps";

interface LocationSearchProps {
  value: string;
  latitude?: number | null;
  longitude?: number | null;
  onChange: (location: string, lat: number | null, lng: number | null) => void;
  placeholder?: string;
  onGettingLocationChange?: (getting: boolean) => void;
  triggerCurrentLocation?: number;
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  if (!window.google?.maps) {
    await ensureGoogleMapsLoaded();
  }
  if (window.google?.maps) {
    try {
      const geocoder = new google.maps.Geocoder();
      const result = await geocoder.geocode({ location: { lat, lng } });
      if (result.results?.[0]) {
        return formatGoogleAddress(result.results[0]);
      }
    } catch {}
  }
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

function formatGoogleAddress(result: google.maps.GeocoderResult): string {
  const components = result.address_components || [];
  const get = (type: string) => components.find((c) => c.types.includes(type))?.long_name;

  const locality = get("locality") || get("sublocality") || get("administrative_area_level_2");
  const area = get("administrative_area_level_1");
  const country = get("country");

  const parts = [locality, area, country].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : result.formatted_address || "";
}

export function LocationSearch({
  value,
  latitude,
  longitude,
  onChange,
  placeholder = "Search for a location...",
  onGettingLocationChange,
  triggerCurrentLocation,
}: LocationSearchProps) {
  const [query, setQuery] = useState(value || "");
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const hiddenDivRef = useRef<HTMLDivElement | null>(null);
  const { toast } = useToast();
  const { ready: mapsReady } = useGoogleMaps();

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  useEffect(() => {
    if (!mapsReady) return;
    autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
    if (!hiddenDivRef.current) {
      hiddenDivRef.current = document.createElement("div");
    }
    placesServiceRef.current = new google.maps.places.PlacesService(hiddenDivRef.current);
  }, [mapsReady]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const searchLocations = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 3 || !autocompleteServiceRef.current) {
      setPredictions([]);
      return;
    }

    setIsSearching(true);
    try {
      const result = await new Promise<google.maps.places.AutocompletePrediction[]>((resolve) => {
        autocompleteServiceRef.current!.getPlacePredictions(
          {
            input: searchQuery,
            types: [],
          },
          (preds, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && preds) {
              resolve(preds);
            } else {
              resolve([]);
            }
          }
        );
      });
      setPredictions(result);
      setShowResults(true);
    } catch {
      setPredictions([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val, null, null);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchLocations(val), 300);
  };

  const selectPrediction = (prediction: google.maps.places.AutocompletePrediction) => {
    if (!placesServiceRef.current) return;

    placesServiceRef.current.getDetails(
      { placeId: prediction.place_id, fields: ["geometry", "name", "formatted_address"] },
      (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          const name = prediction.structured_formatting?.main_text || place.name || prediction.description;
          const fullName = prediction.description;
          const shortName = name.length > 60 ? name.substring(0, 57) + "..." : fullName;
          setQuery(shortName);
          setShowResults(false);
          setPredictions([]);
          onChange(shortName, lat, lng);
        }
      }
    );
  };

  const clearLocation = () => {
    setQuery("");
    setPredictions([]);
    setShowResults(false);
    onChange("", null, null);
  };

  const useCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast({ title: "Not supported", description: "Location is not available on this device.", variant: "destructive" });
      return;
    }

    setIsGettingLocation(true);
    onGettingLocationChange?.(true);
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
          onGettingLocationChange?.(false);
        }
      },
      (error) => {
        setIsGettingLocation(false);
        onGettingLocationChange?.(false);
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
  }, [onChange, onGettingLocationChange, toast]);

  useEffect(() => {
    if (triggerCurrentLocation && triggerCurrentLocation > 0) {
      useCurrentLocation();
    }
  }, [triggerCurrentLocation, useCurrentLocation]);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={query}
          onChange={handleInputChange}
          onFocus={() => predictions.length > 0 && setShowResults(true)}
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

      {showResults && predictions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
          {predictions.map((prediction, i) => (
            <button
              key={prediction.place_id}
              type="button"
              onClick={() => selectPrediction(prediction)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-accent/50 transition-colors border-b border-border/30 last:border-0 flex items-start gap-2"
              data-testid={`location-result-${i}`}
            >
              <MapPin className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
              <div className="min-w-0">
                <div className="text-foreground font-medium text-xs">{prediction.structured_formatting?.main_text}</div>
                <div className="text-muted-foreground text-xs truncate">{prediction.structured_formatting?.secondary_text}</div>
              </div>
            </button>
          ))}
        </div>
      )}

    </div>
  );
}
