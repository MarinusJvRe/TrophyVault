import Layout from "@/components/Layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { getAuthToken } from "@/lib/auth-token";
import { Plus, Search, Crosshair, Shield, Trash2, Camera, ImageIcon, X, Crop, Check, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import type { Weapon } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import ReactCrop, { type Crop as CropType, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

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

export default function Safe() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [croppedPreviewUrl, setCroppedPreviewUrl] = useState<string | null>(null);
  const [croppedFile, setCroppedFile] = useState<File | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [showCrop, setShowCrop] = useState(false);
  const [crop, setCrop] = useState<CropType>();
  const cropImageRef = useRef<HTMLImageElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const { data: weapons = [], isLoading } = useQuery<Weapon[]>({
    queryKey: ["/api/weapons"],
  });

  const resetImageState = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (croppedPreviewUrl) URL.revokeObjectURL(croppedPreviewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setCroppedPreviewUrl(null);
    setCroppedFile(null);
    setUploadedImageUrl(null);
    setShowCrop(false);
    setCrop(undefined);
  }, [previewUrl, croppedPreviewUrl]);

  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/weapons/upload-image", {
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
    },
    onError: (error: Error) => {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    },
  });

  const createWeaponMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/weapons", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weapons"] });
      setDialogOpen(false);
      resetImageState();
      toast({ title: "Weapon added", description: "Your weapon has been added to the safe." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteWeaponMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/weapons/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weapons"] });
      toast({ title: "Weapon removed", description: "The weapon has been removed from the safe." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const filteredWeapons = weapons.filter(w => 
    w.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    w.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (croppedPreviewUrl) URL.revokeObjectURL(croppedPreviewUrl);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setCroppedPreviewUrl(null);
    setCroppedFile(null);
    setCrop(undefined);
    setUploadedImageUrl(null);
    setShowCrop(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
    e.target.value = "";
  };

  const onCropImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
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
      setShowCrop(false);
      setUploadedImageUrl(null);
    } catch {
      toast({ title: "Crop failed", description: "Could not crop the image", variant: "destructive" });
    }
  };

  const getFileToUpload = () => croppedFile || selectedFile;
  const getPreviewToShow = () => croppedPreviewUrl || previewUrl;

  const handleCreateWeapon = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    let imageUrl = uploadedImageUrl;
    const fileToUpload = getFileToUpload();
    if (fileToUpload && !imageUrl) {
      try {
        const result = await uploadImageMutation.mutateAsync(fileToUpload);
        imageUrl = result.imageUrl;
      } catch {
        return;
      }
    }

    createWeaponMutation.mutate({
      name: formData.get("name") as string,
      type: formData.get("type") as string,
      caliber: formData.get("caliber") as string || null,
      make: formData.get("make") as string || null,
      model: formData.get("model") as string || null,
      optic: formData.get("optic") as string || null,
      notes: formData.get("notes") as string || null,
      imageUrl: imageUrl || null,
    });
  };

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) resetImageState();
  };

  return (
    <Layout>
      <div className="p-6 md:p-12 max-w-7xl mx-auto min-h-full">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-primary mb-2 flex items-center gap-3">
              <Shield className="h-8 w-8" />
              The Safe
            </h1>
            <p className="text-muted-foreground max-w-md">
              Manage your armory. Track details for every rifle, bow, and muzzleloader in your collection.
            </p>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search safe..." 
                className="pl-9 bg-card border-border/50 focus:border-primary/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search-weapons"
              />
            </div>
            
            <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2" data-testid="button-add-weapon">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Weapon</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-serif text-xl">Add to Safe</DialogTitle>
                </DialogHeader>

                {showCrop && previewUrl ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Drag to adjust the crop area.
                    </p>
                    <div className="rounded-xl overflow-hidden border border-border/40 max-h-[350px] flex items-center justify-center bg-black/5">
                      <ReactCrop crop={crop} onChange={(c) => setCrop(c)} minWidth={50} minHeight={50}>
                        <img
                          ref={cropImageRef}
                          src={previewUrl}
                          alt="Crop preview"
                          onLoad={onCropImageLoad}
                          className="max-h-[330px] w-auto"
                          data-testid="img-weapon-crop-preview"
                        />
                      </ReactCrop>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleCropDone} className="flex-1 gap-2" data-testid="button-apply-weapon-crop">
                        <Check className="h-4 w-4" /> Apply Crop
                      </Button>
                      <Button onClick={() => setShowCrop(false)} variant="outline" data-testid="button-cancel-weapon-crop">
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleCreateWeapon} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Weapon Image</Label>
                      <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileInput}
                        className="hidden"
                        data-testid="input-weapon-camera"
                      />
                      <input
                        ref={galleryInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileInput}
                        className="hidden"
                        data-testid="input-weapon-gallery"
                      />

                      {!selectedFile ? (
                        <div className="border-2 border-dashed border-border/60 rounded-lg p-4 text-center hover:border-primary/50 hover:bg-primary/5 transition-all">
                          <p className="text-sm text-muted-foreground mb-3">Take a photo or select from gallery</p>
                          <div className="flex gap-2 justify-center">
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              className="bg-primary/10 text-primary hover:bg-primary/20 gap-1"
                              onClick={() => cameraInputRef.current?.click()}
                              data-testid="button-weapon-take-photo"
                            >
                              <Camera className="h-4 w-4" /> Take Photo
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              className="bg-primary/10 text-primary hover:bg-primary/20 gap-1"
                              onClick={() => galleryInputRef.current?.click()}
                              data-testid="button-weapon-choose-gallery"
                            >
                              <ImageIcon className="h-4 w-4" /> Gallery
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">JPEG, PNG, or WebP up to 10MB</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="relative rounded-lg overflow-hidden border border-border/40">
                            <img
                              src={getPreviewToShow()!}
                              alt="Weapon preview"
                              className="w-full max-h-[200px] object-contain bg-black/5"
                              data-testid="img-weapon-preview"
                            />
                            <button
                              type="button"
                              onClick={() => { resetImageState(); }}
                              className="absolute top-2 right-2 h-7 w-7 rounded-full bg-background/80 backdrop-blur flex items-center justify-center hover:bg-destructive/80 hover:text-white transition-colors"
                              data-testid="button-remove-weapon-photo"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                            {croppedFile && (
                              <div className="absolute top-2 left-2 bg-green-500/80 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                <Check className="h-3 w-3" /> Cropped
                              </div>
                            )}
                          </div>
                          <Button
                            type="button"
                            onClick={() => setShowCrop(true)}
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            data-testid="button-crop-weapon-photo"
                          >
                            <Crop className="h-4 w-4" /> Crop
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="weapon-name">Name *</Label>
                        <Input id="weapon-name" name="name" required data-testid="input-weapon-name" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="weapon-type">Type *</Label>
                        <Select name="type" required>
                          <SelectTrigger data-testid="select-weapon-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Rifle">Rifle</SelectItem>
                            <SelectItem value="Bow">Bow</SelectItem>
                            <SelectItem value="Muzzleloader">Muzzleloader</SelectItem>
                            <SelectItem value="Handgun">Handgun</SelectItem>
                            <SelectItem value="Shotgun">Shotgun</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="weapon-make">Make</Label>
                        <Input id="weapon-make" name="make" data-testid="input-weapon-make" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="weapon-model">Model</Label>
                        <Input id="weapon-model" name="model" data-testid="input-weapon-model" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="weapon-caliber">Caliber</Label>
                        <Input id="weapon-caliber" name="caliber" data-testid="input-weapon-caliber" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="weapon-optic">Optic</Label>
                        <Input id="weapon-optic" name="optic" data-testid="input-weapon-optic" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="weapon-notes">Notes</Label>
                      <Input id="weapon-notes" name="notes" data-testid="input-weapon-notes" />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={createWeaponMutation.isPending || uploadImageMutation.isPending}
                      data-testid="button-submit-weapon"
                    >
                      {uploadImageMutation.isPending ? (
                        <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Uploading image...</>
                      ) : createWeaponMutation.isPending ? "Adding..." : "Add to Safe"}
                    </Button>
                  </form>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            onClick={() => setDialogOpen(true)}
            className="group min-h-[200px] flex flex-col items-center justify-center border-2 border-dashed border-border/40 rounded-xl p-6 text-center hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer bg-card/30"
          >
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-serif font-bold text-foreground mb-1">Add to Safe</h3>
            <p className="text-sm text-muted-foreground">Register a new firearm or bow</p>
          </motion.div>

          {filteredWeapons.map((weapon, i) => (
            <WeaponCard key={weapon.id} weapon={weapon} index={i} onDelete={() => deleteWeaponMutation.mutate(weapon.id)} />
          ))}
        </div>
      </div>
    </Layout>
  );
}

