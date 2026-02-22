import {
  users, weapons, trophies, userPreferences, roomRatings,
  type Weapon, type InsertWeapon,
  type Trophy, type InsertTrophy,
  type UserPreferences, type InsertPreferences,
  type RoomRating, type InsertRoomRating,
  type User,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, avg, count } from "drizzle-orm";

export interface IStorage {
  // Weapons
  getWeapons(userId: string): Promise<Weapon[]>;
  getWeapon(id: string, userId: string): Promise<Weapon | undefined>;
  createWeapon(userId: string, weapon: InsertWeapon): Promise<Weapon>;
  updateWeapon(id: string, userId: string, weapon: Partial<InsertWeapon>): Promise<Weapon | undefined>;
  deleteWeapon(id: string, userId: string): Promise<boolean>;

  // Trophies
  getTrophies(userId: string): Promise<Trophy[]>;
  getTrophy(id: string, userId: string): Promise<Trophy | undefined>;
  createTrophy(userId: string, trophy: InsertTrophy): Promise<Trophy>;
  updateTrophy(id: string, userId: string, trophy: Partial<InsertTrophy>): Promise<Trophy | undefined>;
  deleteTrophy(id: string, userId: string): Promise<boolean>;

  // Preferences
  getPreferences(userId: string): Promise<UserPreferences | undefined>;
  upsertPreferences(userId: string, prefs: Partial<InsertPreferences>): Promise<UserPreferences>;

  // Room Ratings
  getRoomRating(roomOwnerId: string): Promise<{ avgScore: number; totalRatings: number }>;
  rateRoom(raterId: string, rating: InsertRoomRating): Promise<RoomRating>;
  getPublicRooms(): Promise<{ userId: string; firstName: string | null; lastName: string | null; profileImageUrl: string | null; theme: string | null; avgScore: number; totalRatings: number; trophyCount: number }[]>;

  // Public trophy room
  getPublicTrophies(userId: string): Promise<Trophy[]>;
  getUserPublic(userId: string): Promise<{ user: User; preferences: UserPreferences | null } | undefined>;
}

export class DatabaseStorage implements IStorage {
  // Weapons
  async getWeapons(userId: string): Promise<Weapon[]> {
    return db.select().from(weapons).where(eq(weapons.userId, userId)).orderBy(desc(weapons.createdAt));
  }

  async getWeapon(id: string, userId: string): Promise<Weapon | undefined> {
    const [weapon] = await db.select().from(weapons).where(and(eq(weapons.id, id), eq(weapons.userId, userId)));
    return weapon;
  }

  async createWeapon(userId: string, weapon: InsertWeapon): Promise<Weapon> {
    const [created] = await db.insert(weapons).values({ ...weapon, userId }).returning();
    return created;
  }

  async updateWeapon(id: string, userId: string, weapon: Partial<InsertWeapon>): Promise<Weapon | undefined> {
    const [updated] = await db.update(weapons).set(weapon).where(and(eq(weapons.id, id), eq(weapons.userId, userId))).returning();
    return updated;
  }

  async deleteWeapon(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(weapons).where(and(eq(weapons.id, id), eq(weapons.userId, userId))).returning();
    return result.length > 0;
  }

  // Trophies
  async getTrophies(userId: string): Promise<Trophy[]> {
    return db.select().from(trophies).where(eq(trophies.userId, userId)).orderBy(desc(trophies.createdAt));
  }

  async getTrophy(id: string, userId: string): Promise<Trophy | undefined> {
    const [trophy] = await db.select().from(trophies).where(and(eq(trophies.id, id), eq(trophies.userId, userId)));
    return trophy;
  }

  async createTrophy(userId: string, trophy: InsertTrophy): Promise<Trophy> {
    const [created] = await db.insert(trophies).values({ ...trophy, userId }).returning();
    return created;
  }

  async updateTrophy(id: string, userId: string, trophy: Partial<InsertTrophy>): Promise<Trophy | undefined> {
    const [updated] = await db.update(trophies).set(trophy).where(and(eq(trophies.id, id), eq(trophies.userId, userId))).returning();
    return updated;
  }

  async deleteTrophy(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(trophies).where(and(eq(trophies.id, id), eq(trophies.userId, userId))).returning();
    return result.length > 0;
  }

  // Preferences
  async getPreferences(userId: string): Promise<UserPreferences | undefined> {
    const [prefs] = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId));
    return prefs;
  }

  async upsertPreferences(userId: string, prefs: Partial<InsertPreferences>): Promise<UserPreferences> {
    const [result] = await db
      .insert(userPreferences)
      .values({ ...prefs, userId })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: prefs,
      })
      .returning();
    return result;
  }

  // Room Ratings
  async getRoomRating(roomOwnerId: string): Promise<{ avgScore: number; totalRatings: number }> {
    const [result] = await db
      .select({
        avgScore: avg(roomRatings.score),
        totalRatings: count(roomRatings.id),
      })
      .from(roomRatings)
      .where(eq(roomRatings.roomOwnerId, roomOwnerId));
    return {
      avgScore: result?.avgScore ? parseFloat(result.avgScore) : 0,
      totalRatings: result?.totalRatings || 0,
    };
  }

  async rateRoom(raterId: string, rating: InsertRoomRating): Promise<RoomRating> {
    // Upsert: one rating per rater per room
    const existing = await db
      .select()
      .from(roomRatings)
      .where(and(eq(roomRatings.roomOwnerId, rating.roomOwnerId), eq(roomRatings.raterId, raterId)));

    if (existing.length > 0) {
      const [updated] = await db
        .update(roomRatings)
        .set({ score: rating.score })
        .where(and(eq(roomRatings.roomOwnerId, rating.roomOwnerId), eq(roomRatings.raterId, raterId)))
        .returning();
      return updated;
    }

    const [created] = await db.insert(roomRatings).values({ ...rating, raterId }).returning();
    return created;
  }

  async getPublicRooms(): Promise<any[]> {
    const publicPrefs = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.roomVisibility, "public"));

    const rooms = [];
    for (const pref of publicPrefs) {
      const [user] = await db.select().from(users).where(eq(users.id, pref.userId));
      if (!user) continue;

      const rating = await this.getRoomRating(pref.userId);
      const trophyList = await db.select().from(trophies).where(eq(trophies.userId, pref.userId));

      rooms.push({
        userId: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        theme: pref.theme,
        avgScore: rating.avgScore,
        totalRatings: rating.totalRatings,
        trophyCount: trophyList.length,
      });
    }
    return rooms;
  }

  // Public trophy room
  async getPublicTrophies(userId: string): Promise<Trophy[]> {
    const [prefs] = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId));
    if (!prefs || prefs.roomVisibility !== "public") return [];
    return db.select().from(trophies).where(eq(trophies.userId, userId)).orderBy(desc(trophies.createdAt));
  }

  async getUserPublic(userId: string): Promise<{ user: User; preferences: UserPreferences | null } | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return undefined;
    const [prefs] = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId));
    if (!prefs || prefs.roomVisibility !== "public") return undefined;
    return { user, preferences: prefs };
  }
}

export const storage = new DatabaseStorage();
