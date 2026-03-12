import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { registerEmailAuthRoutes } from "./auth";
import { insertWeaponSchema, insertTrophySchema, insertPreferencesSchema, insertRoomRatingSchema } from "@shared/schema";
import { analyzeTrophyImage, generateTrophyRender } from "./trophy-ai";
import { generate3DModel } from "./trophy-3d";
import multer from "multer";
import path from "path";
import fs from "fs";

const profileUploadDir = path.join(process.cwd(), "uploads", "profiles");
const trophyUploadDir = path.join(process.cwd(), "uploads", "trophies");
const weaponUploadDir = path.join(process.cwd(), "uploads", "weapons");
if (!fs.existsSync(profileUploadDir)) fs.mkdirSync(profileUploadDir, { recursive: true });
if (!fs.existsSync(trophyUploadDir)) fs.mkdirSync(trophyUploadDir, { recursive: true });
if (!fs.existsSync(weaponUploadDir)) fs.mkdirSync(weaponUploadDir, { recursive: true });

const imageUploadConfig = {
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req: any, file: any, cb: any) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPEG, PNG, WebP, or GIF images are allowed"));
  },
};

const profileUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, profileUploadDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || ".jpg";
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    },
  }),
  ...imageUploadConfig,
});

const trophyUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, trophyUploadDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || ".jpg";
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    },
  }),
  ...imageUploadConfig,
});

const weaponUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, weaponUploadDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || ".jpg";
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    },
  }),
  ...imageUploadConfig,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);
  registerEmailAuthRoutes(app);

  // Serve uploaded files
  const express = await import("express");
  app.use("/uploads", express.default.static(path.join(process.cwd(), "uploads")));

  // Helper to get user ID from request
  const getUserId = (req: any): string => req.user?.claims?.sub;

  // ========== WEAPONS (The Safe) ==========
  app.get("/api/weapons", isAuthenticated, async (req, res) => {
    const weapons = await storage.getWeapons(getUserId(req));
    res.json(weapons);
  });

  app.get("/api/weapons/:id", isAuthenticated, async (req, res) => {
    const weapon = await storage.getWeapon(req.params.id as string, getUserId(req));
    if (!weapon) return res.status(404).json({ message: "Weapon not found" });
    res.json(weapon);
  });

  app.post("/api/weapons", isAuthenticated, async (req, res) => {
    const parsed = insertWeaponSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
    const weapon = await storage.createWeapon(getUserId(req), parsed.data);
    res.status(201).json(weapon);
  });

  app.patch("/api/weapons/:id", isAuthenticated, async (req, res) => {
    const weapon = await storage.updateWeapon(req.params.id as string, getUserId(req), req.body);
    if (!weapon) return res.status(404).json({ message: "Weapon not found" });
    res.json(weapon);
  });

  app.delete("/api/weapons/:id", isAuthenticated, async (req, res) => {
    const deleted = await storage.deleteWeapon(req.params.id as string, getUserId(req));
    if (!deleted) return res.status(404).json({ message: "Weapon not found" });
    res.status(204).send();
  });

  app.post("/api/weapons/upload-image", isAuthenticated, weaponUpload.single("image"), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No image file provided" });
    const imageUrl = `/uploads/weapons/${req.file.filename}`;
    res.json({ imageUrl });
  });

  // ========== TROPHIES ==========
  const pendingRenders = new Map<string, { status: "pending" | "done" | "failed"; renderImageUrl: string | null }>();
  const pendingModels = new Map<string, { status: "pending" | "done" | "failed"; glbUrl: string | null; glbPreviewUrl: string | null }>();

  app.get("/api/trophies", isAuthenticated, async (req, res) => {
    const list = await storage.getTrophies(getUserId(req));
    res.json(list);
  });

  app.get("/api/trophies/render-status", isAuthenticated, (req, res) => {
    const imageUrl = req.query.imageUrl as string;
    if (!imageUrl) return res.status(400).json({ message: "imageUrl query param required" });
    const entry = pendingRenders.get(imageUrl);
    if (!entry) return res.json({ status: "unknown", renderImageUrl: null });
    if (entry.status === "done") {
      pendingRenders.delete(imageUrl);
    }
    res.json(entry);
  });

  app.get("/api/trophies/model-status", isAuthenticated, (req, res) => {
    const imageUrl = req.query.imageUrl as string;
    if (!imageUrl) return res.status(400).json({ message: "imageUrl query param required" });
    const entry = pendingModels.get(imageUrl);
    if (!entry) return res.json({ status: "unknown", glbUrl: null, glbPreviewUrl: null });
    if (entry.status === "done") {
      pendingModels.delete(imageUrl);
    }
    res.json(entry);
  });

  app.get("/api/trophies/:id", isAuthenticated, async (req, res) => {
    const trophy = await storage.getTrophy(req.params.id as string, getUserId(req));
    if (!trophy) return res.status(404).json({ message: "Trophy not found" });
    res.json(trophy);
  });

  app.post("/api/trophies", isAuthenticated, async (req, res) => {
    const parsed = insertTrophySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
    const trophy = await storage.createTrophy(getUserId(req), parsed.data);
    res.status(201).json(trophy);
  });

  app.patch("/api/trophies/:id", isAuthenticated, async (req, res) => {
    const trophy = await storage.updateTrophy(req.params.id as string, getUserId(req), req.body);
    if (!trophy) return res.status(404).json({ message: "Trophy not found" });
    res.json(trophy);
  });

  app.delete("/api/trophies/:id", isAuthenticated, async (req, res) => {
    const deleted = await storage.deleteTrophy(req.params.id as string, getUserId(req));
    if (!deleted) return res.status(404).json({ message: "Trophy not found" });
    res.status(204).send();
  });

  // ========== PREFERENCES ==========
  app.get("/api/preferences", isAuthenticated, async (req, res) => {
    const prefs = await storage.getPreferences(getUserId(req));
    res.json(prefs || null);
  });

  app.put("/api/preferences", isAuthenticated, async (req, res) => {
    const parsed = insertPreferencesSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
    const prefs = await storage.upsertPreferences(getUserId(req), parsed.data);
    res.json(prefs);
  });

  // ========== PROFILE IMAGE UPLOAD ==========
  app.post("/api/profile/upload-image", isAuthenticated, profileUpload.single("image"), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No image file provided" });
    const imageUrl = `/uploads/profiles/${req.file.filename}`;
    const prefs = await storage.upsertPreferences(getUserId(req), { profileImageUrl: imageUrl } as any);
    res.json({ imageUrl, preferences: prefs });
  });

  // ========== TROPHY IMAGE UPLOAD ==========
  app.post("/api/trophies/upload-image", isAuthenticated, trophyUpload.single("image"), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No image file provided" });
    const imageUrl = `/uploads/trophies/${req.file.filename}`;
    res.json({ imageUrl });
  });

  // ========== AI TROPHY ANALYSIS ==========
  app.post("/api/trophies/analyze", isAuthenticated, trophyUpload.single("image"), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No image file provided" });
      const imageUrl = `/uploads/trophies/${req.file.filename}`;
      const fileBuffer = fs.readFileSync(req.file.path);
      const base64 = fileBuffer.toString("base64");
      const prefs = await storage.getPreferences(getUserId(req));
      const units = prefs?.units || "imperial";
      const scoringSystem = prefs?.scoringSystem || "SCI";
      const analysis = await analyzeTrophyImage(base64, req.file.mimetype, units, scoringSystem);

      res.json({ imageUrl, renderImageUrl: null, analysis, units, scoringSystem });

      if (analysis.render_prompt) {
        const theme = prefs?.theme || "lodge";
        const themeBackgrounds: Record<string, string> = {
          lodge: "mounted on a dark rustic wooden plaque, warm cabin lighting, dark wood-paneled wall background",
          manor: "mounted on a rich mahogany plaque, warm golden ambient lighting, dark safari-themed wall background with warm earth tones",
          minimal: "mounted on a clean light oak plaque, bright studio lighting, clean white wall background",
        };
        const themedPrompt = analysis.render_prompt.replace(
          /dark wooden plaque.*$/i,
          themeBackgrounds[theme] || themeBackgrounds.lodge
        );
        pendingRenders.set(imageUrl, { status: "pending", renderImageUrl: null });
        console.log(`[render] Started background render for ${imageUrl} (theme: ${theme})`);
        generateTrophyRender(themedPrompt)
          .then((renderBuffer) => {
            if (renderBuffer) {
              const renderFilename = `render-${Date.now()}-${Math.random().toString(36).slice(2)}.png`;
              const renderPath = path.join(trophyUploadDir, renderFilename);
              fs.writeFileSync(renderPath, renderBuffer);
              const renderUrl = `/uploads/trophies/${renderFilename}`;
              pendingRenders.set(imageUrl, { status: "done", renderImageUrl: renderUrl });
              console.log(`[render] Completed render for ${imageUrl} → ${renderUrl}`);
              storage.patchTrophyRenderByImage(imageUrl, renderUrl).then(() => {
                console.log(`[render] Auto-patched trophy render for ${imageUrl}`);
              }).catch((err) => {
                console.error("[render] Failed to patch trophy render:", err);
              });
            } else {
              console.error(`[render] Render returned empty for ${imageUrl}`);
              pendingRenders.set(imageUrl, { status: "failed", renderImageUrl: null });
            }
          })
          .catch((err) => {
            console.error(`[render] Render generation failed for ${imageUrl}:`, err);
            pendingRenders.set(imageUrl, { status: "failed", renderImageUrl: null });
          });
      }

      pendingModels.set(imageUrl, { status: "pending", glbUrl: null, glbPreviewUrl: null });
      const mountType = analysis.mount_recommendation?.best || null;
      console.log(`[3d-model] Started background 3D generation for ${imageUrl} (mount: ${mountType})`);
      generate3DModel(req.file!.path, mountType)
        .then(({ glbUrl, glbPreviewUrl }) => {
          pendingModels.set(imageUrl, { status: "done", glbUrl, glbPreviewUrl });
          console.log(`[3d-model] Completed 3D model for ${imageUrl} → ${glbUrl}`);
          storage.patchTrophyGlb(imageUrl, glbUrl, glbPreviewUrl, mountType).then(() => {
            console.log(`[3d-model] Auto-patched trophy GLB for ${imageUrl}`);
          }).catch((err) => {
            console.error("[3d-model] Failed to patch trophy GLB:", err);
          });
        })
        .catch((err) => {
          console.error(`[3d-model] 3D model generation failed for ${imageUrl}:`, err);
          pendingModels.set(imageUrl, { status: "failed", glbUrl: null, glbPreviewUrl: null });
        });
    } catch (error: any) {
      console.error("AI analysis error:", error);
      res.status(500).json({ message: "AI analysis failed", error: error.message });
    }
  });

  // ========== COMMUNITY / ROOM RATINGS ==========
  app.get("/api/community/rooms", async (_req, res) => {
    const rooms = await storage.getPublicRooms();
    res.json(rooms);
  });

  app.get("/api/community/room/:userId", async (req, res) => {
    const data = await storage.getUserPublic(req.params.userId as string);
    if (!data) return res.status(404).json({ message: "Room not found or is private" });
    const list = await storage.getPublicTrophies(req.params.userId as string);
    const rating = await storage.getRoomRating(req.params.userId as string);
    res.json({ ...data, trophies: list, rating });
  });

  app.post("/api/community/rate", isAuthenticated, async (req, res) => {
    const parsed = insertRoomRatingSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
    const raterId = getUserId(req);
    if (raterId === parsed.data.roomOwnerId) return res.status(400).json({ message: "Cannot rate your own room" });
    const result = await storage.rateRoom(raterId, parsed.data);
    res.json(result);
  });

  app.get("/api/my-room-rating", isAuthenticated, async (req, res) => {
    const rating = await storage.getRoomRating(getUserId(req));
    res.json(rating);
  });

  app.post("/api/trophies/:id/star", isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    const trophyId = req.params.id as string;
    const trophy = await storage.getTrophy(trophyId, userId);
    if (!trophy) return res.status(404).json({ message: "Trophy not found" });

    const allTrophies = await storage.getTrophies(userId);
    for (const t of allTrophies) {
      if (t.featured && t.id !== trophyId) {
        await storage.updateTrophy(t.id, userId, { featured: false });
      }
    }

    const updated = await storage.updateTrophy(trophyId, userId, { featured: !trophy.featured });
    res.json(updated);
  });

  // ========== STATS ==========
  app.get("/api/stats", isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    const allTrophies = await storage.getTrophies(userId);
    const allWeapons = await storage.getWeapons(userId);
    const prefs = await storage.getPreferences(userId);
    const uniqueSpecies = new Set(allTrophies.map(t => t.species));
    const roomRating = await storage.getRoomRating(userId);

    const scoringSystem = prefs?.scoringSystem || "SCI";
    const { getThreshold, parseScoreNumeric } = await import("@shared/scoring-thresholds");
    let qualifyingCount = 0;
    allTrophies.forEach(t => {
      if (!t.score || t.score.trim() === "") return;
      const threshold = getThreshold(t.species, scoringSystem);
      if (!threshold || threshold === "n/a") return;
      const numericScore = parseScoreNumeric(t.score);
      const numericThreshold = parseScoreNumeric(threshold);
      if (numericScore !== null && numericThreshold !== null && numericScore >= numericThreshold) {
        qualifyingCount++;
      }
    });

    const roomVisibility = prefs?.roomVisibility || "private";
    let rating: number | null = null;
    let ratingSource: "community" | "none" = "none";
    if (roomVisibility === "public" && roomRating.totalRatings > 0) {
      rating = Math.round(roomRating.avgScore * 100) / 100;
      ratingSource = "community";
    }

    let furthestShot: string | null = null;
    let furthestShotSpecies: string | null = null;
    allTrophies.forEach(t => {
      if (!t.shotDistance) return;
      const dist = parseFloat(t.shotDistance.replace(/[^0-9.]/g, ""));
      if (!isNaN(dist)) {
        const currentMax = furthestShot ? parseFloat(furthestShot.replace(/[^0-9.]/g, "")) : 0;
        if (dist > currentMax) {
          furthestShot = t.shotDistance;
          furthestShotSpecies = t.species;
        }
      }
    });

    res.json({
      totalHunts: allTrophies.length,
      qualifyingTrophies: qualifyingCount,
      scoringSystem,
      speciesCollected: uniqueSpecies.size,
      recentSpecies: allTrophies[0]?.species || null,
      roomRating: rating,
      roomRatingSource: ratingSource,
      roomRatingCount: roomRating.totalRatings,
      roomVisibility,
      weaponCount: allWeapons.length,
      furthestShot,
      furthestShotSpecies,
    });
  });

  return httpServer;
}
