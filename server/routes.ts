import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { registerEmailAuthRoutes } from "./auth";
import { insertWeaponSchema, insertTrophySchema, insertPreferencesSchema, insertRoomRatingSchema } from "@shared/schema";
import { analyzeTrophyImage, generateTrophyRender } from "./trophy-ai";
import multer from "multer";
import path from "path";
import fs from "fs";

const profileUploadDir = path.join(process.cwd(), "uploads", "profiles");
const trophyUploadDir = path.join(process.cwd(), "uploads", "trophies");
if (!fs.existsSync(profileUploadDir)) fs.mkdirSync(profileUploadDir, { recursive: true });
if (!fs.existsSync(trophyUploadDir)) fs.mkdirSync(trophyUploadDir, { recursive: true });

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

  // ========== TROPHIES ==========
  app.get("/api/trophies", isAuthenticated, async (req, res) => {
    const list = await storage.getTrophies(getUserId(req));
    res.json(list);
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

      let renderImageUrl: string | null = null;
      if (analysis.render_prompt) {
        try {
          const renderBuffer = await generateTrophyRender(analysis.render_prompt);
          if (renderBuffer) {
            const renderFilename = `render-${Date.now()}-${Math.random().toString(36).slice(2)}.png`;
            const renderPath = path.join(trophyUploadDir, renderFilename);
            fs.writeFileSync(renderPath, renderBuffer);
            renderImageUrl = `/uploads/trophies/${renderFilename}`;
          }
        } catch (renderErr) {
          console.error("Render generation failed (non-blocking):", renderErr);
        }
      }

      res.json({ imageUrl, renderImageUrl, analysis, units, scoringSystem });
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

  // ========== STATS ==========
  app.get("/api/stats", isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    const allTrophies = await storage.getTrophies(userId);
    const uniqueSpecies = new Set(allTrophies.map(t => t.species));
    const qualifyingTrophies = allTrophies.filter(t => t.score && t.score.trim() !== "");
    const roomRating = await storage.getRoomRating(userId);

    let rating: number | null = null;
    let ratingSource: "community" | "auto" = "auto";
    if (roomRating.totalRatings > 0) {
      rating = Math.round(roomRating.avgScore * 100) / 100;
      ratingSource = "community";
    } else if (allTrophies.length > 0) {
      const hasImage = allTrophies.filter(t => t.imageUrl).length;
      const hasScore = qualifyingTrophies.length;
      const hasNotes = allTrophies.filter(t => t.notes && t.notes.trim() !== "").length;
      const total = allTrophies.length;
      const completeness = ((hasImage / total) * 0.4 + (hasScore / total) * 0.35 + (hasNotes / total) * 0.25) * 5;
      rating = Math.round(Math.min(5, Math.max(0.5, completeness)) * 100) / 100;
    }

    res.json({
      totalHunts: allTrophies.length,
      totalTrophies: qualifyingTrophies.length,
      speciesCollected: uniqueSpecies.size,
      recentSpecies: allTrophies[0]?.species || null,
      roomRating: rating,
      roomRatingSource: ratingSource,
      roomRatingCount: roomRating.totalRatings,
    });
  });

  return httpServer;
}
