import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X, Briefcase } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ProUser {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  businessName: string;
  entityType: string;
  profileImageUrl: string | null;
}

interface ProTagSearchProps {
  value: string | null;
  onChange: (userId: string | null, display?: string) => void;
}

const ENTITY_LABELS: Record<string, string> = {
  outfitter: "Outfitter",
  professional_hunter: "PH",
  taxidermist: "Taxidermist",
};

export default function ProTagSearch({ value, onChange }: ProTagSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDisplay, setSelectedDisplay] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { data: results = [] } = useQuery<ProUser[]>({
    queryKey: ["/api/pro/search", query],
    queryFn: async () => {
      if (query.length < 2) return [];
      const res = await fetch(`/api/pro/search?q=${encodeURIComponent(query)}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: query.length >= 2,
  });

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = (pro: ProUser) => {
    const display = `${pro.businessName} (${pro.firstName || ""} ${pro.lastName || ""})`.trim();
    setSelectedDisplay(display);
    setQuery("");
    setIsOpen(false);
    onChange(pro.userId, display);
  };

  const handleClear = () => {
    setSelectedDisplay(null);
    setQuery("");
    onChange(null);
  };

  if (value && selectedDisplay) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-primary/30 bg-primary/5" data-testid="tag-selected-pro">
        <Briefcase className="h-3.5 w-3.5 text-primary shrink-0" />
        <span className="text-sm text-foreground flex-1 truncate">{selectedDisplay}</span>
        <button onClick={handleClear} className="text-muted-foreground hover:text-foreground" data-testid="button-clear-pro-tag">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search pro users (outfitters, PHs, taxidermists)..."
          className="pl-9 text-sm"
          data-testid="input-pro-tag-search"
        />
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-card border border-border/40 rounded-lg shadow-xl max-h-48 overflow-y-auto" data-testid="dropdown-pro-results">
          {results.map((pro) => (
            <button
              key={pro.userId}
              onClick={() => handleSelect(pro)}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors text-left"
              data-testid={`option-pro-${pro.userId}`}
            >
              {pro.profileImageUrl ? (
                <img src={pro.profileImageUrl} alt="" className="h-8 w-8 rounded-full object-cover border border-border/30" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <Briefcase className="h-4 w-4 text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate">{pro.businessName}</div>
                <div className="text-xs text-muted-foreground">
                  {pro.firstName} {pro.lastName} · {ENTITY_LABELS[pro.entityType] || pro.entityType}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && query.length >= 2 && results.length === 0 && (
        <div className="absolute z-50 mt-1 w-full bg-card border border-border/40 rounded-lg shadow-xl p-3 text-center text-xs text-muted-foreground">
          No pro users found
        </div>
      )}
    </div>
  );
}
