import Layout from "@/components/Layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { 
  ArrowLeft, Share2, Target, MapPin, 
  Calendar, BadgeCheck, Camera, MessageCircle, Crosshair, Sword, Trash2, Pencil, AlertTriangle, Check, Loader2, X, Star, Box
} from "lucide-react";
import { LocationMap } from "@/components/LocationMap";
import { LocationSearch } from "@/components/LocationSearch";
import { generateTrophyCertificate } from "@/components/TrophyCertificate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { Trophy, Weapon } from "@shared/schema";
import { findClosestSpecies } from "@shared/scoring-thresholds";
import { HUNTING_METHODS } from "@/components/AddTrophyDialog";
import TrophyARViewer from "@/components/TrophyARViewer";
import { useTheme } from "@/lib/theme-context";

function parseStoredDistance(value: string | null): { num: string; unit: string } {
  if (!value) return { num: "", unit: "yards" };
  const v = value.trim();
  const mMatch = v.match(/^([\d.]+)\s*(?:m|meters?|metres?)$/i);
  if (mMatch) return { num: mMatch[1], unit: "m" };
  const ydMatch = v.match(/^([\d.]+)\s*(?:yards?|yds?)$/i);
  if (ydMatch) return { num: ydMatch[1], unit: "yards" };
  const numOnly = v.match(/^[\d.]+$/);
  if (numOnly) return { num: v, unit: "yards" };
  return { num: v, unit: "yards" };
}

