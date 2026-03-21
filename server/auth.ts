import type { Express, RequestHandler } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { z } from "zod";
import { db } from "./db";
import { users, authTokens } from "@shared/schema";
import { eq, and, lte } from "drizzle-orm";
import { storage } from "./storage";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  referralCode: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const TOKEN_TTL = 7 * 24 * 60 * 60 * 1000;

async function generateAuthToken(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_TTL);
  await db.insert(authTokens).values({ token, userId, expiresAt });
  return token;
}

export async function validateAuthToken(token: string): Promise<string | null> {
  const [entry] = await db.select().from(authTokens).where(eq(authTokens.token, token));
  if (!entry) return null;
  if (new Date() > entry.expiresAt) {
    await db.delete(authTokens).where(eq(authTokens.token, token));
    return null;
  }
  return entry.userId;
}

export async function invalidateAuthToken(token: string): Promise<void> {
  await db.delete(authTokens).where(eq(authTokens.token, token));
}

export async function invalidateUserTokens(userId: string): Promise<void> {
  await db.delete(authTokens).where(eq(authTokens.userId, userId));
}

setInterval(async () => {
  try {
    await db.delete(authTokens).where(lte(authTokens.expiresAt, new Date()));
  } catch (err) {
    console.error("Token cleanup error:", err);
  }
}, 60 * 60 * 1000);