function WeaponCard({ weapon, index, onDelete }: { weapon: Weapon, index: number, onDelete: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 + 0.1 }}
      data-testid={`card-weapon-${weapon.id}`}
    >
      <Card className="bg-card border-border/40 overflow-hidden hover:border-primary/50 transition-all group h-full">
        <div className="relative h-48 bg-black/40">
           {weapon.imageUrl ? (
             <img src={weapon.imageUrl} alt={weapon.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
           ) : (
             <div className="w-full h-full flex items-center justify-center bg-secondary/10">
               <Crosshair className="h-12 w-12 text-muted-foreground/30" />
             </div>
           )}
           <div className="absolute top-3 right-3 flex gap-2">
             <Badge variant="secondary" className="bg-background/80 backdrop-blur-md border border-white/10">
               {weapon.type}
             </Badge>
           </div>
           <button
             onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}
             className="absolute top-3 left-3 p-1.5 rounded-full bg-background/80 backdrop-blur-md border border-white/10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
             data-testid={`button-delete-weapon-${weapon.id}`}
           >
             <Trash2 className="h-3.5 w-3.5" />
           </button>
        </div>
        
        <CardContent className="p-5">
          <h3 className="text-xl font-serif font-bold text-foreground mb-1">{weapon.name}</h3>
          <div className="text-sm text-primary font-medium mb-4">{weapon.make} {weapon.model}</div>
          
          <div className="space-y-2 text-sm text-muted-foreground">
             {weapon.caliber && (
               <div className="flex justify-between border-b border-border/40 pb-2">
                 <span>Caliber</span>
                 <span className="text-foreground">{weapon.caliber}</span>
               </div>
             )}
             {weapon.optic && (
               <div className="flex justify-between border-b border-border/40 pb-2">
                 <span>Optic</span>
                 <span className="text-foreground">{weapon.optic}</span>
               </div>
             )}
             {weapon.notes && (
               <div className="pt-2 italic text-xs opacity-70">
                 "{weapon.notes}"
               </div>
             )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
