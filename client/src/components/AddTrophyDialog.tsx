import { useState, useRef, useCallback, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { getAuthToken } from "@/lib/auth-token";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Upload, Sparkles, Check, AlertTriangle, X, Loader2, Crop, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactCrop, { type Crop as CropType, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import type { Weapon } from "@shared/schema";
import { LocationSearch, reverseGeocode } from "@/components/LocationSearch";
import { findClosestSpecies } from "@shared/scoring-thresholds";
import exifr from "exifr";
import ProTagSearch from "@/components/ProTagSearch";

export interface TrophyAnalysis {
  animal_detected: boolean;
  species: {
    common_name: string;
    scientific_name: string;
    category: string;
    confidence: number;
  };
  gender: {
    estimated: "male" | "female" | "unknown";
    confidence: number;
  };
  photo_quality: {
    score: number;
    issues: string[];
    suitable_for_3d: boolean;
  };
  mount_recommendation: {
    best: string;
  };
  horn_details: {
    has_horns: boolean;
    horn_type: string | null;
    estimated_length_inches: number | null;
    estimated_length_cm: number | null;
    length_range_low: number | null;
    length_range_high: number | null;
    notable_features: string | null;
    coloring: string | null;
  };
  trophy_qualification: {
    scoring_system: string;
    minimum_qualifying_score: string | null;
    estimated_score: string | null;
    likely_qualifies: boolean | null;
    confidence: number;
    notes: string | null;
  };
  trophy_vault_score: number;
}

export const HUNTING_METHODS = [
  "Walk and stalk",
  "Ground blind / Hide",
  "Tree stand / Elevated",
  "Vehicle",
  "Driven hunt",
  "Other",
] as const;

type Step = "upload" | "crop" | "analyzing" | "form";

interface AddTrophyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { "X-Auth-Token": token } : {};
}

function getCroppedBlob(image: HTMLImageElement, crop: CropType): Promise<Blob> {
  const canvas = document.createElement("canvas");
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width * scaleX;
  canvas.height = crop.height * scaleY;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.92);
  });
}

function getEstimatedScoreNumber(analysis: TrophyAnalysis | null): string {
  if (!analysis?.horn_details?.has_horns) return "";
  const low = analysis.horn_details.length_range_low;
  const high = analysis.horn_details.length_range_high;
  if (low != null && high != null) {
    const mid = Math.round(((low + high) / 2) * 10) / 10;
    return `${mid}`;
  }
  if (analysis.trophy_qualification?.estimated_score) {
    return analysis.trophy_qualification.estimated_score.replace(/[^0-9.\/ ]/g, "").trim();
  }
  return "";
}

