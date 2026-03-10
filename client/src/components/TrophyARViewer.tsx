import { useRef, useEffect, useState } from "react";
import { X, View, Smartphone, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface TrophyARViewerProps {
  glbUrl: string;
  species: string;
  mountType: string | null;
  theme: string;
  onClose: () => void;
}

const themeBackgrounds: Record<string, string> = {
  lodge: "#1a1410",
  manor: "#1a1512",
  minimal: "#f5f5f0",
};

const themeForegrounds: Record<string, string> = {
  lodge: "#e8ddd0",
  manor: "#e8ddd0",
  minimal: "#1a1a1a",
};

function getMountLabel(mountType: string | null): string {
  switch (mountType) {
    case "shoulder": return "Shoulder Mount";
    case "horns": return "Horn Mount";
    case "full_body": return "Full Body Mount";
    default: return "Trophy Mount";
  }
}

export default function TrophyARViewer({ glbUrl, species, mountType, theme, onClose }: TrophyARViewerProps) {
  const viewerRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [arSupported, setArSupported] = useState(false);

  const bgColor = themeBackgrounds[theme] || themeBackgrounds.lodge;
  const fgColor = themeForegrounds[theme] || themeForegrounds.lodge;
  const isLight = theme === "minimal";

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const handleLoad = () => setLoading(false);
    const handleArStatus = (e: any) => {
      if (e.detail.status === "not-presenting") {
        setArSupported(true);
      }
    };

    viewer.addEventListener("load", handleLoad);
    viewer.addEventListener("ar-status", handleArStatus);

    if (viewer.canActivateAR) {
      setArSupported(true);
    }

    return () => {
      viewer.removeEventListener("load", handleLoad);
      viewer.removeEventListener("ar-status", handleArStatus);
    };
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const activateAR = () => {
    if (viewerRef.current?.canActivateAR) {
      viewerRef.current.activateAR();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex flex-col"
        style={{ backgroundColor: bgColor }}
        data-testid="trophy-ar-viewer"
      >
        <div
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{
            borderColor: isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)",
            backgroundColor: isLight ? "rgba(255,255,255,0.95)" : "rgba(0,0,0,0.4)",
          }}
        >
          <div className="flex-1 min-w-0">
            <h2 className="font-serif text-lg font-semibold truncate" style={{ color: fgColor }}>
              {species}
            </h2>
            <p className="text-xs opacity-60" style={{ color: fgColor }}>
              {getMountLabel(mountType)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="shrink-0"
            style={{ color: fgColor }}
            data-testid="button-close-ar"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="text-center">
                <Loader2 className="h-10 w-10 animate-spin mx-auto mb-3" style={{ color: fgColor }} />
                <p className="text-sm font-medium" style={{ color: fgColor }}>Loading 3D model...</p>
              </div>
            </div>
          )}

          <model-viewer
            ref={viewerRef}
            src={glbUrl}
            alt={`3D model of ${species}`}
            ar
            ar-modes="webxr scene-viewer quick-look"
            ar-placement="wall"
            camera-controls
            auto-rotate
            auto-rotate-delay={2000}
            rotation-per-second="20deg"
            shadow-intensity="1"
            environment-image="neutral"
            interaction-prompt="auto"
            camera-orbit="0deg 75deg 2.5m"
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: bgColor,
              "--poster-color": bgColor,
            } as React.CSSProperties}
            data-testid="model-viewer-3d"
          />
        </div>

        <div
          className="flex items-center justify-center gap-3 px-4 py-3 border-t"
          style={{
            borderColor: isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)",
            backgroundColor: isLight ? "rgba(255,255,255,0.95)" : "rgba(0,0,0,0.4)",
          }}
        >
          <Button
            onClick={activateAR}
            className="gap-2 flex-1 max-w-xs"
            style={{
              backgroundColor: "#b87333",
              color: "#fff",
            }}
            data-testid="button-view-ar"
          >
            <Smartphone className="h-4 w-4" />
            View on Your Wall
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              if (viewerRef.current) {
                viewerRef.current.resetTurntableRotation();
                viewerRef.current.cameraOrbit = "0deg 75deg 2.5m";
              }
            }}
            style={{
              borderColor: isLight ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.2)",
              color: fgColor,
            }}
            data-testid="button-reset-view"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        {!arSupported && !loading && (
          <div
            className="absolute bottom-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-xs"
            style={{
              backgroundColor: isLight ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.15)",
              color: isLight ? "#fff" : "rgba(255,255,255,0.7)",
            }}
          >
            Open on your phone for AR wall placement
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
