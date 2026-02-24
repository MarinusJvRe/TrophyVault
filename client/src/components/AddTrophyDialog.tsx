import { useState, useRef, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
import { Camera, Upload, Sparkles, Check, AlertTriangle, ChevronRight, X, Eye, Crosshair, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrophyAnalysis {
  animal_detected: boolean;
  rejection_reason: string | null;
  species: {
    common_name: string;
    scientific_name: string;
    category: string;
    confidence: number;
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
    estimated_length_description: string | null;
    notable_features: string | null;
  };
  additional_animals: number;
  exif_hints: {
    location_visible: string | null;
    time_of_day: string | null;
  };
}

type Step = "upload" | "analyzing" | "results" | "form";

interface AddTrophyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddTrophyDialog({ open, onOpenChange }: AddTrophyDialogProps) {
  const [step, setStep] = useState<Step>("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<TrophyAnalysis | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [method, setMethod] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const resetState = useCallback(() => {
    setStep("upload");
    setSelectedFile(null);
    setPreviewUrl(null);
    setAnalysis(null);
    setUploadedImageUrl(null);
    setMethod("");
  }, []);

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
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Analysis failed" }));
        throw new Error(err.message);
      }
      return res.json() as Promise<{ imageUrl: string; analysis: TrophyAnalysis }>;
    },
    onSuccess: (data) => {
      setAnalysis(data.analysis);
      setUploadedImageUrl(data.imageUrl);
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
      });
      if (!res.ok) throw new Error("Upload failed");
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

  const startAnalysis = () => {
    if (!selectedFile) return;
    setStep("analyzing");
    analyzeMutation.mutate(selectedFile);
  };

  const skipAnalysis = () => {
    if (!selectedFile) return;
    uploadOnlyMutation.mutate(selectedFile);
  };

  const handleCreateTrophy = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createTrophyMutation.mutate({
      species: formData.get("species") as string,
      name: formData.get("name") as string,
      date: formData.get("date") as string,
      location: formData.get("location") as string,
      score: formData.get("score") as string || null,
      method: method,
      notes: formData.get("notes") as string || null,
      imageUrl: uploadedImageUrl,
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
              previewUrl={previewUrl}
              selectedFile={selectedFile}
              onFileInput={handleFileInput}
              onDrop={handleDrop}
              fileInputRef={fileInputRef}
              onAnalyze={startAnalysis}
              onSkip={skipAnalysis}
              onRemoveFile={() => { setSelectedFile(null); setPreviewUrl(null); }}
              isUploading={uploadOnlyMutation.isPending}
            />
          )}
          {step === "analyzing" && (
            <AnalyzingStep key="analyzing" previewUrl={previewUrl} />
          )}
          {step === "results" && analysis && (
            <ResultsStep
              key="results"
              analysis={analysis}
              previewUrl={previewUrl}
              onContinue={() => setStep("form")}
              onRetake={() => { resetState(); }}
            />
          )}
          {step === "form" && (
            <FormStep
              key="form"
              analysis={analysis}
              previewUrl={previewUrl}
              method={method}
              setMethod={setMethod}
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
  onFileInput,
  onDrop,
  fileInputRef,
  onAnalyze,
  onSkip,
  onRemoveFile,
  isUploading,
}: {
  previewUrl: string | null;
  selectedFile: File | null;
  onFileInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDrop: (e: React.DragEvent) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onAnalyze: () => void;
  onSkip: () => void;
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
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onFileInput}
        className="hidden"
        data-testid="input-trophy-file"
      />

      {!selectedFile ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border/60 rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group"
          data-testid="dropzone-trophy-image"
        >
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
            <Upload className="h-7 w-7 text-primary" />
          </div>
          <h3 className="font-serif font-bold text-foreground mb-1">Upload Trophy Photo</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Take a photo or select from your gallery
          </p>
          <div className="flex gap-2 justify-center">
            <Button size="sm" variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20" data-testid="button-browse-files">
              <Camera className="h-4 w-4 mr-1" /> Browse Files
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
        <img
          src={previewUrl!}
          alt="Analyzing..."
          className="w-full max-h-[250px] object-contain bg-black/5"
        />
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
  onContinue,
  onRetake,
}: {
  analysis: TrophyAnalysis;
  previewUrl: string | null;
  onContinue: () => void;
  onRetake: () => void;
}) {
  const confidence = Math.round(analysis.species.confidence * 100);
  const qualityScore = analysis.photo_quality.score;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="p-6"
    >
      <DialogHeader className="mb-4">
        <DialogTitle className="font-serif text-xl flex items-center gap-2">
          <Check className="h-5 w-5 text-green-500" />
          Analysis Complete
        </DialogTitle>
      </DialogHeader>

      <div className="flex gap-4 mb-4">
        <div className="w-24 h-24 rounded-lg overflow-hidden border border-border/40 shrink-0">
          <img src={previewUrl!} alt="Trophy" className="w-full h-full object-cover" />
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
          <div className="flex items-center gap-1 text-xs">
            <span className="text-muted-foreground">Category:</span>
            <span className="capitalize text-foreground">{analysis.species.category}</span>
          </div>
        </div>
      </div>

      {!analysis.animal_detected && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-destructive">No Animal Detected</p>
              <p className="text-muted-foreground text-xs mt-0.5">{analysis.rejection_reason || "Try uploading a clearer photo of the trophy."}</p>
            </div>
          </div>
        </div>
      )}

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
          {analysis.photo_quality.suggestion && (
            <p className="text-xs text-muted-foreground mt-1">{analysis.photo_quality.suggestion}</p>
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
          <div className="text-xs text-muted-foreground mb-1">Horn Details</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            {analysis.horn_details.horn_type && (
              <>
                <span className="text-muted-foreground">Type:</span>
                <span className="text-foreground capitalize">{analysis.horn_details.horn_type}</span>
              </>
            )}
            {analysis.horn_details.estimated_length_description && (
              <>
                <span className="text-muted-foreground">Length:</span>
                <span className="text-foreground">{analysis.horn_details.estimated_length_description}</span>
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
  method,
  setMethod,
  onSubmit,
  isPending,
}: {
  analysis: TrophyAnalysis | null;
  previewUrl: string | null;
  method: string;
  setMethod: (v: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isPending: boolean;
}) {
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
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{analysis.species.common_name}</p>
              <p className="text-xs text-muted-foreground italic">{analysis.species.scientific_name}</p>
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
              defaultValue={analysis ? `${analysis.species.common_name} Trophy` : ""}
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
            <Label htmlFor="location" className="text-xs">Location *</Label>
            <Input
              id="location"
              name="location"
              required
              defaultValue={analysis?.exif_hints.location_visible || ""}
              placeholder="e.g., Limpopo, South Africa"
              data-testid="input-trophy-location"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="score" className="text-xs">Score</Label>
            <Input
              id="score"
              name="score"
              placeholder="e.g., 52 3/8 SCI"
              data-testid="input-trophy-score"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Method *</Label>
            <Select value={method} onValueChange={setMethod} required>
              <SelectTrigger data-testid="select-trophy-method">
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Rifle">Rifle</SelectItem>
                <SelectItem value="Bow">Bow</SelectItem>
                <SelectItem value="Muzzleloader">Muzzleloader</SelectItem>
                <SelectItem value="Shotgun">Shotgun</SelectItem>
                <SelectItem value="Handgun">Handgun</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notes" className="text-xs">Notes</Label>
          <Input
            id="notes"
            name="notes"
            placeholder="Hunt story, conditions, memorable details..."
            defaultValue={analysis?.horn_details.notable_features || ""}
            data-testid="input-trophy-notes"
          />
        </div>

        <Button
          type="submit"
          className="w-full gap-2"
          disabled={isPending || !method}
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