function parseStoredScore(value: string | null): { num: string; unit: string } {
  if (!value) return { num: "", unit: '"' };
  const v = value.trim();
  const cmMatch = v.match(/^([\d.\/ ]+)\s*(?:cm|centimeters?)$/i);
  if (cmMatch) return { num: cmMatch[1].trim(), unit: "cm" };
  const sciMatch = v.match(/^([\d.\/ ]+)\s*(?:SCI|B&C|RW|Score)$/i);
  if (sciMatch) return { num: sciMatch[1].trim(), unit: "Score" };
  const inMatch = v.match(/^([\d.\/ ]+)\s*(?:["″]|in(?:ch(?:es)?)?)?$/i);
  if (inMatch) return { num: inMatch[1].trim(), unit: '"' };
  return { num: v, unit: '"' };
}

export default function TrophyDetail() {
  const [match, params] = useRoute("/trophies/:id");
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showAR, setShowAR] = useState(false);
  const { theme } = useTheme();
  const [editWeaponId, setEditWeaponId] = useState<string>("");
  const [editLocation, setEditLocation] = useState<string>("");
  const [editLat, setEditLat] = useState<number | null>(null);
  const [editLng, setEditLng] = useState<number | null>(null);
  const [editMethod, setEditMethod] = useState<string>("");
  const [editDistanceUnit, setEditDistanceUnit] = useState<string>("yards");
  const [editDistanceNum, setEditDistanceNum] = useState<string>("");
  const [editScoreUnit, setEditScoreUnit] = useState<string>('"');
  const [editScoreNum, setEditScoreNum] = useState<string>("");
  
  const { data: trophy, isLoading } = useQuery<Trophy>({
    queryKey: ["/api/trophies", params?.id],
    enabled: !!match && !!params?.id,
  });

  const { data: weapons = [] } = useQuery<Weapon[]>({
    queryKey: ["/api/weapons"],
    enabled: !!match,
  });

  const weapon = trophy?.weaponId ? weapons.find(w => w.id === trophy.weaponId) : null;

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/trophies/${params?.id}`);
    },
    onSuccess: () => {
      setDeleteDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/trophies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Trophy deleted", description: "Your trophy has been removed from your trophy room." });
      navigate("/trophies");
    },
    onError: (error: Error) => {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      await apiRequest("PATCH", `/api/trophies/${params?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trophies", params?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/trophies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Trophy updated", description: "Your changes have been saved." });
      setEditing(false);
    },
    onError: (error: Error) => {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    },
  });

  const starMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/trophies/${params?.id}/star`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trophies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trophies", params?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: trophy?.featured ? "Trophy unstarred" : "Trophy starred",
        description: trophy?.featured ? "Removed from featured." : "This trophy is now featured on your dashboard.",
      });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update", description: error.message, variant: "destructive" });
    },
  });

  const handleStartEdit = () => {
    setEditWeaponId(trophy?.weaponId || "");
    setEditLocation(trophy?.location || "");
    setEditLat(trophy?.latitude || null);
    setEditLng(trophy?.longitude || null);
    setEditMethod(trophy?.method || "");
    const parsedDist = parseStoredDistance(trophy?.shotDistance || null);
    setEditDistanceNum(parsedDist.num);
    setEditDistanceUnit(parsedDist.unit);
    const parsedScore = parseStoredScore(trophy?.score || null);
    setEditScoreNum(parsedScore.num);
    setEditScoreUnit(parsedScore.unit);
    setEditing(true);
  };

  const handleCancelEdit = () => {
    setEditing(false);
  };

  const handleSaveEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const selectedWeapon = weapons.find(w => w.id === editWeaponId);

    const distNum = editDistanceNum.trim();
    const shotDistVal = distNum ? `${distNum} ${editDistanceUnit}` : null;

    const sNum = editScoreNum.trim();
    let scoreVal: string | null = null;
    if (sNum) {
      if (editScoreUnit === "cm") scoreVal = `${sNum} cm`;
      else if (editScoreUnit === '"') scoreVal = `${sNum}"`;
      else scoreVal = `${sNum} Score`;
    }

    const method = editMethod && editMethod !== "__none__" ? editMethod : null;

    updateMutation.mutate({
      species: formData.get("species") as string,
      name: formData.get("name") as string,
      date: formData.get("date") as string,
      location: editLocation || null,
      latitude: editLat,
      longitude: editLng,
      score: scoreVal,
      method: method || (selectedWeapon ? selectedWeapon.type : null),
      weaponId: editWeaponId && editWeaponId !== "__other__" ? editWeaponId : null,
      gender: (formData.get("gender") as string) || null,
      shotDistance: shotDistVal,
      notes: (formData.get("notes") as string) || null,
      huntNotes: (formData.get("huntNotes") as string) || null,
    });
  };

  if (!match) return <div>Not found</div>;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!trophy) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Trophy not found</p>
        </div>
      </Layout>
    );
  }

  const handleShare = () => {
    const text = `Check out my ${trophy.species} trophy on Honor The Hunt! Score: ${trophy.score}.`;
    const url = `https://trophyvault.app/t/${trophy.id}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`;
    window.open(whatsappUrl, '_blank');
    toast({
      title: "Opening WhatsApp",
      description: "Preparing your trophy snapshot for sharing...",
    });
  };

  return (
    <Layout>
      <div className="h-full overflow-y-auto">
        <div className="max-w-2xl mx-auto pb-12">
          <div className="relative">
            <div className="sticky top-0 z-30 flex items-center justify-between p-4 bg-background/80 backdrop-blur-md border-b border-border/30">
              {editing ? (
                <Button variant="ghost" size="sm" className="gap-2 text-foreground hover:bg-card" onClick={handleCancelEdit} data-testid="button-cancel-edit">
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              ) : (
                <Link href="/trophies">
                  <Button variant="ghost" size="sm" className="gap-2 text-foreground hover:bg-card" data-testid="button-back">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Vault
                  </Button>
                </Link>
              )}
              <div className="flex gap-1">
                {editing ? (
                  <span className="text-xs text-primary font-medium flex items-center gap-1">
                    <Pencil className="h-3 w-3" /> Editing
                  </span>
                ) : (
                  <>
                    <Button
                      onClick={() => starMutation.mutate()}
                      variant="ghost"
                      size="icon"
                      className={trophy?.featured ? "text-primary hover:text-primary/80 hover:bg-primary/10" : "text-muted-foreground hover:text-primary hover:bg-primary/10"}
                      disabled={starMutation.isPending}
                      data-testid="button-star"
                    >
                      <Star className={`h-4 w-4 ${trophy?.featured ? "fill-primary" : ""}`} />
                    </Button>
                    <Button onClick={handleShare} variant="ghost" size="icon" className="text-muted-foreground hover:text-green-500 hover:bg-green-500/10" data-testid="button-share">
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button onClick={handleStartEdit} variant="ghost" size="icon" className="text-muted-foreground hover:text-primary hover:bg-primary/10" data-testid="button-edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button onClick={() => setDeleteDialogOpen(true)} variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10" data-testid="button-delete">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="px-4 pt-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="relative rounded-xl overflow-hidden bg-black/20 border border-border/30"
              >
                {trophy.imageUrl ? (
                  <img 
                    src={trophy.imageUrl} 
                    alt={trophy.species}
                    className="w-full max-h-[50vh] object-contain bg-black/10"
                    data-testid="img-trophy-photo"
                  />
                ) : (
                  <div className="w-full h-64 flex items-center justify-center bg-secondary/10">
                    <Camera className="h-16 w-16 text-muted-foreground/30" />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <Badge variant="outline" className="bg-primary/20 text-primary border-primary/40 backdrop-blur-md text-xs">
                    <Camera className="w-3 h-3 mr-1" />
                    AI ANALYZED
                  </Badge>
                </div>
              </motion.div>
            </div>

            {editing ? (
              <EditForm
                trophy={trophy}
                weapons={weapons}
                editWeaponId={editWeaponId}
                setEditWeaponId={setEditWeaponId}
                editLocation={editLocation}
                editLat={editLat}
                editLng={editLng}
                onLocationChange={(loc, lat, lng) => {
                  setEditLocation(loc);
                  setEditLat(lat);
                  setEditLng(lng);
                }}
                onSubmit={handleSaveEdit}
                onCancel={handleCancelEdit}
                isPending={updateMutation.isPending}
                editMethod={editMethod}
                setEditMethod={setEditMethod}
                editDistanceUnit={editDistanceUnit}
                setEditDistanceUnit={setEditDistanceUnit}
                editDistanceNum={editDistanceNum}
                setEditDistanceNum={setEditDistanceNum}
                editScoreUnit={editScoreUnit}
                setEditScoreUnit={setEditScoreUnit}
                editScoreNum={editScoreNum}
                setEditScoreNum={setEditScoreNum}
              />
            ) : (
              <ViewMode
                trophy={trophy}
                weapon={weapon}
                onShare={handleShare}
                onCertificate={() => generateTrophyCertificate(trophy, weapon)}
                onViewAR={() => setShowAR(true)}
              />
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Trophy
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete your <strong>{trophy.species}</strong> trophy "{trophy.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Deleting..." : "Yes, Delete Trophy"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showAR && trophy?.glbUrl && (
        <TrophyARViewer
          glbUrl={trophy.glbUrl}
          species={trophy.species}
          mountType={trophy.mountType || null}
          theme={theme}
          onClose={() => setShowAR(false)}
        />
      )}
    </Layout>
  );
}

function ViewMode({
  trophy,
  weapon,
  onShare,
  onCertificate,
  onViewAR,
}: {
  trophy: Trophy;
  weapon: Weapon | null | undefined;
  onShare: () => void;
  onCertificate: () => void;
  onViewAR: () => void;
}) {
  const speciesThresholds = findClosestSpecies(trophy.species);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="px-4 pt-6 space-y-6"
    >
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-primary tracking-widest uppercase">{trophy.species}</span>
          {trophy.gender && (
            <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded capitalize">{trophy.gender}</span>
          )}
        </div>
        <h1 className="text-3xl font-serif font-bold text-foreground" data-testid="text-trophy-name">{trophy.name}</h1>
      </div>

      <div className="flex flex-wrap gap-3">
        {trophy.score && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border/50 text-sm">
            <TrophyIcon className="h-4 w-4 text-primary" />
            <span className="font-semibold" data-testid="text-trophy-score">{trophy.score}</span>
          </div>
        )}
        {trophy.method && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border/50 text-sm">
            <Target className="h-4 w-4 text-muted-foreground" />
            <span>{trophy.method}</span>
          </div>
        )}
        {trophy.shotDistance && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border/50 text-sm">
            <Crosshair className="h-4 w-4 text-muted-foreground" />
            <span>{trophy.shotDistance}</span>
          </div>
        )}
        {weapon && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border/50 text-sm">
            <Sword className="h-4 w-4 text-muted-foreground" />
            <span>{weapon.name}{weapon.caliber ? ` (${weapon.caliber})` : ""}</span>
          </div>
        )}
      </div>

      <Separator className="bg-border/50" />

      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">Hunt Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <Calendar className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">{trophy.date}</div>
              <div className="text-xs text-muted-foreground">Date Taken</div>
            </div>
          </div>
          {trophy.location && (
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <div className="text-sm font-medium text-foreground">{trophy.location}</div>
                <div className="text-xs text-muted-foreground">Location</div>
              </div>
            </div>
          )}
        </div>
        {trophy.latitude != null && trophy.longitude != null && (
          <LocationMap
            latitude={trophy.latitude}
            longitude={trophy.longitude}
            locationName={trophy.location || undefined}
            height="160px"
            className="mt-3"
          />
        )}
      </div>

      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">AI Analysis</h3>
        <div className="p-4 rounded-lg bg-card border border-border/50 space-y-3">
          {trophy.score && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Honor The Hunt Score</span>
              <span className="font-mono text-primary font-semibold" data-testid="text-tv-score">
                {trophy.score}
              </span>
            </div>
          )}
          
          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-primary/5 p-2 rounded">
            <BadgeCheck className="h-4 w-4 text-primary shrink-0" />
            <span>Verified by Honor The Hunt AI algorithm against scoring database standards.</span>
          </div>
        </div>
      </div>

      {speciesThresholds && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">Scoring Thresholds — {speciesThresholds.species}</h3>
          <div className="grid grid-cols-3 gap-3" data-testid="scoring-thresholds-detail">
            <div className="p-3 rounded-lg bg-card border border-border/50 text-center">
              <div className="text-xs text-muted-foreground mb-1">SCI</div>
              <div className="text-sm font-semibold text-foreground" data-testid="text-detail-threshold-sci">{speciesThresholds.sci || "—"}</div>
            </div>
            <div className="p-3 rounded-lg bg-card border border-border/50 text-center">
              <div className="text-xs text-muted-foreground mb-1">Rowland Ward</div>
              <div className="text-sm font-semibold text-foreground" data-testid="text-detail-threshold-rw">{speciesThresholds.rowlandWard || "—"}</div>
            </div>
            <div className="p-3 rounded-lg bg-card border border-border/50 text-center">
              <div className="text-xs text-muted-foreground mb-1">B&C</div>
              <div className="text-sm font-semibold text-foreground" data-testid="text-detail-threshold-bc">{speciesThresholds.booneAndCrockett || "—"}</div>
            </div>
          </div>
        </div>
      )}

      {trophy.notes && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">Trophy Notes</h3>
          <p className="text-sm leading-relaxed text-muted-foreground italic border-l-2 border-primary/30 pl-4 py-1">
            "{trophy.notes}"
          </p>
        </div>
      )}

      {trophy.huntNotes && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">Hunt Notes</h3>
          <p className="text-sm leading-relaxed text-muted-foreground italic border-l-2 border-primary/30 pl-4 py-1">
            "{trophy.huntNotes}"
          </p>
        </div>
      )}

      <div className="pt-4 border-t border-border/50 space-y-3">
        <Button onClick={onShare} className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white flex items-center gap-2 font-medium" data-testid="button-share-whatsapp">
          <MessageCircle className="h-4 w-4" /> Share on WhatsApp
        </Button>
        <Button onClick={onCertificate} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-serif" data-testid="button-certificate">
          Generate Certificate
        </Button>
        {trophy.glbUrl && (
          <Button onClick={onViewAR} className="w-full bg-[#b87333] hover:bg-[#a0622a] text-white flex items-center gap-2 font-serif" data-testid="button-view-ar-detail">
            <Box className="h-4 w-4" /> View in 3D / AR
          </Button>
        )}
      </div>
    </motion.div>
  );
}