function saveSession(req: any): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.save((err: any) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function isGoogleConfigured(): boolean {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

function isAppleConfigured(): boolean {
  return !!(process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY);
}

function getBaseUrl(req: any): string {
  const protocol = req.protocol;
  const host = req.get("host");
  return `${protocol}://${host}`;
}

async function findOrCreateOAuthUser(
  email: string,
  firstName: string | null,
  lastName: string | null,
  provider: string,
  providerId: string,
  profileImageUrl?: string | null,
): Promise<{ user: typeof users.$inferSelect; isNew: boolean }> {
  const [existingByProvider] = await db
    .select()
    .from(users)
    .where(and(eq(users.authProvider, provider), eq(users.authProviderId, providerId)));

  if (existingByProvider) {
    const [updated] = await db
      .update(users)
      .set({
        updatedAt: new Date(),
        ...(firstName && !existingByProvider.firstName ? { firstName } : {}),
        ...(lastName && !existingByProvider.lastName ? { lastName } : {}),
        ...(profileImageUrl && !existingByProvider.profileImageUrl ? { profileImageUrl } : {}),
      })
      .where(eq(users.id, existingByProvider.id))
      .returning();
    return { user: updated, isNew: false };
  }

  const [existingByEmail] = await db.select().from(users).where(eq(users.email, email));

  if (existingByEmail) {
    const [updated] = await db
      .update(users)
      .set({
        authProvider: provider,
        authProviderId: providerId,
        ...(firstName && !existingByEmail.firstName ? { firstName } : {}),
        ...(lastName && !existingByEmail.lastName ? { lastName } : {}),
        ...(profileImageUrl && !existingByEmail.profileImageUrl ? { profileImageUrl } : {}),
        updatedAt: new Date(),
      })
      .where(eq(users.id, existingByEmail.id))
      .returning();
    return { user: updated, isNew: false };
  }

  const [newUser] = await db
    .insert(users)
    .values({
      email,
      firstName,
      lastName,
      authProvider: provider,
      authProviderId: providerId,
      profileImageUrl: profileImageUrl || null,
    })
    .returning();
  return { user: newUser, isNew: true };
}

export function registerEmailAuthRoutes(app: Express) {
  app.get("/api/auth/providers", (_req, res) => {
    res.json({
      google: isGoogleConfigured(),
      apple: isAppleConfigured(),
    });
  });

  app.post("/api/auth/token", async (req, res) => {
    const session = req.session as any;
    if (!session?.userId || !["email", "google", "apple"].includes(session?.authProvider)) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const [user] = await db.select().from(users).where(eq(users.id, session.userId));
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const authToken = await generateAuthToken(user.id);
    res.json({ authToken });
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      }

      const { email, password, firstName, lastName, referralCode } = parsed.data;

      const [existing] = await db.select().from(users).where(eq(users.email, email));
      if (existing) {
        return res.status(409).json({ message: "An account with this email already exists" });
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const [user] = await db.insert(users).values({
        email,
        firstName,
        lastName,
        passwordHash,
        authProvider: "email",
      }).returning();

      (req.session as any).userId = user.id;
      (req.session as any).authProvider = "email";

      await saveSession(req);

      if (referralCode) {
        try {
          const proProfile = await storage.getProProfileByReferralCode(referralCode);
          if (proProfile) {
            await storage.createReferral(proProfile.userId, referralCode, user.id);
          }
        } catch (err) {
          console.error("Referral tracking error:", err);
        }
      }

      const authToken = await generateAuthToken(user.id);

      res.status(201).json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        authToken,
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid email or password" });
      }

      const { email, password } = parsed.data;

      const [user] = await db.select().from(users).where(eq(users.email, email));
      if (!user || !user.passwordHash) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      (req.session as any).userId = user.id;
      (req.session as any).authProvider = "email";

      await saveSession(req);

      const authToken = await generateAuthToken(user.id);

      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        authToken,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.get("/api/auth/google", (req, res) => {
    if (!isGoogleConfigured()) {
      return res.status(501).json({ message: "Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET." });
    }

    const state = crypto.randomBytes(16).toString("hex");
    (req.session as any).oauthState = state;

    const baseUrl = getBaseUrl(req);
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      redirect_uri: `${baseUrl}/api/auth/google/callback`,
      response_type: "code",
      scope: "openid email profile",
      state,
      access_type: "offline",
      prompt: "select_account",
    });

    req.session.save(() => {
      res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
    });
  });

  app.get("/api/auth/google/callback", async (req, res) => {
    try {
      if (!isGoogleConfigured()) {
        return res.status(501).json({ message: "Google OAuth not configured." });
      }

      const { code, state } = req.query;
      const sessionState = (req.session as any).oauthState;

      if (!code || !state || state !== sessionState) {
        return res.redirect("/login?error=invalid_state");
      }

      delete (req.session as any).oauthState;

      const baseUrl = getBaseUrl(req);
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code: code as string,
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          redirect_uri: `${baseUrl}/api/auth/google/callback`,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenResponse.ok) {
        console.error("Google token exchange failed:", await tokenResponse.text());
        return res.redirect("/login?error=token_exchange_failed");
      }

      const tokenData = await tokenResponse.json() as { access_token: string };

      const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });

      if (!userInfoResponse.ok) {
        console.error("Google userinfo failed:", await userInfoResponse.text());
        return res.redirect("/login?error=userinfo_failed");
      }

      const googleUser = await userInfoResponse.json() as {
        id: string;
        email: string;
        verified_email?: boolean;
        given_name?: string;
        family_name?: string;
        picture?: string;
      };

      if (!googleUser.email || !googleUser.verified_email) {
        return res.redirect("/login?error=no_email");
      }

      const { user, isNew } = await findOrCreateOAuthUser(
        googleUser.email,
        googleUser.given_name || null,
        googleUser.family_name || null,
        "google",
        googleUser.id,
        googleUser.picture,
      );

      (req.session as any).userId = user.id;
      (req.session as any).authProvider = "google";
      await saveSession(req);

      res.redirect(`/?oauth=success${isNew ? "&newUser=true" : ""}`);
    } catch (error) {
      console.error("Google OAuth callback error:", error);
      res.redirect("/login?error=oauth_failed");
    }
  });

  app.get("/api/auth/apple", (req, res) => {
    if (!isAppleConfigured()) {
      return res.status(501).json({ message: "Apple Sign In not configured. Set APPLE_CLIENT_ID, APPLE_TEAM_ID, APPLE_KEY_ID, and APPLE_PRIVATE_KEY." });
    }

    const state = crypto.randomBytes(16).toString("hex");
    (req.session as any).oauthState = state;

    const baseUrl = getBaseUrl(req);
    const params = new URLSearchParams({
      client_id: process.env.APPLE_CLIENT_ID!,
      redirect_uri: `${baseUrl}/api/auth/apple/callback`,
      response_type: "code id_token",
      scope: "name email",
      state,
      response_mode: "form_post",
    });

    req.session.save(() => {
      res.redirect(`https://appleid.apple.com/auth/authorize?${params.toString()}`);
    });
  });

  app.post("/api/auth/apple/callback", async (req, res) => {
    try {
      if (!isAppleConfigured()) {
        return res.status(501).json({ message: "Apple Sign In not configured." });
      }

      const { code, state, id_token: idToken, user: appleUserData } = req.body;
      const sessionState = (req.session as any).oauthState;

      if (!state || state !== sessionState) {
        return res.redirect("/login?error=invalid_state");
      }

      delete (req.session as any).oauthState;

      if (!idToken && !code) {
        return res.redirect("/login?error=no_token");
      }

      const appleSignin = await import("apple-signin-auth");

      const clientSecret = appleSignin.default.getClientSecret({
        clientID: process.env.APPLE_CLIENT_ID!,
        teamID: process.env.APPLE_TEAM_ID!,
        keyIdentifier: process.env.APPLE_KEY_ID!,
        privateKey: process.env.APPLE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
      });

      let tokenPayload: { sub: string; email?: string };

      if (idToken) {
        tokenPayload = await appleSignin.default.verifyIdToken(idToken, {
          audience: process.env.APPLE_CLIENT_ID!,
          ignoreExpiration: false,
        }) as { sub: string; email?: string };
      } else {
        const baseUrl = getBaseUrl(req);
        const tokenResponse = await fetch("https://appleid.apple.com/auth/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: process.env.APPLE_CLIENT_ID!,
            client_secret: clientSecret,
            code: code as string,
            grant_type: "authorization_code",
            redirect_uri: `${baseUrl}/api/auth/apple/callback`,
          }),
        });

        if (!tokenResponse.ok) {
          console.error("Apple token exchange failed:", await tokenResponse.text());
          return res.redirect("/login?error=token_exchange_failed");
        }

        const tokenData = await tokenResponse.json() as { id_token: string };
        tokenPayload = await appleSignin.default.verifyIdToken(tokenData.id_token, {
          audience: process.env.APPLE_CLIENT_ID!,
          ignoreExpiration: false,
        }) as { sub: string; email?: string };
      }

      const [existingByProvider] = await db
        .select()
        .from(users)
        .where(and(eq(users.authProvider, "apple"), eq(users.authProviderId, tokenPayload.sub)));

      let user: typeof users.$inferSelect;
      let isNew = false;

      if (existingByProvider) {
        user = existingByProvider;
      } else if (tokenPayload.email) {
        let firstName: string | null = null;
        let lastName: string | null = null;

        if (appleUserData) {
          try {
            const parsed = typeof appleUserData === "string" ? JSON.parse(appleUserData) : appleUserData;
            firstName = parsed.name?.firstName || null;
            lastName = parsed.name?.lastName || null;
          } catch (parseErr) {
            console.warn("Failed to parse Apple user data:", parseErr);
          }
        }

        const result = await findOrCreateOAuthUser(
          tokenPayload.email,
          firstName,
          lastName,
          "apple",
          tokenPayload.sub,
        );
        user = result.user;
        isNew = result.isNew;
      } else {
        return res.redirect("/login?error=no_email");
      }

      (req.session as any).userId = user.id;
      (req.session as any).authProvider = "apple";
      await saveSession(req);

      res.redirect(`/?oauth=success${isNew ? "&newUser=true" : ""}`);
    } catch (error) {
      console.error("Apple Sign In callback error:", error);
      res.redirect("/login?error=oauth_failed");
    }
  });
}
