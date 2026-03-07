import { useState, useRef, useCallback } from "react";
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
import { Camera, Upload, Sparkles, Check, AlertTriangle, ChevronRight, X, Eye, Crosshair, Loader2, Crop, Trophy, Shield, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactCrop, { type Crop as CropType, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import type { Weapon } from "@shared/schema";

interface TrophyAnalysis {
  animal_detected: boolean;
  rejection_reason: string | null;
  species: {
    common_name: string;
    scientific_name: string;
    category: string;
    confidence: number;
  };
  gender: {
    estimated: "male" | "female" | "unknown";
    confidence: number;
    indicators: string;
  };
  photo_quality: {
    score: number;
    issues: string[];
    suitable_for_3d: boolean;
    suggestion: string | null;
  };
  animal_pose: string;
  visibility: {
    head_visible: boolean;
    horns_visible: boolean;
    body_visible: boolean;
    occlusion_percent: number;
    occluded_by: string | null;
  };
  mount_recommendation: {
    best: string;
    viable: string[];
    reason: string;
  };
  horn_details: {
    has_horns: boolean;
    horn_type: string | null;
    estimated_length_inches: number | null;
    estimated_length_cm: number | null;
    length_range_low: number | null;
    length_range_high: number | null;
    notable_features: string | null;
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
  render_prompt: string;
  additional_animals: number;
  exif_hints: {
    location_visible: string | null;
    time_of_day: string | null;
  };
}

type Step = "upload" | "crop" | "analyzing" | "results" | "form";

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

function getEstimatedScore(analysis: TrophyAnalysis | null, units: string): string {
  if (!analysis?.horn_details?.has_horns) return "";
  const low = analysis.horn_details.length_range_low;
  const high = analysis.horn_details.length_range_high;
  if (low != null && high != null) {
    const mid = Math.round(((low + high) / 2) * 10) / 10;
    const abbr = units === "metric" ? "cm" : "\"";
    return `${mid}${abbr}`;
  }
  if (analysis.trophy_qualification?.estimated_score) {
    return analysis.trophy_qualification.estimated_score;
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

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cropImageRef = useRef<HTMLImageElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: weapons = [] } = useQuery<Weapon[]>({
    queryKey: ["/api/weapons"],
    enabled: open,
  });

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
    setAnalysisUnits("imperial");
  }, [previewUrl, croppedPreviewUrl]);

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
      setStep("results");
    },
    onError: (error: Error) => {
      toast({ title: "Analysis failed", description: error.message, variant: "destructive" });
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
      toast({ title: "Trophy added", description: "Your trophy has been added to the vault." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setCroppedPreviewUrl(null);
    setCroppedFile(null);
    setCrop(undefined);
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
    createTrophyMutation.mutate({
      species: formData.get("species") as string,
      name: formData.get("name") as string,
      date: formData.get("date") as string,
      location: (formData.get("location") as string) || null,
      score: (formData.get("score") as string) || null,
      method: (formData.get("method") as string) || (selectedWeapon ? selectedWeapon.type : (weaponId === "__other__" ? "Other" : null)),
      weaponId: weaponId && weaponId !== "__other__" ? weaponId : null,
      gender: analysis?.gender?.estimated || (formData.get("gender") as string) || null,
      shotDistance: (formData.get("shotDistance") as string) || null,
      notes: (formData.get("notes") as string) || null,
      huntNotes: (formData.get("huntNotes") as string) || null,
      imageUrl: uploadedImageUrl,
      renderImageUrl: renderImageUrl,
      featured: false,
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
              onRemoveFile={() => { setSelectedFile(null); setPreviewUrl(null); setCroppedFile(null); setCroppedPreviewUrl(null); }}
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
          {step === "results" && analysis && (
            <ResultsStep
              key="results"
              analysis={analysis}
              previewUrl={getPreviewToShow()}
              units={analysisUnits}
              onContinue={() => setStep("form")}
              onRetake={resetState}
            />
          )}
          {step === "form" && (
            <FormStep
              key="form"
              analysis={analysis}
              previewUrl={getPreviewToShow()}
              weaponId={weaponId}
              setWeaponId={setWeaponId}
              weapons={weapons}
              units={analysisUnits}
              onSubmit={handleCreateTrophy}
              isPending={createTrophyMutation.isPending}
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
                  Our AI will identify the species, assess photo quality, recommend mount types, and pre-fill your trophy details.
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

      <div className="relative rounded-xl overflow-hidden mb-6 border border-border/40">
        {previewUrl && (
          <img
            src={previewUrl}
            alt="Analyzing..."
            className="w-full max-h-[250px] object-contain bg-black/5"
          />
        )}
        <div className="absolute inset-0 bg-background/40 backdrop-blur-[2px] flex items-center justify-center">
          <div className="text-center">
            <div className="relative mx-auto mb-3">
              <div className="h-12 w-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            </div>
            <p className="text-sm font-medium text-foreground">Identifying species...</p>
            <p className="text-xs text-muted-foreground mt-1">Assessing photo quality and mount options</p>
          </div>
        </div>
      </div>

      <div className="flex gap-3 justify-center text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> Species ID</span>
        <span className="flex items-center gap-1"><Crosshair className="h-3 w-3" /> Quality Check</span>
        <span className="flex items-center gap-1"><Sparkles className="h-3 w-3" /> Mount Analysis</span>
      </div>
    </motion.div>
  );
}

function ResultsStep({
  analysis,
  previewUrl,
  units,
  onContinue,
  onRetake,
}: {
  analysis: TrophyAnalysis;
  previewUrl: string | null;
  units: string;
  onContinue: () => void;
  onRetake: () => void;
}) {
  const confidence = Math.round(analysis.species.confidence * 100);
  const qualityScore = analysis.photo_quality.score;
  const unitAbbr = units === "metric" ? "cm" : "\"";
  const tq = analysis.trophy_qualification;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="p-6"
    >
      <DialogHeader className="mb-4">
        <DialogTitle className="font-serif text-xl flex items-center gap-2">
          {analysis.animal_detected ? (
            <Check className="h-5 w-5 text-green-500" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
          )}
          Analysis Complete
        </DialogTitle>
      </DialogHeader>

      {!analysis.animal_detected && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-yellow-500">No Animal Detected</p>
              <p className="text-muted-foreground text-xs mt-0.5">
                {analysis.rejection_reason || "Try uploading a clearer photo with the animal more visible. You can still continue with manual entry."}
              </p>
            </div>
          </div>
        </div>
      )}

      {analysis.additional_animals > 0 && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-4">
          <div className="flex items-start gap-2">
            <Eye className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-blue-500">Multiple Animals Detected</p>
              <p className="text-muted-foreground text-xs mt-0.5">
                {analysis.additional_animals + 1} animals detected. Showing results for the most prominent one: {analysis.species.common_name}. Consider cropping to focus on a single animal.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-4 mb-4">
        <div className="w-24 h-24 rounded-lg overflow-hidden border border-border/40 shrink-0">
          {previewUrl && <img src={previewUrl} alt="Trophy" className="w-full h-full object-cover" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-serif font-bold text-lg text-foreground truncate">
              {analysis.species.common_name}
            </h3>
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full font-medium shrink-0",
              confidence >= 80 ? "bg-green-500/10 text-green-500" :
              confidence >= 50 ? "bg-yellow-500/10 text-yellow-500" :
              "bg-red-500/10 text-red-500"
            )}>
              {confidence}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground italic mb-2">{analysis.species.scientific_name}</p>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-muted-foreground">Category: <span className="capitalize text-foreground">{analysis.species.category}</span></span>
            {analysis.gender && (
              <span className="text-muted-foreground">Gender: <span className="capitalize text-foreground">{analysis.gender.estimated}</span></span>
            )}
          </div>
          {analysis.gender?.indicators && (
            <p className="text-xs text-muted-foreground mt-1 italic">{analysis.gender.indicators}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-card border border-border/40 rounded-lg p-3">
          <div className="text-xs text-muted-foreground mb-1">Photo Quality</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-border/30 rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", qualityScore >= 7 ? "bg-green-500" : qualityScore >= 4 ? "bg-yellow-500" : "bg-red-500")}
                style={{ width: `${qualityScore * 10}%` }}
              />
            </div>
            <span className="text-sm font-bold text-foreground">{qualityScore}/10</span>
          </div>
          {analysis.photo_quality.issues.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">{analysis.photo_quality.issues.join(", ")}</p>
          )}
          {analysis.photo_quality.suggestion && (
            <p className="text-xs text-primary mt-1">{analysis.photo_quality.suggestion}</p>
          )}
        </div>

        <div className="bg-card border border-border/40 rounded-lg p-3">
          <div className="text-xs text-muted-foreground mb-1">Recommended Mount</div>
          <div className="text-sm font-bold text-foreground capitalize">{analysis.mount_recommendation.best}</div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{analysis.mount_recommendation.reason}</p>
        </div>
      </div>

      {analysis.horn_details.has_horns && (
        <div className="bg-card border border-border/40 rounded-lg p-3 mb-4">
          <div className="text-xs text-muted-foreground mb-1">Horn / Antler Details</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            {analysis.horn_details.horn_type && (
              <>
                <span className="text-muted-foreground">Type:</span>
                <span className="text-foreground capitalize">{analysis.horn_details.horn_type}</span>
              </>
            )}
            {analysis.horn_details.length_range_low != null && analysis.horn_details.length_range_high != null && (
              <>
                <span className="text-muted-foreground">Est. Length:</span>
                <span className="text-foreground">
                  {analysis.horn_details.length_range_low}{unitAbbr} – {analysis.horn_details.length_range_high}{unitAbbr}
                </span>
              </>
            )}
            {analysis.horn_details.notable_features && (
              <>
                <span className="text-muted-foreground">Features:</span>
                <span className="text-foreground">{analysis.horn_details.notable_features}</span>
              </>
            )}
          </div>
        </div>
      )}

      {tq && (
        <div className={cn(
          "border rounded-lg p-3 mb-4",
          tq.likely_qualifies === true ? "bg-green-500/5 border-green-500/30" :
          tq.likely_qualifies === false ? "bg-yellow-500/5 border-yellow-500/30" :
          "bg-card border-border/40"
        )}>
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-foreground">Trophy Qualification — {tq.scoring_system}</span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            {tq.minimum_qualifying_score && (
              <>
                <span className="text-muted-foreground">Minimum Score:</span>
                <span className="text-foreground">{tq.minimum_qualifying_score}</span>
              </>
            )}
            {tq.estimated_score && (
              <>
                <span className="text-muted-foreground">Estimated Score:</span>
                <span className="text-foreground font-medium">{tq.estimated_score}</span>
              </>
            )}
            <span className="text-muted-foreground">Likely Qualifies:</span>
            <span className={cn(
              "font-medium",
              tq.likely_qualifies === true ? "text-green-500" :
              tq.likely_qualifies === false ? "text-yellow-500" :
              "text-muted-foreground"
            )}>
              {tq.likely_qualifies === true ? "Yes" : tq.likely_qualifies === false ? "Unlikely" : "Unknown"}
              {tq.confidence > 0 && ` (${Math.round(tq.confidence * 100)}% confidence)`}
            </span>
          </div>
          {tq.notes && (
            <p className="text-xs text-muted-foreground mt-2 italic">{tq.notes}</p>
          )}
        </div>
      )}

      <div className="bg-card border border-border/40 rounded-lg p-3 mb-4">
        <div className="text-xs text-muted-foreground mb-2">Visibility Assessment</div>
        <div className="flex gap-3 text-xs">
          <VisibilityBadge label="Head" visible={analysis.visibility.head_visible} />
          <VisibilityBadge label="Horns" visible={analysis.visibility.horns_visible} />
          <VisibilityBadge label="Body" visible={analysis.visibility.body_visible} />
        </div>
        {analysis.visibility.occluded_by && (
          <p className="text-xs text-muted-foreground mt-2">Partially occluded by: {analysis.visibility.occluded_by}</p>
        )}
      </div>

      <div className="flex gap-2">
        <Button onClick={onContinue} className="flex-1 gap-2" data-testid="button-continue-to-form">
          Continue <ChevronRight className="h-4 w-4" />
        </Button>
        <Button onClick={onRetake} variant="outline" data-testid="button-retake-photo">
          Retake
        </Button>
      </div>
    </motion.div>
  );
}

function VisibilityBadge({ label, visible }: { label: string; visible: boolean }) {
  return (
    <span className={cn(
      "flex items-center gap-1 px-2 py-1 rounded-full",
      visible ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"
    )}>
      {visible ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
      {label}
    </span>
  );
}

function FormStep({
  analysis,
  previewUrl,
  weaponId,
  setWeaponId,
  weapons,
  units,
  onSubmit,
  isPending,
}: {
  analysis: TrophyAnalysis | null;
  previewUrl: string | null;
  weaponId: string;
  setWeaponId: (v: string) => void;
  weapons: Weapon[];
  units: string;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isPending: boolean;
}) {
  const estimatedScore = getEstimatedScore(analysis, units);

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

      {previewUrl && (
        <div className="flex items-center gap-3 mb-4 p-2 bg-card border border-border/40 rounded-lg">
          <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0">
            <img src={previewUrl} alt="Trophy" className="w-full h-full object-cover" />
          </div>
          {analysis && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">{analysis.species.common_name}</p>
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground italic">{analysis.species.scientific_name}</p>
                {analysis.gender?.estimated && analysis.gender.estimated !== "unknown" && (
                  <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded capitalize">
                    {analysis.gender.estimated}
                  </span>
                )}
              </div>
            </div>
          )}
          {analysis && (
            <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full shrink-0">
              AI Filled
            </span>
          )}
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
            <Label htmlFor="date" className="text-xs">Date *</Label>
            <Input
              id="date"
              name="date"
              type="date"
              required
              defaultValue={new Date().toISOString().split("T")[0]}
              data-testid="input-trophy-date"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="location" className="text-xs">Location</Label>
            <Input
              id="location"
              name="location"
              defaultValue={analysis?.exif_hints.location_visible || ""}
              placeholder="e.g., Limpopo, South Africa"
              data-testid="input-trophy-location"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="score" className="text-xs">Score / Size</Label>
            <Input
              id="score"
              name="score"
              placeholder={units === "metric" ? "e.g., 132 cm" : "e.g., 52 3/8\""}
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

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="shotDistance" className="text-xs">Shot Distance</Label>
            <Input
              id="shotDistance"
              name="shotDistance"
              placeholder={units === "metric" ? "e.g. 180m" : "e.g. 200 yards"}
              data-testid="input-shot-distance"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="method" className="text-xs">Method</Label>
            <Input
              id="method"
              name="method"
              placeholder="e.g. Walk & Stalk"
              data-testid="input-trophy-method"
            />
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
            defaultValue={analysis?.horn_details.notable_features || ""}
            data-testid="input-trophy-notes"
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