function EditUnitToggle({ options, value, onChange, testId }: {
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
          className={`px-2 py-1 text-xs font-medium transition-colors ${
            value === opt.value
              ? "bg-primary text-primary-foreground"
              : "bg-card text-muted-foreground hover:bg-muted"
          }`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function EditForm({
  trophy,
  weapons,
  editWeaponId,
  setEditWeaponId,
  editLocation,
  editLat,
  editLng,
  onLocationChange,
  onSubmit,
  onCancel,
  isPending,
  editMethod,
  setEditMethod,
  editDistanceUnit,
  setEditDistanceUnit,
  editDistanceNum,
  setEditDistanceNum,
  editScoreUnit,
  setEditScoreUnit,
  editScoreNum,
  setEditScoreNum,
}: {
  trophy: Trophy;
  weapons: Weapon[];
  editWeaponId: string;
  setEditWeaponId: (v: string) => void;
  editLocation: string;
  editLat: number | null;
  editLng: number | null;
  onLocationChange: (loc: string, lat: number | null, lng: number | null) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  isPending: boolean;
  editMethod: string;
  setEditMethod: (v: string) => void;
  editDistanceUnit: string;
  setEditDistanceUnit: (v: string) => void;
  editDistanceNum: string;
  setEditDistanceNum: (v: string) => void;
  editScoreUnit: string;
  setEditScoreUnit: (v: string) => void;
  editScoreNum: string;
  setEditScoreNum: (v: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-4 pt-6"
    >
      <h2 className="text-xl font-serif font-bold text-foreground mb-4">Edit Trophy Details</h2>

      <form onSubmit={onSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="edit-species" className="text-xs">Species *</Label>
            <Input
              id="edit-species"
              name="species"
              required
              defaultValue={trophy.species}
              data-testid="input-edit-species"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-name" className="text-xs">Trophy Name *</Label>
            <Input
              id="edit-name"
              name="name"
              required
              defaultValue={trophy.name}
              data-testid="input-edit-name"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="edit-date" className="text-xs">Date *</Label>
            <Input
              id="edit-date"
              name="date"
              type="date"
              required
              defaultValue={trophy.date}
              data-testid="input-edit-date"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Location</Label>
            <LocationSearch
              value={editLocation}
              latitude={editLat}
              longitude={editLng}
              onChange={onLocationChange}
              placeholder="Search for a location..."
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Label htmlFor="edit-score" className="text-xs">Score / Size</Label>
              <EditUnitToggle
                options={[
                  { label: "cm", value: "cm" },
                  { label: '"', value: '"' },
                  { label: "Score", value: "Score" },
                ]}
                value={editScoreUnit}
                onChange={setEditScoreUnit}
                testId="toggle-edit-score-unit"
              />
            </div>
            <Input
              id="edit-score"
              value={editScoreNum}
              onChange={(e) => setEditScoreNum(e.target.value)}
              placeholder={editScoreUnit === "cm" ? "e.g. 132" : editScoreUnit === '"' ? "e.g. 52" : "e.g. 100"}
              data-testid="input-edit-score"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Weapon</Label>
            <Select value={editWeaponId} onValueChange={setEditWeaponId}>
              <SelectTrigger data-testid="select-edit-weapon">
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
            <div className="flex items-center gap-2">
              <Label htmlFor="edit-shotDistance" className="text-xs">Shot Distance</Label>
              <EditUnitToggle
                options={[
                  { label: "m", value: "m" },
                  { label: "yards", value: "yards" },
                ]}
                value={editDistanceUnit}
                onChange={setEditDistanceUnit}
                testId="toggle-edit-distance-unit"
              />
            </div>
            <Input
              id="edit-shotDistance"
              type="number"
              min="0"
              value={editDistanceNum}
              onChange={(e) => setEditDistanceNum(e.target.value)}
              placeholder={editDistanceUnit === "m" ? "e.g. 180" : "e.g. 200"}
              data-testid="input-edit-shot-distance"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Method</Label>
            <Select value={editMethod} onValueChange={setEditMethod}>
              <SelectTrigger data-testid="select-edit-method">
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                {HUNTING_METHODS.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="edit-gender" className="text-xs">Gender</Label>
          <Input
            id="edit-gender"
            name="gender"
            defaultValue={trophy.gender || ""}
            placeholder="e.g. male, female"
            data-testid="input-edit-gender"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="edit-notes" className="text-xs">Trophy Notes</Label>
          <Textarea
            id="edit-notes"
            name="notes"
            rows={2}
            defaultValue={trophy.notes || ""}
            placeholder="Details about the trophy itself..."
            data-testid="input-edit-notes"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="edit-huntNotes" className="text-xs">Hunt Notes</Label>
          <Textarea
            id="edit-huntNotes"
            name="huntNotes"
            rows={2}
            defaultValue={trophy.huntNotes || ""}
            placeholder="The hunt story — conditions, terrain, memorable moments..."
            data-testid="input-edit-hunt-notes"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            className="flex-1 gap-2"
            disabled={isPending}
            data-testid="button-save-edit"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" /> Save Changes
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="border-border/50"
            data-testid="button-cancel-edit-form"
          >
            Cancel
          </Button>
        </div>
      </form>
    </motion.div>
  );
}

function TrophyIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}
