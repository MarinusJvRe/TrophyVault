import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { registerEmailAuthRoutes } from "./auth";
import { insertWeaponSchema, insertTrophySchema, insertPreferencesSchema, insertRoomRatingSchema, insertProProfileSchema, TIER_LIMITS, AI_COSTS, type AccountTier } from "@shared/schema";
import { analyzeTrophyImage } from "./trophy-ai";
import { generate3DModel, generateMountImageOnly } from "./trophy-3d";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { uploadBufferToStorage, uploadFileToStorage } from "./object-storage-helper";
import multer from "multer";
import path from "path";
import fs from "fs";
import os from "os";

const tmpUploadDir = path.join(os.tmpdir(), "hth-uploads");
if (!fs.existsSync(tmpUploadDir)) fs.mkdirSync(tmpUploadDir, { recursive: true });

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

async function checkTierLimit(userId: string, actionType: "ai_analysis" | "3d_model"): Promise<{ allowed: boolean; reason?: string; tier: AccountTier }> {
  const prefs = await storage.getPreferences(userId);
  const tier = (prefs?.accountTier || "free") as AccountTier;
  const limits = TIER_LIMITS[tier];

  if (tier === "free") {
    const lifetime = await storage.getLifetimeUsageCounts(userId);
    if (actionType === "ai_analysis" && lifetime.aiAnalyses >= limits.maxAiAnalyses) {
      return { allowed: false, reason: `Free tier limit reached: ${limits.maxAiAnalyses} AI analyses. Upgrade to continue.`, tier };
    }
    if (actionType === "3d_model" && lifetime.models3d >= limits.max3dModels) {
      return { allowed: false, reason: `Free tier limit reached: ${limits.max3dModels} 3D model. Upgrade to continue.`, tier };
    }
    return { allowed: true, tier };
  }

  const monthly = await storage.getMonthlyUsage(userId);
  const actionCost = AI_COSTS[actionType] || 0;
  if (monthly.totalCost + actionCost > limits.monthlyCostCap) {
    return {
      allowed: false,
      reason: `Monthly budget exhausted ($${monthly.totalCost.toFixed(2)}/$${limits.monthlyCostCap}). Purchase additional credits to continue.`,
      tier,
    };
  }

  return { allowed: true, tier };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);
  registerEmailAuthRoutes(app);

  // Serve uploaded files (legacy local + Object Storage)
  const express = await import("express");
  app.use("/uploads", express.default.static(path.join(process.cwd(), "uploads")));
  registerObjectStorageRoutes(app);

  const getUserId = (req: any): string => req.user?.claims?.sub;

  // ========== MAPS CONFIG ==========
  app.get("/api/maps-config", isAuthenticated, (_req, res) => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: "Google Maps API key not configured" });
    }
    res.json({ apiKey });
  });

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
    try {
      const imageUrl = await uploadFileToStorage(req.file.path, req.file.mimetype);
      res.json({ imageUrl });
    } catch (err) {
      console.error("[upload] Object Storage upload failed, using local fallback:", err);
      const imageUrl = `/uploads/weapons/${req.file.filename}`;
      res.json({ imageUrl });
    }
  });

  // ========== TROPHIES ==========
  const pendingModels = new Map<string, { status: "pending" | "done" | "failed"; glbUrl: string | null; glbPreviewUrl: string | null; usdzUrl: string | null; mountRenderUrl: string | null }>();

  app.get("/api/trophies", isAuthenticated, async (req, res) => {
    const list = await storage.getTrophies(getUserId(req));
    res.json(list);
  });

  app.get("/api/trophies/model-status", isAuthenticated, (req, res) => {
    const imageUrl = req.query.imageUrl as string;
    if (!imageUrl) return res.status(400).json({ message: "imageUrl query param required" });
    const entry = pendingModels.get(imageUrl);
    if (!entry) return res.json({ status: "unknown", glbUrl: null, glbPreviewUrl: null, usdzUrl: null, mountRenderUrl: null });
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
    const userId = getUserId(req);

    const prefs = await storage.getPreferences(userId);
    const tier = (prefs?.accountTier || "free") as AccountTier;
    if (tier === "free") {
      const allTrophies = await storage.getTrophies(userId);
      const manualTrophies = allTrophies.filter(t => !t.isAiAnalyzed);
      if (manualTrophies.length >= TIER_LIMITS.free.maxManualTrophies) {
        return res.status(403).json({ message: `Free tier limit: ${TIER_LIMITS.free.maxManualTrophies} manual trophies. Upgrade to add more.`, tierLimit: true });
      }
    }

    const trophy = await storage.createTrophy(userId, parsed.data);

    const currentPrefs = await storage.getPreferences(userId);
    if (currentPrefs && !currentPrefs.firstTrophyUploaded) {
      await storage.upsertPreferences(userId, { firstTrophyUploaded: true } as any);
    }

    res.status(201).json(trophy);
  });

  app.patch("/api/trophies/:id", isAuthenticated, async (req, res) => {
    const allowedFields = ["species", "name", "date", "location", "latitude", "longitude", "score", "method", "weaponId", "gender", "shotDistance", "notes", "huntNotes", "imageUrl", "glbUrl", "glbPreviewUrl", "usdzUrl", "mountType", "featured", "taggedProUserId"];
    const safeBody: Record<string, any> = {};
    for (const key of allowedFields) {
      if (key in req.body) safeBody[key] = req.body[key];
    }
    const trophy = await storage.updateTrophy(req.params.id as string, getUserId(req), safeBody);
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
    const { accountTier, userType, leaderboardVerified, credits, ...safeData } = parsed.data as any;
    const prefs = await storage.upsertPreferences(getUserId(req), safeData);
    res.json(prefs);
  });

  app.post("/api/upgrade", isAuthenticated, async (req, res) => {
    const { tier } = req.body;
    if (!tier || !["paid", "pro"].includes(tier)) {
      return res.status(400).json({ message: "Invalid tier. Must be 'paid' or 'pro'." });
    }
    const prefs = await storage.upsertPreferences(getUserId(req), { accountTier: tier } as any);
    res.json(prefs);
  });

  // ========== PROFILE IMAGE UPLOAD ==========
  app.post("/api/profile/upload-image", isAuthenticated, profileUpload.single("image"), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No image file provided" });
    try {
      const imageUrl = await uploadFileToStorage(req.file.path, req.file.mimetype);
      const prefs = await storage.upsertPreferences(getUserId(req), { profileImageUrl: imageUrl } as any);
      res.json({ imageUrl, preferences: prefs });
    } catch (err) {
      console.error("[upload] Object Storage upload failed, using local fallback:", err);
      const imageUrl = `/uploads/profiles/${req.file.filename}`;
      const prefs = await storage.upsertPreferences(getUserId(req), { profileImageUrl: imageUrl } as any);
      res.json({ imageUrl, preferences: prefs });
    }
  });

  // ========== TROPHY IMAGE UPLOAD ==========
  app.post("/api/trophies/upload-image", isAuthenticated, trophyUpload.single("image"), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No image file provided" });
    try {
      const imageUrl = await uploadFileToStorage(req.file.path, req.file.mimetype);
      res.json({ imageUrl });
    } catch (err) {
      console.error("[upload] Object Storage upload failed, using local fallback:", err);
      const imageUrl = `/uploads/trophies/${req.file.filename}`;
      res.json({ imageUrl });
    }
  });

  // ========== AI TROPHY ANALYSIS (with tier enforcement) ==========
  app.post("/api/trophies/analyze", isAuthenticated, trophyUpload.single("image"), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No image file provided" });
      const userId = getUserId(req);

      const tierCheck = await checkTierLimit(userId, "ai_analysis");
      if (!tierCheck.allowed) {
        return res.status(403).json({ message: tierCheck.reason, tierLimit: true, tier: tierCheck.tier });
      }

      let imageUrl: string;
      try {
        imageUrl = await uploadFileToStorage(req.file.path, req.file.mimetype);
      } catch (err) {
        console.error("[upload] Object Storage upload failed, using local fallback:", err);
        imageUrl = `/uploads/trophies/${req.file.filename}`;
      }
      const fileBuffer = fs.readFileSync(req.file.path);
      const base64 = fileBuffer.toString("base64");
      const prefs = await storage.getPreferences(userId);
      const units = prefs?.units || "imperial";
      const scoringSystem = prefs?.scoringSystem || "SCI";
      const analysis = await analyzeTrophyImage(base64, req.file.mimetype, units, scoringSystem);

      await storage.logUsage(userId, "ai_analysis", AI_COSTS.ai_analysis, `Analyzed trophy image: ${imageUrl}`);

      res.json({ imageUrl, analysis, units, scoringSystem });

      const roomTheme = prefs?.theme || "lodge";
      const mountType = analysis.mount_recommendation?.best || null;
      const accountTier = prefs?.accountTier || "free";
      const isPaidTier = accountTier === "paid" || accountTier === "pro";

      if (isPaidTier) {
        const modelCheck = await checkTierLimit(userId, "3d_model");
        if (modelCheck.allowed) {
          pendingModels.set(imageUrl, { status: "pending", glbUrl: null, glbPreviewUrl: null, usdzUrl: null, mountRenderUrl: null });
          console.log(`[3d-model] Started background 3D generation for ${imageUrl} (mount: ${mountType}, theme: ${roomTheme}, tier: ${accountTier})`);
          generate3DModel(req.file!.path, mountType, analysis, roomTheme, (localMountUrl) => {
            uploadFileToStorage(path.join(process.cwd(), localMountUrl))
              .then((uploadedMountUrl) => {
                pendingModels.set(imageUrl, { status: "pending", glbUrl: null, glbPreviewUrl: null, usdzUrl: null, mountRenderUrl: uploadedMountUrl });
              })
              .catch(() => {
                pendingModels.set(imageUrl, { status: "pending", glbUrl: null, glbPreviewUrl: null, usdzUrl: null, mountRenderUrl: localMountUrl });
              });
          })
            .then(async ({ glbUrl: localGlbUrl, glbPreviewUrl: localPreviewUrl, usdzUrl: localUsdzUrl, mountRenderUrl: localMountRenderUrl }) => {
              let glbUrl = localGlbUrl;
              let glbPreviewUrl = localPreviewUrl;
              let mountRenderUrl = localMountRenderUrl;
              try {
                glbUrl = await uploadFileToStorage(path.join(process.cwd(), localGlbUrl));
                if (localPreviewUrl) {
                  glbPreviewUrl = await uploadFileToStorage(path.join(process.cwd(), localPreviewUrl));
                }
                if (localMountRenderUrl) {
                  mountRenderUrl = await uploadFileToStorage(path.join(process.cwd(), localMountRenderUrl));
                }
              } catch (err) {
                console.error("[3d-model] Object Storage upload failed, using local paths:", err);
              }
              pendingModels.set(imageUrl, { status: "done", glbUrl, glbPreviewUrl, usdzUrl: localUsdzUrl, mountRenderUrl });
              console.log(`[3d-model] Completed 3D model for ${imageUrl} → ${glbUrl}`);
              await storage.logUsage(userId, "3d_model", AI_COSTS["3d_model"], `3D model for: ${imageUrl}`);
              storage.patchTrophyGlb(imageUrl, glbUrl, glbPreviewUrl, mountType, localUsdzUrl, mountRenderUrl).then(() => {
                console.log(`[3d-model] Auto-patched trophy GLB for ${imageUrl}`);
              }).catch((err) => {
                console.error("[3d-model] Failed to patch trophy GLB:", err);
              });
            })
            .catch((err) => {
              console.error(`[3d-model] 3D model generation failed for ${imageUrl}:`, err);
              pendingModels.set(imageUrl, { status: "failed", glbUrl: null, glbPreviewUrl: null, usdzUrl: null, mountRenderUrl: null });
            });
        }
      } else {
        pendingModels.set(imageUrl, { status: "pending", glbUrl: null, glbPreviewUrl: null, usdzUrl: null, mountRenderUrl: null });
        console.log(`[mount-image] Free user: generating mount render only for ${imageUrl} (theme: ${roomTheme})`);
        generateMountImageOnly(req.file!.path, analysis, roomTheme)
          .then(async ({ mountRenderUrl: localMountRenderUrl }) => {
            let mountRenderUrl = localMountRenderUrl;
            if (localMountRenderUrl) {
              try {
                mountRenderUrl = await uploadFileToStorage(path.join(process.cwd(), localMountRenderUrl));
              } catch (err) {
                console.error("[mount-image] Object Storage upload failed, using local path:", err);
              }
              storage.patchTrophyRenderImage(imageUrl, mountRenderUrl!).then(() => {
                console.log(`[mount-image] Auto-patched trophy render image for ${imageUrl}`);
              }).catch((err) => {
                console.error("[mount-image] Failed to patch trophy render image:", err);
              });
            }
            pendingModels.set(imageUrl, { status: "done", glbUrl: null, glbPreviewUrl: null, usdzUrl: null, mountRenderUrl });
          })
          .catch((err) => {
            console.error(`[mount-image] Mount image generation failed for ${imageUrl}:`, err);
            pendingModels.set(imageUrl, { status: "failed", glbUrl: null, glbPreviewUrl: null, usdzUrl: null, mountRenderUrl: null });
          });
      }
    } catch (error: any) {
      console.error("AI analysis error:", error);
      res.status(500).json({ message: "AI analysis failed", error: error.message });
    }
  });

  // ========== USAGE & TIER INFO ==========
  app.get("/api/usage", isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    const prefs = await storage.getPreferences(userId);
    const tier = (prefs?.accountTier || "free") as AccountTier;
    const monthly = await storage.getMonthlyUsage(userId);
    const lifetime = await storage.getLifetimeUsageCounts(userId);
    const limits = TIER_LIMITS[tier];

    res.json({
      tier,
      monthly,
      lifetime,
      limits: {
        maxAiAnalyses: tier === "free" ? limits.maxAiAnalyses : null,
        max3dModels: tier === "free" ? limits.max3dModels : null,
        maxManualTrophies: tier === "free" ? limits.maxManualTrophies : null,
        monthlyCostCap: limits.monthlyCostCap || null,
      },
      remaining: {
        aiAnalyses: tier === "free" ? Math.max(0, limits.maxAiAnalyses - lifetime.aiAnalyses) : null,
        models3d: tier === "free" ? Math.max(0, limits.max3dModels - lifetime.models3d) : null,
        monthlyBudget: tier !== "free" ? Math.max(0, limits.monthlyCostCap - monthly.totalCost) : null,
      },
    });
  });

  // ========== PRO PROFILES ==========
  app.get("/api/pro/profile", isAuthenticated, async (req, res) => {
    const profile = await storage.getProProfile(getUserId(req));
    res.json(profile || null);
  });

  app.post("/api/pro/profile", isAuthenticated, async (req, res) => {
    const parsed = insertProProfileSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
    const userId = getUserId(req);
    const existing = await storage.getProProfile(userId);
    if (existing) return res.status(409).json({ message: "Pro profile already exists" });
    const profile = await storage.createProProfile(userId, parsed.data);
    res.status(201).json(profile);
  });

  app.patch("/api/pro/profile", isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    const profile = await storage.updateProProfile(userId, req.body);
    if (!profile) return res.status(404).json({ message: "Pro profile not found" });
    res.json(profile);
  });

  app.get("/api/pro/search", isAuthenticated, async (req, res) => {
    const query = (req.query.q as string) || "";
    if (query.length < 2) return res.json([]);
    const results = await storage.searchProUsers(query);
    res.json(results);
  });

  // ========== REFERRALS ==========
  app.get("/api/pro/referrals", isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    const profile = await storage.getProProfile(userId);
    if (!profile) return res.status(403).json({ message: "Pro profile required" });
    const referrals = await storage.getReferralsByProUser(userId);
    const stats = await storage.getReferralStats(userId);
    res.json({ referrals, stats, referralCode: profile.referralCode, referralLink: profile.referralLink });
  });

  app.get("/api/referral/validate/:code", async (req, res) => {
    const profile = await storage.getProProfileByReferralCode(req.params.code as string);
    if (!profile) return res.status(404).json({ message: "Invalid referral code" });
    res.json({ valid: true, proUserId: profile.userId, businessName: profile.businessName });
  });

  app.post("/api/referral/track", async (req, res) => {
    const { referralCode, referredUserId } = req.body;
    if (!referralCode) return res.status(400).json({ message: "Referral code required" });
    const profile = await storage.getProProfileByReferralCode(referralCode);
    if (!profile) return res.status(404).json({ message: "Invalid referral code" });
    const referral = await storage.createReferral(profile.userId, referralCode, referredUserId);
    res.json(referral);
  });

  // ========== PRO TAG STATS ==========
  app.get("/api/pro/tags", isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    const profile = await storage.getProProfile(userId);
    if (!profile) return res.status(403).json({ message: "Pro profile required" });
    const stats = await storage.getTagStats(userId);
    res.json(stats);
  });

  // ========== LEADERBOARD VERIFICATION ==========
  app.post("/api/verify-leaderboard", isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    const prefs = await storage.getPreferences(userId);
    const tier = (prefs?.accountTier || "free") as AccountTier;

    if (tier === "free") {
      return res.status(403).json({ message: "Paid or Pro tier required for leaderboard verification" });
    }

    const { realName, hasProfilePhoto } = req.body;
    if (!realName || !hasProfilePhoto) {
      return res.status(400).json({ message: "Real name confirmation and profile photo required" });
    }

    const updated = await storage.upsertPreferences(userId, { leaderboardVerified: true } as any);
    res.json({ verified: true, preferences: updated });
  });

  // ========== COMMUNITY / ROOM RATINGS ==========
  app.get("/api/community/rooms", async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);
    const search = (req.query.search as string) || undefined;
    const sort = (req.query.sort as string) || "rating";
    const validSorts = ["rating", "trophies", "newest"];
    const result = await storage.getPublicRooms({
      limit,
      offset,
      search,
      sort: validSorts.includes(sort) ? sort as "rating" | "trophies" | "newest" : "rating",
    });
    res.json(result);
  });

  app.get("/api/community/species", async (_req, res) => {
    const species = await storage.getDistinctSpeciesWithScores();
    res.json(species);
  });

  app.get("/api/community/locations", async (_req, res) => {
    const locations = await storage.getDistinctLocations();
    res.json(locations);
  });

  app.get("/api/community/leaderboard", async (req, res) => {
    const species = req.query.species as string;
    if (!species) return res.status(400).json({ message: "species query param required" });
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);
    const region = (req.query.region as string) || undefined;

    const result = await storage.getSpeciesLeaderboard({ species, region, limit, offset });

    const top10 = await storage.getTop10ForSpecies(species);
    const entries = result.entries.map(e => ({
      ...e,
      badge: top10.get(e.trophyId) || null,
    }));

    res.json({ entries, total: result.total });
  });

  app.get("/api/community/room/:userId", async (req, res) => {
    const data = await storage.getUserPublic(req.params.userId as string);
    if (!data) return res.status(404).json({ message: "Room not found or is private" });
    const rawTrophies = await storage.getPublicTrophies(req.params.userId as string);
    const rating = await storage.getRoomRating(req.params.userId as string);

    const safeTrophies = rawTrophies.map(t => ({
      id: t.id,
      species: t.species,
      name: t.name,
      date: t.date,
      location: t.location,
      score: t.score,
      gender: t.gender,
      imageUrl: t.imageUrl,
      glbUrl: t.glbUrl,
      glbPreviewUrl: t.glbPreviewUrl,
      usdzUrl: t.usdzUrl,
      mountType: t.mountType,
      featured: t.featured,
      huntNotes: t.huntNotes,
    }));

    const safeUser = {
      id: data.user.id,
      firstName: data.user.firstName,
      lastName: data.user.lastName,
      profileImageUrl: data.user.profileImageUrl,
    };

    const speciesSet = new Set(rawTrophies.map(t => t.species));
    const badgeMap: Record<string, { rank: number; badge: string } | null> = {};
    for (const sp of speciesSet) {
      const top10 = await storage.getTop10ForSpecies(sp);
      for (const trophy of rawTrophies) {
        if (trophy.species === sp && top10.has(trophy.id)) {
          badgeMap[trophy.id] = top10.get(trophy.id)!;
        }
      }
    }

    const trophiesWithBadges = safeTrophies.map(t => ({
      ...t,
      badge: badgeMap[t.id] || null,
    }));

    const safePreferences = {
      theme: data.preferences?.theme || "lodge",
    };

    res.json({
      user: safeUser,
      preferences: safePreferences,
      trophies: trophiesWithBadges,
      rating,
    });
  });

  app.post("/api/community/rate", isAuthenticated, async (req, res) => {
    const parsed = insertRoomRatingSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
    const raterId = getUserId(req);
    if (raterId === parsed.data.roomOwnerId) return res.status(400).json({ message: "Cannot rate your own room" });
    const isPublic = await storage.isRoomPublic(parsed.data.roomOwnerId);
    if (!isPublic) return res.status(404).json({ message: "Room not found or is private" });
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

    const accountTier = prefs?.accountTier || "free";

    const leaderboardBadges: { species: string; rank: number; badge: "gold" | "silver" | "bronze" | "top10" }[] = [];
    const speciesList = Array.from(uniqueSpecies);
    for (const species of speciesList) {
      const top10 = await storage.getTop10ForSpecies(species);
      const userTrophiesForSpecies = allTrophies.filter(t => t.species === species);
      let bestEntry: { rank: number; badge: "gold" | "silver" | "bronze" | "top10" } | null = null;
      for (const t of userTrophiesForSpecies) {
        const entry = top10.get(t.id);
        if (entry && (bestEntry === null || entry.rank < bestEntry.rank)) {
          bestEntry = entry;
        }
      }
      if (bestEntry) {
        leaderboardBadges.push({ species, rank: bestEntry.rank, badge: bestEntry.badge });
      }
    }

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
      accountTier,
      leaderboardBadges,
    });
  });

  return httpServer;
}