export default function AddTrophyDialog({ open, onOpenChange }: AddTrophyDialogProps) {
  const [step, setStep] = useState<Step>("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [croppedPreviewUrl, setCroppedPreviewUrl] = useState<string | null>(null);
  const [croppedFile, setCroppedFile] = useState<File | null>(null);
  const [crop, setCrop] = useState<CropType>();
  const [analysis, setAnalysis] = useState<TrophyAnalysis | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [renderImageUrl, setRenderImageUrl] = useState<string | null>(null);
  const [weaponId, setWeaponId] = useState<string>("");
  const [analysisUnits, setAnalysisUnits] = useState<string>("imperial");
  const [locationName, setLocationName] = useState<string>("");
  const [locationLat, setLocationLat] = useState<number | null>(null);
  const [locationLng, setLocationLng] = useState<number | null>(null);
  const [exifDate, setExifDate] = useState<string | null>(null);
  const [exifLocationSource, setExifLocationSource] = useState<string | null>(null);
  const [methodValue, setMethodValue] = useState<string>("");
  const [distanceUnit, setDistanceUnit] = useState<string>("yards");
  const [scoreUnit, setScoreUnit] = useState<string>('"');
  const [renderPollingImageUrl, setRenderPollingImageUrl] = useState<string | null>(null);
  const [glbUrl, setGlbUrl] = useState<string | null>(null);
  const [glbPreviewUrl, setGlbPreviewUrl] = useState<string | null>(null);
  const [modelPollingImageUrl, setModelPollingImageUrl] = useState<string | null>(null);
  const [taggedProUserId, setTaggedProUserId] = useState<string | null>(null);
  const fileSelectionIdRef = useRef(0);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cropImageRef = useRef<HTMLImageElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: weapons = [] } = useQuery<Weapon[]>({
    queryKey: ["/api/weapons"],
    enabled: open,
  });

  const { data: prefs } = useQuery<{ units?: string; scoringSystem?: string }>({
    queryKey: ["/api/preferences"],
    enabled: open,
  });

  useEffect(() => {
    if (prefs?.units) {
      setDistanceUnit(prefs.units === "metric" ? "m" : "yards");
      setScoreUnit(prefs.units === "metric" ? "cm" : '"');
      setAnalysisUnits(prefs.units);
    }
  }, [prefs?.units]);

  useEffect(() => {
    if (!renderPollingImageUrl || renderImageUrl) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/trophies/render-status?imageUrl=${encodeURIComponent(renderPollingImageUrl)}`, {
          credentials: "include",
          headers: getAuthHeaders(),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.status === "done" && data.renderImageUrl) {
          setRenderImageUrl(data.renderImageUrl);
          setRenderPollingImageUrl(null);
        } else if (data.status === "failed") {
          setRenderPollingImageUrl(null);
        }
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [renderPollingImageUrl, renderImageUrl]);

  useEffect(() => {
    if (!modelPollingImageUrl || glbUrl) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/trophies/model-status?imageUrl=${encodeURIComponent(modelPollingImageUrl)}`, {
          credentials: "include",
          headers: getAuthHeaders(),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.status === "done" && data.glbUrl) {
          setGlbUrl(data.glbUrl);
          setGlbPreviewUrl(data.glbPreviewUrl || null);
          setModelPollingImageUrl(null);
        } else if (data.status === "failed") {
          setModelPollingImageUrl(null);
        }
      } catch {}
    }, 5000);
    return () => clearInterval(interval);
  }, [modelPollingImageUrl, glbUrl]);

  const resetState = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (croppedPreviewUrl) URL.revokeObjectURL(croppedPreviewUrl);
    setStep("upload");
    setSelectedFile(null);
    setPreviewUrl(null);
    setCroppedPreviewUrl(null);
    setCroppedFile(null);
    setCrop(undefined);
    setAnalysis(null);
    setUploadedImageUrl(null);
    setRenderImageUrl(null);
    setWeaponId("");
    setAnalysisUnits(prefs?.units || "imperial");
    setLocationName("");
    setLocationLat(null);
    setLocationLng(null);
    setExifDate(null);
    setExifLocationSource(null);
    setMethodValue("");
    setRenderPollingImageUrl(null);
    setGlbUrl(null);
    setGlbPreviewUrl(null);
    setModelPollingImageUrl(null);
    setTaggedProUserId(null);
    setDistanceUnit(prefs?.units === "metric" ? "m" : "yards");
    setScoreUnit(prefs?.units === "metric" ? "cm" : '"');
  }, [previewUrl, croppedPreviewUrl, prefs?.units]);

  const handleOpenChange = useCallback((val: boolean) => {
    if (!val) resetState();
    onOpenChange(val);
  }, [onOpenChange, resetState]);

  const analyzeMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/trophies/analyze", {
        method: "POST",
        body: formData,
        credentials: "include",
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        if (res.status === 401) throw new Error("Session expired. Please log out and log back in.");
        const err = await res.json().catch(() => ({ message: "Analysis failed" }));
        throw new Error(err.message || "Analysis failed");
      }
      return res.json() as Promise<{ imageUrl: string; renderImageUrl: string | null; analysis: TrophyAnalysis; units: string; scoringSystem: string }>;
    },
    onSuccess: (data) => {
      setAnalysis(data.analysis);
      setUploadedImageUrl(data.imageUrl);
      setRenderImageUrl(data.renderImageUrl || null);
      setAnalysisUnits(data.units || "imperial");
      setRenderPollingImageUrl(data.imageUrl);
      setModelPollingImageUrl(data.imageUrl);
      setStep("form");
    },
    onError: (error: Error) => {
      toast({ title: "AI analysis failed", description: error.message, variant: "destructive" });
      setStep("upload");
    },
  });

  const uploadOnlyMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/trophies/upload-image", {
        method: "POST",
        body: formData,
        credentials: "include",
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        if (res.status === 401) throw new Error("Session expired. Please log out and log back in.");
        const err = await res.json().catch(() => ({ message: "Upload failed" }));
        throw new Error(err.message || "Upload failed");
      }
      return res.json() as Promise<{ imageUrl: string }>;
    },
    onSuccess: (data) => {
      setUploadedImageUrl(data.imageUrl);
      setStep("form");
    },
    onError: (error: Error) => {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    },
  });

  const createTrophyMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/trophies", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trophies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      handleOpenChange(false);
      toast({ title: "Trophy added", description: "Your trophy has been added to your trophy room." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleFileSelect = async (file: File) => {
    const selectionId = ++fileSelectionIdRef.current;
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setCroppedPreviewUrl(null);
    setCroppedFile(null);
    setCrop(undefined);
    setExifDate(null);
    setExifLocationSource(null);
    setLocationName("");
    setLocationLat(null);
    setLocationLng(null);

    try {
      const exifData = await exifr.parse(file, {
        gps: true,
        pick: ["DateTimeOriginal", "CreateDate", "GPSLatitude", "GPSLongitude"],
      });

      if (selectionId !== fileSelectionIdRef.current) return;

      if (exifData) {
        const dateValue = exifData.DateTimeOriginal || exifData.CreateDate;
        if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
          const yyyy = dateValue.getFullYear();
          const mm = String(dateValue.getMonth() + 1).padStart(2, "0");
          const dd = String(dateValue.getDate()).padStart(2, "0");
          setExifDate(`${yyyy}-${mm}-${dd}`);
        }

        if (exifData.latitude != null && exifData.longitude != null) {
          const lat = exifData.latitude;
          const lng = exifData.longitude;
          setLocationLat(lat);
          setLocationLng(lng);
          setExifLocationSource("photo");
          try {
            const name = await reverseGeocode(lat, lng);
            if (selectionId !== fileSelectionIdRef.current) return;
            setLocationName(name);
          } catch {
            if (selectionId !== fileSelectionIdRef.current) return;
            setLocationName(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          }
        }
      }
    } catch {
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) handleFileSelect(file);
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const initialCrop = centerCrop(
      makeAspectCrop({ unit: "%", width: 90 }, 4 / 3, width, height),
      width,
      height,
    );
    setCrop(initialCrop);
  };

  const handleCropDone = async () => {
    if (!crop || !cropImageRef.current || crop.width < 10 || crop.height < 10) {
      toast({ title: "Invalid crop", description: "Please select a larger area to crop", variant: "destructive" });
      return;
    }
    try {
      const blob = await getCroppedBlob(cropImageRef.current, crop);
      if (!blob || blob.size === 0) {
        toast({ title: "Crop failed", description: "Could not crop the image", variant: "destructive" });
        return;
      }
      const file = new File([blob], selectedFile?.name || "cropped.jpg", { type: "image/jpeg" });
      setCroppedFile(file);
      if (croppedPreviewUrl) URL.revokeObjectURL(croppedPreviewUrl);
      const url = URL.createObjectURL(blob);
      setCroppedPreviewUrl(url);
      setStep("upload");
    } catch {
      toast({ title: "Crop failed", description: "Could not crop the image", variant: "destructive" });
    }
  };

  const getFileToUpload = () => croppedFile || selectedFile;
  const getPreviewToShow = () => croppedPreviewUrl || previewUrl;

  const startAnalysis = () => {
    const file = getFileToUpload();
    if (!file) return;
    setStep("analyzing");
    analyzeMutation.mutate(file);
  };

  const skipAnalysis = () => {
    const file = getFileToUpload();
    if (!file) return;
    uploadOnlyMutation.mutate(file);
  };

  const handleCreateTrophy = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const selectedWeapon = weapons.find(w => w.id === weaponId);

    const shotDistNum = (formData.get("shotDistanceNum") as string || "").trim();
    const shotDistVal = shotDistNum ? `${shotDistNum} ${distanceUnit}` : null;

    const scoreNum = (formData.get("scoreNum") as string || "").trim();
    let scoreVal: string | null = null;
    if (scoreNum) {
      if (scoreUnit === "cm") scoreVal = `${scoreNum} cm`;
      else if (scoreUnit === '"') scoreVal = `${scoreNum}"`;
      else scoreVal = `${scoreNum} Score`;
    }

    const method = methodValue && methodValue !== "__none__" ? methodValue : null;

    createTrophyMutation.mutate({
      species: formData.get("species") as string,
      name: formData.get("name") as string,
      date: formData.get("date") as string,
      location: locationName || null,
      latitude: locationLat,
      longitude: locationLng,
      score: scoreVal,
      method: method || (selectedWeapon ? selectedWeapon.type : null),
      weaponId: weaponId && weaponId !== "__other__" ? weaponId : null,
      gender: analysis?.gender?.estimated || (formData.get("gender") as string) || null,
      shotDistance: shotDistVal,
      notes: (formData.get("notes") as string) || null,
      huntNotes: (formData.get("huntNotes") as string) || null,
      imageUrl: uploadedImageUrl,
      renderImageUrl: renderImageUrl,
      glbUrl: glbUrl,
      glbPreviewUrl: glbPreviewUrl,
      mountType: analysis?.mount_recommendation?.best || null,
      featured: false,
      isAiAnalyzed: !!analysis,
      taggedProUserId: taggedProUserId || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[560px] p-0 overflow-hidden bg-card border-border/50 max-h-[90vh] overflow-y-auto">
        <AnimatePresence mode="wait">
          {step === "upload" && (
            <UploadStep
              key="upload"
              previewUrl={getPreviewToShow()}
              selectedFile={selectedFile}
              hasCrop={!!croppedFile}
              onFileInput={handleFileInput}
              onDrop={handleDrop}
              cameraInputRef={cameraInputRef}
              galleryInputRef={galleryInputRef}
              onAnalyze={startAnalysis}
              onSkip={skipAnalysis}
              onCrop={() => setStep("crop")}
              onRemoveFile={() => { fileSelectionIdRef.current++; setSelectedFile(null); setPreviewUrl(null); setCroppedFile(null); setCroppedPreviewUrl(null); setExifDate(null); setExifLocationSource(null); setLocationName(""); setLocationLat(null); setLocationLng(null); }}
              isUploading={uploadOnlyMutation.isPending}
            />
          )}
          {step === "crop" && previewUrl && (
            <CropStep
              key="crop"
              previewUrl={previewUrl}
              crop={crop}
              setCrop={setCrop}
              onImageLoad={onImageLoad}
              cropImageRef={cropImageRef}
              onDone={handleCropDone}
              onCancel={() => setStep("upload")}
            />
          )}
          {step === "analyzing" && (
            <AnalyzingStep key="analyzing" previewUrl={getPreviewToShow()} />
          )}
          {step === "form" && (
            <FormStep
              key="form"
              analysis={analysis}
              renderGenerating={!!renderPollingImageUrl}
              previewUrl={getPreviewToShow()}
              weaponId={weaponId}
              setWeaponId={setWeaponId}
              weapons={weapons}
              units={analysisUnits}
              onSubmit={handleCreateTrophy}
              isPending={createTrophyMutation.isPending}
              locationName={locationName}
              locationLat={locationLat}
              locationLng={locationLng}
              setLocationName={setLocationName}
              setLocationLat={setLocationLat}
              setLocationLng={setLocationLng}
              exifDate={exifDate}
              exifLocationSource={exifLocationSource}
              setExifLocationSource={setExifLocationSource}
              methodValue={methodValue}
              setMethodValue={setMethodValue}
              distanceUnit={distanceUnit}
              setDistanceUnit={setDistanceUnit}
              scoreUnit={scoreUnit}
              setScoreUnit={setScoreUnit}
              taggedProUserId={taggedProUserId}
              setTaggedProUserId={setTaggedProUserId}
            />
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

function UploadStep({
  previewUrl,
  selectedFile,
  hasCrop,
  onFileInput,
  onDrop,
  cameraInputRef,
  galleryInputRef,
  onAnalyze,
  onSkip,
  onCrop,
  onRemoveFile,
  isUploading,
}: {
  previewUrl: string | null;
  selectedFile: File | null;
  hasCrop: boolean;
  onFileInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDrop: (e: React.DragEvent) => void;
  cameraInputRef: React.RefObject<HTMLInputElement | null>;
  galleryInputRef: React.RefObject<HTMLInputElement | null>;
  onAnalyze: () => void;
  onSkip: () => void;
  onCrop: () => void;
  onRemoveFile: () => void;
  isUploading: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-6"
    >
      <DialogHeader className="mb-5">
        <DialogTitle className="font-serif text-xl flex items-center gap-2">
          <Camera className="h-5 w-5 text-primary" />
          Add New Trophy
        </DialogTitle>
      </DialogHeader>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onFileInput}
        className="hidden"
        data-testid="input-trophy-camera"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={onFileInput}
        className="hidden"
        data-testid="input-trophy-gallery"
      />

      {!selectedFile ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className="border-2 border-dashed border-border/60 rounded-xl p-8 text-center hover:border-primary/50 hover:bg-primary/5 transition-all group"
          data-testid="dropzone-trophy-image"
        >
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
            <Upload className="h-7 w-7 text-primary" />
          </div>
          <h3 className="font-serif font-bold text-foreground mb-1">Upload Trophy Photo</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Take a photo or select from your gallery
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              size="sm"
              variant="secondary"
              className="bg-primary/10 text-primary hover:bg-primary/20"
              onClick={() => cameraInputRef.current?.click()}
              data-testid="button-take-photo"
            >
              <Camera className="h-4 w-4 mr-1.5" /> Take Photo
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="bg-primary/10 text-primary hover:bg-primary/20"
              onClick={() => galleryInputRef.current?.click()}
              data-testid="button-choose-gallery"
            >
              <ImageIcon className="h-4 w-4 mr-1.5" /> Gallery
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">JPEG, PNG, or WebP up to 10MB</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative rounded-xl overflow-hidden border border-border/40">
            <img
              src={previewUrl!}
              alt="Trophy preview"
              className="w-full max-h-[300px] object-contain bg-black/5"
              data-testid="img-trophy-preview"
            />
            <button
              onClick={(e) => { e.stopPropagation(); onRemoveFile(); }}
              className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center hover:bg-destructive/80 hover:text-white transition-colors"
              data-testid="button-remove-photo"
            >
              <X className="h-4 w-4" />
            </button>
            {hasCrop && (
              <div className="absolute top-2 left-2 bg-green-500/80 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <Check className="h-3 w-3" /> Cropped
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={onCrop}
              variant="outline"
              size="sm"
              className="gap-1"
              data-testid="button-crop-photo"
            >
              <Crop className="h-4 w-4" /> Crop
            </Button>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-foreground">AI Species Identification</p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  Our AI will identify the species and pre-fill your trophy details while you continue filling the form.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={onAnalyze}
              className="flex-1 gap-2"
              data-testid="button-analyze-trophy"
            >
              <Sparkles className="h-4 w-4" />
              Analyze with AI
            </Button>
            <Button
              onClick={onSkip}
              variant="outline"
              className="gap-2"
              disabled={isUploading}
              data-testid="button-skip-analysis"
            >
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Skip"}
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function CropStep({
  previewUrl,
  crop,
  setCrop,
  onImageLoad,
  cropImageRef,
  onDone,
  onCancel,
}: {
  previewUrl: string;
  crop: CropType | undefined;
  setCrop: (c: CropType) => void;
  onImageLoad: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  cropImageRef: React.RefObject<HTMLImageElement | null>;
  onDone: () => void;
  onCancel: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-6"
    >
      <DialogHeader className="mb-4">
        <DialogTitle className="font-serif text-xl flex items-center gap-2">
          <Crop className="h-5 w-5 text-primary" />
          Crop Image
        </DialogTitle>
      </DialogHeader>

      <p className="text-sm text-muted-foreground mb-3">
        Drag to adjust the crop area. Focus on the animal for best AI results.
      </p>

      <div className="rounded-xl overflow-hidden border border-border/40 mb-4 max-h-[400px] flex items-center justify-center bg-black/5">
        <ReactCrop crop={crop} onChange={(c) => setCrop(c)} minWidth={50} minHeight={50}>
          <img
            ref={cropImageRef}
            src={previewUrl}
            alt="Crop preview"
            onLoad={onImageLoad}
            className="max-h-[380px] w-auto"
            data-testid="img-crop-preview"
          />
        </ReactCrop>
      </div>

      <div className="flex gap-2">
        <Button onClick={onDone} className="flex-1 gap-2" data-testid="button-apply-crop">
          <Check className="h-4 w-4" /> Apply Crop
        </Button>
        <Button onClick={onCancel} variant="outline" data-testid="button-cancel-crop">
          Cancel
        </Button>
      </div>
    </motion.div>
  );
}

function AnalyzingStep({ previewUrl }: { previewUrl: string | null }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-6 text-center"
    >
      <DialogHeader className="mb-5">
        <DialogTitle className="font-serif text-xl flex items-center justify-center gap-2">
          <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          Analyzing Trophy
        </DialogTitle>
      </DialogHeader>

      <div className="relative rounded-xl overflow-hidden mb-6 border border-border/40 min-h-[200px]">
        {previewUrl && (
          <img
            src={previewUrl}
            alt="Analyzing..."
            className="w-full max-h-[250px] object-contain bg-black/5"
          />
        )}
        <div className="absolute inset-0 bg-background/40 backdrop-blur-[2px] flex items-center justify-center min-h-[200px]">
          <div className="text-center flex flex-col items-center">
            <div className="mb-3">
              <div className="h-12 w-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            </div>
            <p className="text-sm font-medium text-foreground">Identifying species...</p>
            <p className="text-xs text-muted-foreground mt-1">Analyzing horns, quality, and trophy details</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function UnitToggle({ options, value, onChange, testId }: {
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
  testId?: string;
}) {
  return (
    <div className="flex rounded-md border border-border/50 overflow-hidden" data-testid={testId}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={cn(
            "px-2 py-1 text-xs font-medium transition-colors",
            value === opt.value
              ? "bg-primary text-primary-foreground"
              : "bg-card text-muted-foreground hover:bg-muted"
          )}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function FormStep({
  analysis,
  renderGenerating,
  previewUrl,
  weaponId,
  setWeaponId,
  weapons,
  units,
  onSubmit,
  isPending,
  locationName,
  locationLat,
  locationLng,
  setLocationName,
  setLocationLat,
  setLocationLng,
  exifDate,
  exifLocationSource,
  setExifLocationSource,
  methodValue,
  setMethodValue,
  distanceUnit,
  setDistanceUnit,
  scoreUnit,
  setScoreUnit,
  taggedProUserId,
  setTaggedProUserId,
}: {
  analysis: TrophyAnalysis | null;
  renderGenerating: boolean;
  previewUrl: string | null;
  weaponId: string;
  setWeaponId: (v: string) => void;
  weapons: Weapon[];
  units: string;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isPending: boolean;
  locationName: string;
  locationLat: number | null;
  locationLng: number | null;
  setLocationName: (v: string) => void;
  setLocationLat: (v: number | null) => void;
  setLocationLng: (v: number | null) => void;
  exifDate: string | null;
  exifLocationSource: string | null;
  setExifLocationSource: (v: string | null) => void;
  methodValue: string;
  setMethodValue: (v: string) => void;
  distanceUnit: string;
  setDistanceUnit: (v: string) => void;
  scoreUnit: string;
  setScoreUnit: (v: string) => void;
  taggedProUserId: string | null;
  setTaggedProUserId: (v: string | null) => void;
}) {
  const estimatedScore = getEstimatedScoreNumber(analysis);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="p-6"
    >
      <DialogHeader className="mb-4">
        <DialogTitle className="font-serif text-xl">Trophy Details</DialogTitle>
      </DialogHeader>

      {renderGenerating && (
        <div className="flex items-center gap-2 mb-4 p-2 bg-primary/5 border border-primary/20 rounded-lg">
          <Loader2 className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />
          <span className="text-xs text-primary/80">Generating 3D mount render...</span>
        </div>
      )}

      {analysis && (
        <div className="flex items-center gap-3 mb-4 p-2 bg-card border border-border/40 rounded-lg">
          <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0">
            {previewUrl && <img src={previewUrl} alt="Trophy" className="w-full h-full object-cover" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-foreground truncate">{analysis.species.common_name}</p>
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full shrink-0">
                AI Filled
              </span>
              {analysis.gender?.estimated && analysis.gender.estimated !== "unknown" && (
                <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded capitalize shrink-0">
                  {analysis.gender.estimated}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground italic truncate">{analysis.species.scientific_name}</p>
          </div>
        </div>
      )}

      {analysis?.trophy_qualification && (
        <div className="flex items-center gap-3 mb-4 p-2 bg-card border border-border/40 rounded-lg text-xs" data-testid="trophy-qualification-summary">
          <div className="flex items-center gap-2 flex-wrap">
            {analysis.trophy_qualification.likely_qualifies != null && (
              <span className={`px-2 py-0.5 rounded-full font-medium ${analysis.trophy_qualification.likely_qualifies ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"}`} data-testid="text-qualification-status">
                {analysis.trophy_qualification.likely_qualifies ? "Likely Qualifies" : "May Not Qualify"}
              </span>
            )}
            {analysis.trophy_qualification.confidence > 0 && (
              <span className="text-muted-foreground" data-testid="text-qualification-confidence">
                {Math.round(analysis.trophy_qualification.confidence * 100)}% confidence
              </span>
            )}
            {analysis.trophy_qualification.minimum_qualifying_score && (
              <span className="text-muted-foreground" data-testid="text-qualification-minimum">
                Min: {analysis.trophy_qualification.minimum_qualifying_score} ({analysis.trophy_qualification.scoring_system})
              </span>
            )}
          </div>
        </div>
      )}

      {!analysis && previewUrl && (
        <div className="flex items-center gap-3 mb-4 p-2 bg-card border border-border/40 rounded-lg">
          <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0">
            <img src={previewUrl} alt="Trophy" className="w-full h-full object-cover" />
          </div>
          <p className="text-xs text-muted-foreground">Photo uploaded. Fill in details below.</p>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="species" className="text-xs">Species *</Label>
            <Input
              id="species"
              name="species"
              required
              defaultValue={analysis?.species.common_name || ""}
              data-testid="input-trophy-species"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs">Trophy Name *</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue=""
              placeholder={analysis ? `e.g. ${analysis.species.common_name} bull Work trip ${new Date().getFullYear()}` : "e.g. Kudu bull Work trip 2026"}
              className="placeholder:text-muted-foreground/40"
              data-testid="input-trophy-name"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="date" className="text-xs flex items-center gap-1.5">
              Date *
              {exifDate && (
                <span className="text-[10px] text-primary font-normal flex items-center gap-0.5">
                  <Camera className="h-2.5 w-2.5" /> From photo
                </span>
              )}
            </Label>
            <Input
              id="date"
              name="date"
              type="date"
              required
              defaultValue={exifDate || new Date().toISOString().split("T")[0]}
              data-testid="input-trophy-date"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1.5">
              Location
              {exifLocationSource === "photo" && locationLat != null && (
                <span className="text-[10px] text-primary font-normal flex items-center gap-0.5">
                  <Camera className="h-2.5 w-2.5" /> From photo
                </span>
              )}
            </Label>
            <LocationSearch
              value={locationName}
              latitude={locationLat}
              longitude={locationLng}
              onChange={(loc, lat, lng) => {
                setLocationName(loc);
                setLocationLat(lat);
                setLocationLng(lng);
                if (loc !== locationName) setExifLocationSource(null);
              }}
              placeholder="Search for a location..."
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 items-end">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Label htmlFor="scoreNum" className="text-xs">Score / Size</Label>
              <UnitToggle
                options={[
                  { label: "cm", value: "cm" },
                  { label: '"', value: '"' },
                  { label: "Score", value: "Score" },
                ]}
                value={scoreUnit}
                onChange={setScoreUnit}
                testId="toggle-score-unit"
              />
            </div>
            <Input
              id="scoreNum"
              name="scoreNum"
              placeholder={scoreUnit === "cm" ? "e.g. 132" : scoreUnit === '"' ? "e.g. 52" : "e.g. 100"}
              defaultValue={estimatedScore}
              data-testid="input-trophy-score"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Weapon</Label>
            <Select value={weaponId} onValueChange={setWeaponId}>
              <SelectTrigger data-testid="select-trophy-weapon">
                <SelectValue placeholder="Select weapon" />
              </SelectTrigger>
              <SelectContent>
                {weapons.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name} ({w.type}{w.caliber ? ` — ${w.caliber}` : ""})
                  </SelectItem>
                ))}
                <SelectItem value="__other__">Other / Not in Safe</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 items-end">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Label htmlFor="shotDistanceNum" className="text-xs">Shot Distance</Label>
              <UnitToggle
                options={[
                  { label: "m", value: "m" },
                  { label: "yards", value: "yards" },
                ]}
                value={distanceUnit}
                onChange={setDistanceUnit}
                testId="toggle-distance-unit"
              />
            </div>
            <Input
              id="shotDistanceNum"
              name="shotDistanceNum"
              type="number"
              min="0"
              placeholder={distanceUnit === "m" ? "e.g. 180" : "e.g. 200"}
              data-testid="input-shot-distance"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Method</Label>
            <Select value={methodValue} onValueChange={setMethodValue}>
              <SelectTrigger data-testid="select-trophy-method">
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                {HUNTING_METHODS.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" name="method" value={methodValue} />
          </div>
        </div>

        {analysis?.gender?.estimated && analysis.gender.estimated !== "unknown" && (
          <input type="hidden" name="gender" value={analysis.gender.estimated} />
        )}

        <div className="space-y-1.5">
          <Label htmlFor="notes" className="text-xs">Trophy Notes</Label>
          <Textarea
            id="notes"
            name="notes"
            rows={2}
            placeholder="Details about the trophy itself — horn quality, unique markings, condition..."
            defaultValue={analysis?.horn_details?.notable_features || ""}
            data-testid="input-trophy-notes"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Tagged Pro (Optional)</Label>
          <ProTagSearch
            value={taggedProUserId}
            onChange={(userId) => setTaggedProUserId(userId)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="huntNotes" className="text-xs">Hunt Notes</Label>
          <Textarea
            id="huntNotes"
            name="huntNotes"
            rows={2}
            placeholder="The hunt story — conditions, terrain, memorable moments..."
            data-testid="input-hunt-notes"
          />
        </div>

        <Button
          type="submit"
          className="w-full gap-2"
          disabled={isPending}
          data-testid="button-submit-trophy"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Adding...
            </>
          ) : (
            <>
              <Check className="h-4 w-4" /> Add to Vault
            </>
          )}
        </Button>
      </form>
    </motion.div>
  );
}
