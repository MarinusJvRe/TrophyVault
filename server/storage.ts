import {
  users, weapons, trophies, userPreferences, roomRatings,
  proProfiles, referrals, usageLedger, follows, trophyApplauds,
  groups, groupMembers, groupInvites, groupTrophies,
  type Weapon, type InsertWeapon,
  type Trophy, type InsertTrophy,
  type UserPreferences, type InsertPreferences,
  type RoomRating, type InsertRoomRating,
  type ProProfile, type InsertProProfile,
  type UsageLedgerEntry,
  type Referral,
  type User,
  type Follow,
  type TrophyApplaud,
  type Group, type InsertGroup,
  type GroupMember,
  type GroupInvite,
  type GroupTrophy, type InsertGroupTrophy,
  AI_COSTS,
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, desc, sql, avg, count, gte, or, ilike, asc, inArray } from "drizzle-orm";
import crypto from "crypto";

export interface IStorage {
  getWeapons(userId: string): Promise<Weapon[]>;
  getWeapon(id: string, userId: string): Promise<Weapon | undefined>;
  createWeapon(userId: string, weapon: InsertWeapon): Promise<Weapon>;
  updateWeapon(id: string, userId: string, weapon: Partial<InsertWeapon>): Promise<Weapon | undefined>;
  deleteWeapon(id: string, userId: string): Promise<boolean>;

  getTrophies(userId: string): Promise<Trophy[]>;
  getTrophy(id: string, userId: string): Promise<Trophy | undefined>;
  createTrophy(userId: string, trophy: InsertTrophy): Promise<Trophy>;
  updateTrophy(id: string, userId: string, trophy: Partial<InsertTrophy>): Promise<Trophy | undefined>;
  deleteTrophy(id: string, userId: string): Promise<boolean>;

  getPreferences(userId: string): Promise<UserPreferences | undefined>;
  upsertPreferences(userId: string, prefs: Partial<InsertPreferences>): Promise<UserPreferences>;

  getRoomRating(roomOwnerId: string): Promise<{ avgScore: number; totalRatings: number }>;
  rateRoom(raterId: string, rating: InsertRoomRating): Promise<RoomRating>;
  isRoomPublic(userId: string): Promise<boolean>;

  getPublicRooms(options?: {
    limit?: number;
    offset?: number;
    search?: string;
    sort?: "rating" | "trophies" | "newest" | "ratings";
  }): Promise<{
    rooms: { userId: string; firstName: string | null; lastName: string | null; profileImageUrl: string | null; theme: string | null; avgScore: number; totalRatings: number; trophyCount: number; createdAt: Date | null }[];
    total: number;
  }>;

  getPublicTrophies(userId: string): Promise<Trophy[]>;
  getUserPublic(userId: string): Promise<{ user: User; preferences: UserPreferences | null } | undefined>;

  getSpeciesLeaderboard(options: {
    species: string;
    region?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    entries: {
      trophyId: string;
      trophyName: string;
      species: string;
      score: string;
      numericScore: number;
      location: string | null;
      imageUrl: string | null;
      glbPreviewUrl: string | null;
      date: string;
      userId: string;
      firstName: string | null;
      lastName: string | null;
      profileImageUrl: string | null;
      rank: number;
    }[];
    total: number;
  }>;

  getDistinctSpeciesWithScores(): Promise<string[]>;
  getDistinctLocations(): Promise<string[]>;

  getTop10ForSpecies(species: string): Promise<Map<string, { rank: number; badge: "gold" | "silver" | "bronze" | "top10" }>>;

  patchTrophyGlb(imageUrl: string, glbUrl: string, glbPreviewUrl: string | null, mountType: string | null, usdzUrl?: string | null, renderImageUrl?: string | null): Promise<void>;
  patchTrophyRenderImage(imageUrl: string, renderImageUrl: string): Promise<void>;

  // Pro profiles
  getProProfile(userId: string): Promise<ProProfile | undefined>;
  getProProfileByReferralCode(code: string): Promise<ProProfile | undefined>;
  createProProfile(userId: string, profile: InsertProProfile): Promise<ProProfile>;
  updateProProfile(userId: string, profile: Partial<InsertProProfile>): Promise<ProProfile | undefined>;
  searchProUsers(query: string): Promise<{ userId: string; firstName: string | null; lastName: string | null; businessName: string; entityType: string; profileImageUrl: string | null }[]>;

  // Referrals
  createReferral(proUserId: string, referralCode: string, referredUserId?: string): Promise<Referral>;
  getReferralsByProUser(proUserId: string): Promise<Referral[]>;
  convertReferral(referralId: string, referredUserId: string): Promise<Referral | undefined>;
  getReferralStats(proUserId: string): Promise<{ totalReferrals: number; convertedReferrals: number; pendingPayout: number }>;

  // Usage ledger
  logUsage(userId: string, actionType: string, estimatedCost: number, description?: string): Promise<UsageLedgerEntry>;
  getMonthlyUsage(userId: string): Promise<{ totalCost: number; aiAnalyses: number; models3d: number; renders: number }>;
  getLifetimeUsageCounts(userId: string): Promise<{ aiAnalyses: number; models3d: number }>;

  // Pro tagging
  getTrophiesTaggingPro(proUserId: string): Promise<Trophy[]>;
  getTagStats(proUserId: string): Promise<{ totalTags: number; recentTags: Trophy[] }>;

  getFollowStatus(viewerId: string, ownerId: string): Promise<"none" | "pending" | "following">;
  getUserRoomData(userId: string): Promise<{ user: User; preferences: UserPreferences | null; trophies: Trophy[] } | undefined>;
  getTrophyPublic(trophyId: string, ownerId: string): Promise<Trophy | undefined>;

  // Follows
  followUser(followerId: string, followedId: string): Promise<Follow>;
  unfollowUser(followerId: string, followedId: string): Promise<boolean>;
  getFollowing(userId: string): Promise<string[]>;
  isFollowing(followerId: string, followedId: string): Promise<boolean>;

  // Trophy applauds
  applaudTrophy(userId: string, trophyId: string): Promise<TrophyApplaud>;
  unApplaudTrophy(userId: string, trophyId: string): Promise<boolean>;
  getApplaudCount(trophyId: string): Promise<number>;
  hasApplauded(userId: string, trophyId: string): Promise<boolean>;
  getApplaudCounts(trophyIds: string[]): Promise<Map<string, number>>;
  getUserApplauds(userId: string, trophyIds: string[]): Promise<Set<string>>;

  // Groups
  createGroup(adminUserId: string, data: InsertGroup): Promise<Group>;
  deleteGroup(groupId: string, adminUserId: string): Promise<boolean>;
  getGroup(groupId: string, requestingUserId: string): Promise<Group | undefined>;
  getUserGroups(userId: string): Promise<(Group & { memberCount: number; trophyCount: number; memberPreviews: { id: string; firstName: string | null; profileImageUrl: string | null }[] })[]>;
  getGroupMembers(groupId: string, requestingUserId: string): Promise<(GroupMember & { user: { id: string; firstName: string | null; lastName: string | null; profileImageUrl: string | null } })[]>;
  isGroupMember(groupId: string, userId: string): Promise<boolean>;
  isGroupAdmin(groupId: string, userId: string): Promise<boolean>;

  // Group invites
  createGroupInvite(groupId: string, invitedByUserId: string, invitedUserId: string): Promise<GroupInvite>;
  getUserPendingInvites(userId: string): Promise<(GroupInvite & { group: Group; invitedBy: { id: string; firstName: string | null; lastName: string | null } })[]>;
  respondToGroupInvite(inviteId: string, userId: string, accept: boolean): Promise<GroupInvite | undefined>;

  // Group trophies
  addGroupTrophy(groupId: string, trophyId: string, sharedByUserId: string, assignedToUserId?: string | null): Promise<GroupTrophy>;
  removeGroupTrophy(groupId: string, trophyId: string): Promise<boolean>;
  getGroupTrophies(groupId: string, requestingUserId: string): Promise<(GroupTrophy & { trophy: Trophy })[]>;

  // Trophy feed
  getTrophyFeed(options: {
    mode: "global" | "following";
    userId?: string;
    species?: string;
    region?: string;
    sort?: "newest" | "most_applauded" | "highest_score";
    limit?: number;
    offset?: number;
  }): Promise<{
    items: {
      trophy: Trophy;
      user: { id: string; firstName: string | null; lastName: string | null; profileImageUrl: string | null };
      applaudCount: number;
      score: string | null;
    }[];
    total: number;
  }>;
}

const numericScoreExpr = sql<number>`
  CASE
    WHEN ${trophies.score} IS NULL OR TRIM(${trophies.score}) = '' THEN NULL
    ELSE (
      regexp_replace(
        regexp_replace(${trophies.score}, '[^0-9./]', '', 'g'),
        '/.*$', '', 'g'
      )
    )::numeric
  END
`;

export class DatabaseStorage implements IStorage {
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

  async isRoomPublic(userId: string): Promise<boolean> {
    const [prefs] = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId));
    return prefs?.roomVisibility === "public";
  }

  async getPublicRooms(options?: {
    limit?: number;
    offset?: number;
    search?: string;
    sort?: "rating" | "trophies" | "newest" | "ratings";
  }): Promise<{
    rooms: any[];
    total: number;
  }> {
    const limit = options?.limit ?? 20;
    const offset = options?.offset ?? 0;
    const search = options?.search;
    const sort = options?.sort ?? "rating";

    const conditions = [eq(userPreferences.roomVisibility, "public")];
    if (search) {
      conditions.push(
        or(
          ilike(users.firstName, `%${search}%`),
          ilike(users.lastName, `%${search}%`)
        )!
      );
    }

    const trophyCountSq = db
      .select({
        userId: trophies.userId,
        cnt: count(trophies.id).as("cnt"),
      })
      .from(trophies)
      .groupBy(trophies.userId)
      .as("trophy_counts");

    const ratingSq = db
      .select({
        roomOwnerId: roomRatings.roomOwnerId,
        avgScore: avg(roomRatings.score).as("avg_score"),
        totalRatings: count(roomRatings.id).as("total_ratings"),
      })
      .from(roomRatings)
      .groupBy(roomRatings.roomOwnerId)
      .as("rating_agg");

    const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

    const [countResult] = await db
      .select({ total: count(users.id) })
      .from(users)
      .innerJoin(userPreferences, eq(users.id, userPreferences.userId))
      .where(whereClause);

    const total = countResult?.total ?? 0;

    let orderClause;
    if (sort === "trophies") {
      orderClause = sql`COALESCE(${trophyCountSq.cnt}, 0) DESC`;
    } else if (sort === "newest") {
      orderClause = sql`${users.createdAt} DESC NULLS LAST`;
    } else if (sort === "ratings") {
      orderClause = sql`COALESCE(${ratingSq.totalRatings}, 0) DESC`;
    } else {
      orderClause = sql`COALESCE(${ratingSq.avgScore}, '0') DESC`;
    }

    const rows = await db
      .select({
        userId: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        theme: userPreferences.theme,
        createdAt: users.createdAt,
        avgScore: ratingSq.avgScore,
        totalRatings: ratingSq.totalRatings,
        trophyCount: trophyCountSq.cnt,
      })
      .from(users)
      .innerJoin(userPreferences, eq(users.id, userPreferences.userId))
      .leftJoin(trophyCountSq, eq(users.id, trophyCountSq.userId))
      .leftJoin(ratingSq, eq(users.id, ratingSq.roomOwnerId))
      .where(whereClause)
      .orderBy(orderClause)
      .limit(limit)
      .offset(offset);

    const rooms = rows.map(r => ({
      userId: r.userId,
      firstName: r.firstName,
      lastName: r.lastName,
      profileImageUrl: r.profileImageUrl,
      theme: r.theme,
      createdAt: r.createdAt,
      avgScore: r.avgScore ? parseFloat(r.avgScore as string) : 0,
      totalRatings: r.totalRatings ?? 0,
      trophyCount: r.trophyCount ?? 0,
    }));

    return { rooms, total };
  }

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

  async getSpeciesLeaderboard(options: {
    species: string;
    region?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    entries: any[];
    total: number;
  }> {
    const limit = options.limit ?? 20;
    const offset = options.offset ?? 0;

    const conditions = [
      eq(trophies.species, options.species),
      sql`${trophies.score} IS NOT NULL AND TRIM(${trophies.score}) != ''`,
      eq(userPreferences.roomVisibility, "public"),
    ];

    if (options.region) {
      conditions.push(ilike(trophies.location, `%${options.region}%`));
    }

    const whereClause = and(...conditions);

    const [countResult] = await db
      .select({ total: count(trophies.id) })
      .from(trophies)
      .innerJoin(userPreferences, eq(trophies.userId, userPreferences.userId))
      .where(whereClause);

    const total = countResult?.total ?? 0;

    const rows = await db
      .select({
        trophyId: trophies.id,
        trophyName: trophies.name,
        species: trophies.species,
        score: trophies.score,
        numericScore: numericScoreExpr,
        location: trophies.location,
        imageUrl: trophies.imageUrl,
        glbPreviewUrl: trophies.glbPreviewUrl,
        date: trophies.date,
        userId: trophies.userId,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
      })
      .from(trophies)
      .innerJoin(users, eq(trophies.userId, users.id))
      .innerJoin(userPreferences, eq(trophies.userId, userPreferences.userId))
      .where(whereClause)
      .orderBy(sql`${numericScoreExpr} DESC NULLS LAST`)
      .limit(limit)
      .offset(offset);

    const entries = rows.map((r, i) => ({
      ...r,
      numericScore: r.numericScore ?? 0,
      rank: offset + i + 1,
    }));

    return { entries, total };
  }

  async getDistinctSpeciesWithScores(): Promise<string[]> {
    const rows = await db
      .selectDistinct({ species: trophies.species })
      .from(trophies)
      .innerJoin(userPreferences, eq(trophies.userId, userPreferences.userId))
      .where(
        and(
          sql`${trophies.score} IS NOT NULL AND TRIM(${trophies.score}) != ''`,
          eq(userPreferences.roomVisibility, "public")
        )
      )
      .orderBy(asc(trophies.species));
    return rows.map(r => r.species);
  }

  async getDistinctLocations(): Promise<string[]> {
    const rows = await db
      .selectDistinct({ location: trophies.location })
      .from(trophies)
      .innerJoin(userPreferences, eq(trophies.userId, userPreferences.userId))
      .where(
        and(
          sql`${trophies.location} IS NOT NULL AND TRIM(${trophies.location}) != ''`,
          eq(userPreferences.roomVisibility, "public")
        )
      )
      .orderBy(asc(trophies.location));
    return rows.map(r => r.location!);
  }

  async getTop10ForSpecies(species: string): Promise<Map<string, { rank: number; badge: "gold" | "silver" | "bronze" | "top10" }>> {
    const rows = await db
      .select({
        trophyId: trophies.id,
        numericScore: numericScoreExpr,
      })
      .from(trophies)
      .innerJoin(userPreferences, eq(trophies.userId, userPreferences.userId))
      .where(
        and(
          eq(trophies.species, species),
          sql`${trophies.score} IS NOT NULL AND TRIM(${trophies.score}) != ''`,
          eq(userPreferences.roomVisibility, "public")
        )
      )
      .orderBy(sql`${numericScoreExpr} DESC NULLS LAST`)
      .limit(10);

    const result = new Map<string, { rank: number; badge: "gold" | "silver" | "bronze" | "top10" }>();
    rows.forEach((s, i) => {
      if (s.numericScore == null) return;
      const rank = i + 1;
      const badge = rank === 1 ? "gold" as const : rank === 2 ? "silver" as const : rank === 3 ? "bronze" as const : "top10" as const;
      result.set(s.trophyId, { rank, badge });
    });

    return result;
  }

  async patchTrophyGlb(imageUrl: string, glbUrl: string, glbPreviewUrl: string | null, mountType: string | null, usdzUrl?: string | null, renderImageUrl?: string | null): Promise<void> {
    const updates: Record<string, any> = { glbUrl };
    if (glbPreviewUrl) updates.glbPreviewUrl = glbPreviewUrl;
    if (mountType) updates.mountType = mountType;
    if (usdzUrl) updates.usdzUrl = usdzUrl;
    if (renderImageUrl) updates.renderImageUrl = renderImageUrl;
    await db.update(trophies).set(updates).where(eq(trophies.imageUrl, imageUrl));
  }

  async patchTrophyRenderImage(imageUrl: string, renderImageUrl: string): Promise<void> {
    await db.update(trophies).set({ renderImageUrl }).where(eq(trophies.imageUrl, imageUrl));
  }

  // Pro profiles
  async getProProfile(userId: string): Promise<ProProfile | undefined> {
    const [profile] = await db.select().from(proProfiles).where(eq(proProfiles.userId, userId));
    return profile;
  }

  async getProProfileByReferralCode(code: string): Promise<ProProfile | undefined> {
    const [profile] = await db.select().from(proProfiles).where(eq(proProfiles.referralCode, code));
    return profile;
  }

  async createProProfile(userId: string, profile: InsertProProfile): Promise<ProProfile> {
    const referralCode = crypto.randomBytes(6).toString("hex");
    const referralLink = `/join?ref=${referralCode}`;
    const [created] = await db.insert(proProfiles).values({
      ...profile,
      userId,
      referralCode,
      referralLink,
    }).returning();

    await this.upsertPreferences(userId, {
      accountTier: "pro",
      userType: "professional",
    } as any);

    return created;
  }

  async updateProProfile(userId: string, profile: Partial<InsertProProfile>): Promise<ProProfile | undefined> {
    const [updated] = await db.update(proProfiles).set(profile).where(eq(proProfiles.userId, userId)).returning();
    return updated;
  }

  async searchProUsers(query: string): Promise<{ userId: string; firstName: string | null; lastName: string | null; businessName: string; entityType: string; profileImageUrl: string | null }[]> {
    const searchPattern = `%${query}%`;
    const profiles = await db.select().from(proProfiles).where(
      or(
        ilike(proProfiles.businessName, searchPattern),
        ilike(proProfiles.businessHandle, searchPattern),
      )
    ).limit(10);

    const results = [];
    for (const profile of profiles) {
      const [user] = await db.select().from(users).where(eq(users.id, profile.userId));
      if (user) {
        results.push({
          userId: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          businessName: profile.businessName,
          entityType: profile.entityType,
          profileImageUrl: user.profileImageUrl,
        });
      }
    }

    if (query.length >= 2) {
      const userMatches = await db.select().from(users).where(
        or(
          ilike(users.firstName, searchPattern),
          ilike(users.lastName, searchPattern),
        )
      ).limit(10);

      for (const user of userMatches) {
        if (results.some(r => r.userId === user.id)) continue;
        const [profile] = await db.select().from(proProfiles).where(eq(proProfiles.userId, user.id));
        if (profile) {
          results.push({
            userId: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            businessName: profile.businessName,
            entityType: profile.entityType,
            profileImageUrl: user.profileImageUrl,
          });
        }
      }
    }

    return results.slice(0, 10);
  }

  // Referrals
  async createReferral(proUserId: string, referralCode: string, referredUserId?: string): Promise<Referral> {
    const [created] = await db.insert(referrals).values({
      proUserId,
      referralCode,
      referredUserId: referredUserId || null,
      status: referredUserId ? "converted" : "pending",
      convertedAt: referredUserId ? new Date() : null,
    }).returning();
    return created;
  }

  async getReferralsByProUser(proUserId: string): Promise<Referral[]> {
    return db.select().from(referrals).where(eq(referrals.proUserId, proUserId)).orderBy(desc(referrals.createdAt));
  }

  async convertReferral(referralId: string, referredUserId: string): Promise<Referral | undefined> {
    const [updated] = await db.update(referrals).set({
      referredUserId,
      status: "converted",
      convertedAt: new Date(),
      payoutAmount: 5.00,
    }).where(eq(referrals.id, referralId)).returning();
    return updated;
  }

  async getReferralStats(proUserId: string): Promise<{ totalReferrals: number; convertedReferrals: number; pendingPayout: number }> {
    const allReferrals = await this.getReferralsByProUser(proUserId);
    const converted = allReferrals.filter(r => r.status === "converted");
    const pendingPayout = converted
      .filter(r => r.payoutStatus === "unpaid")
      .reduce((sum, r) => sum + (r.payoutAmount || 0), 0);
    return {
      totalReferrals: allReferrals.length,
      convertedReferrals: converted.length,
      pendingPayout,
    };
  }

  // Usage ledger
  async logUsage(userId: string, actionType: string, estimatedCost: number, description?: string): Promise<UsageLedgerEntry> {
    const [created] = await db.insert(usageLedger).values({
      userId,
      actionType,
      estimatedCost,
      description,
    }).returning();
    return created;
  }

  async getMonthlyUsage(userId: string): Promise<{ totalCost: number; aiAnalyses: number; models3d: number; renders: number }> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const entries = await db.select().from(usageLedger).where(
      and(
        eq(usageLedger.userId, userId),
        gte(usageLedger.createdAt, startOfMonth)
      )
    );

    let totalCost = 0;
    let aiAnalyses = 0;
    let models3d = 0;
    let renders = 0;

    for (const entry of entries) {
      totalCost += entry.estimatedCost;
      if (entry.actionType === "ai_analysis") aiAnalyses++;
      if (entry.actionType === "3d_model") models3d++;
    }

    return { totalCost, aiAnalyses, models3d, renders: 0 };
  }

  async getLifetimeUsageCounts(userId: string): Promise<{ aiAnalyses: number; models3d: number }> {
    const entries = await db.select().from(usageLedger).where(eq(usageLedger.userId, userId));
    let aiAnalyses = 0;
    let models3d = 0;
    for (const entry of entries) {
      if (entry.actionType === "ai_analysis") aiAnalyses++;
      if (entry.actionType === "3d_model") models3d++;
    }
    return { aiAnalyses, models3d };
  }

  // Pro tagging
  async getTrophiesTaggingPro(proUserId: string): Promise<Trophy[]> {
    return db.select().from(trophies).where(eq(trophies.taggedProUserId, proUserId)).orderBy(desc(trophies.createdAt));
  }

  async getTagStats(proUserId: string): Promise<{ totalTags: number; recentTags: Trophy[] }> {
    const allTags = await this.getTrophiesTaggingPro(proUserId);
    return {
      totalTags: allTags.length,
      recentTags: allTags.slice(0, 10),
    };
  }

  async getFollowStatus(viewerId: string, ownerId: string): Promise<"none" | "pending" | "following"> {
    const isFollow = await this.isFollowing(viewerId, ownerId);
    return isFollow ? "following" : "none";
  }

  async getUserRoomData(userId: string): Promise<{ user: User; preferences: UserPreferences | null; trophies: Trophy[] } | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return undefined;
    const [prefs] = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId));
    const userTrophies = await db.select().from(trophies).where(eq(trophies.userId, userId)).orderBy(desc(trophies.createdAt));
    return { user, preferences: prefs || null, trophies: userTrophies };
  }

  async getTrophyPublic(trophyId: string, ownerId: string): Promise<Trophy | undefined> {
    const [trophy] = await db.select().from(trophies).where(and(eq(trophies.id, trophyId), eq(trophies.userId, ownerId)));
    return trophy;
  }

  // Follows
  async followUser(followerId: string, followedId: string): Promise<Follow> {
    const existing = await db.select().from(follows).where(
      and(eq(follows.followerId, followerId), eq(follows.followedId, followedId))
    );
    if (existing.length > 0) return existing[0];
    const [created] = await db.insert(follows).values({ followerId, followedId }).returning();
    return created;
  }

  async unfollowUser(followerId: string, followedId: string): Promise<boolean> {
    const result = await db.delete(follows).where(
      and(eq(follows.followerId, followerId), eq(follows.followedId, followedId))
    ).returning();
    return result.length > 0;
  }

  async getFollowing(userId: string): Promise<string[]> {
    const rows = await db.select({ followedId: follows.followedId })
      .from(follows)
      .where(eq(follows.followerId, userId));
    return rows.map(r => r.followedId);
  }

  async isFollowing(followerId: string, followedId: string): Promise<boolean> {
    const [row] = await db.select().from(follows).where(
      and(eq(follows.followerId, followerId), eq(follows.followedId, followedId))
    );
    return !!row;
  }

  // Trophy applauds
  async applaudTrophy(userId: string, trophyId: string): Promise<TrophyApplaud> {
    const existing = await db.select().from(trophyApplauds).where(
      and(eq(trophyApplauds.userId, userId), eq(trophyApplauds.trophyId, trophyId))
    );
    if (existing.length > 0) return existing[0];
    const [created] = await db.insert(trophyApplauds).values({ userId, trophyId }).returning();
    return created;
  }

  async unApplaudTrophy(userId: string, trophyId: string): Promise<boolean> {
    const result = await db.delete(trophyApplauds).where(
      and(eq(trophyApplauds.userId, userId), eq(trophyApplauds.trophyId, trophyId))
    ).returning();
    return result.length > 0;
  }

  async getApplaudCount(trophyId: string): Promise<number> {
    const [result] = await db.select({ cnt: count(trophyApplauds.id) })
      .from(trophyApplauds)
      .where(eq(trophyApplauds.trophyId, trophyId));
    return result?.cnt ?? 0;
  }

  async hasApplauded(userId: string, trophyId: string): Promise<boolean> {
    const [row] = await db.select().from(trophyApplauds).where(
      and(eq(trophyApplauds.userId, userId), eq(trophyApplauds.trophyId, trophyId))
    );
    return !!row;
  }

  async getApplaudCounts(trophyIds: string[]): Promise<Map<string, number>> {
    if (trophyIds.length === 0) return new Map();
    const rows = await db.select({
      trophyId: trophyApplauds.trophyId,
      cnt: count(trophyApplauds.id),
    })
      .from(trophyApplauds)
      .where(inArray(trophyApplauds.trophyId, trophyIds))
      .groupBy(trophyApplauds.trophyId);
    const map = new Map<string, number>();
    for (const row of rows) {
      map.set(row.trophyId, row.cnt);
    }
    return map;
  }

  async getUserApplauds(userId: string, trophyIds: string[]): Promise<Set<string>> {
    if (trophyIds.length === 0) return new Set();
    const rows = await db.select({ trophyId: trophyApplauds.trophyId })
      .from(trophyApplauds)
      .where(and(eq(trophyApplauds.userId, userId), inArray(trophyApplauds.trophyId, trophyIds)));
    return new Set(rows.map(r => r.trophyId));
  }

  // Trophy feed
  async getTrophyFeed(options: {
    mode: "global" | "following";
    userId?: string;
    species?: string;
    region?: string;
    sort?: "newest" | "most_applauded" | "highest_score";
    limit?: number;
    offset?: number;
  }): Promise<{
    items: {
      trophy: Trophy;
      user: { id: string; firstName: string | null; lastName: string | null; profileImageUrl: string | null };
      applaudCount: number;
      score: string | null;
    }[];
    total: number;
  }> {
    const limit = options.limit ?? 20;
    const offset = options.offset ?? 0;
    const sort = options.sort ?? "newest";

    let searchCondition = undefined;
    if (options.species && options.region) {
      searchCondition = or(
        ilike(trophies.species, `%${options.species}%`),
        ilike(trophies.location, `%${options.region}%`)
      );
    } else if (options.species) {
      searchCondition = ilike(trophies.species, `%${options.species}%`);
    } else if (options.region) {
      searchCondition = ilike(trophies.location, `%${options.region}%`);
    }

    let followCondition = undefined;
    if (options.mode === "following" && options.userId) {
      const followedIds = await this.getFollowing(options.userId);
      if (followedIds.length === 0) {
        return { items: [], total: 0 };
      }
      followCondition = inArray(trophies.userId, followedIds);
    }

    const whereClause = and(
      eq(userPreferences.roomVisibility, "public"),
      ...(searchCondition ? [searchCondition] : []),
      ...(followCondition ? [followCondition] : []),
    );

    const applaudCountSq = db
      .select({
        trophyId: trophyApplauds.trophyId,
        cnt: count(trophyApplauds.id).as("cnt"),
      })
      .from(trophyApplauds)
      .groupBy(trophyApplauds.trophyId)
      .as("applaud_counts");

    const [countResult] = await db
      .select({ total: count(trophies.id) })
      .from(trophies)
      .innerJoin(userPreferences, eq(trophies.userId, userPreferences.userId))
      .where(whereClause);

    const total = countResult?.total ?? 0;

    let orderClause;
    if (sort === "most_applauded") {
      orderClause = sql`COALESCE(${applaudCountSq.cnt}, 0) DESC, ${trophies.createdAt} DESC NULLS LAST`;
    } else if (sort === "highest_score") {
      orderClause = sql`${numericScoreExpr} DESC NULLS LAST, ${trophies.createdAt} DESC NULLS LAST`;
    } else {
      orderClause = sql`${trophies.createdAt} DESC NULLS LAST`;
    }

    const rows = await db
      .select({
        trophy: trophies,
        userId: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        applaudCount: applaudCountSq.cnt,
      })
      .from(trophies)
      .innerJoin(users, eq(trophies.userId, users.id))
      .innerJoin(userPreferences, eq(trophies.userId, userPreferences.userId))
      .leftJoin(applaudCountSq, eq(trophies.id, applaudCountSq.trophyId))
      .where(whereClause)
      .orderBy(orderClause)
      .limit(limit)
      .offset(offset);

    const items = rows.map(r => ({
      trophy: r.trophy,
      user: {
        id: r.userId,
        firstName: r.firstName,
        lastName: r.lastName,
        profileImageUrl: r.profileImageUrl,
      },
      applaudCount: r.applaudCount ?? 0,
      score: r.trophy.score,
    }));

    return { items, total };
  }

  // ========== GROUPS ==========
  async createGroup(adminUserId: string, data: InsertGroup): Promise<Group> {
    return await db.transaction(async (tx) => {
      const [group] = await tx.insert(groups).values({ ...data, adminUserId }).returning();
      await tx.insert(groupMembers).values({ groupId: group.id, userId: adminUserId, role: "admin" });
      return group;
    });
  }

  async deleteGroup(groupId: string, adminUserId: string): Promise<boolean> {
    const result = await db.delete(groups).where(and(eq(groups.id, groupId), eq(groups.adminUserId, adminUserId))).returning();
    return result.length > 0;
  }

  async getGroup(groupId: string, userId: string): Promise<Group | undefined> {
    const isMember = await this.isGroupMember(groupId, userId);
    if (!isMember) return undefined;
    const [group] = await db.select().from(groups).where(eq(groups.id, groupId));
    return group;
  }

  async getUserGroups(userId: string): Promise<(Group & { memberCount: number; trophyCount: number; memberPreviews: { id: string; firstName: string | null; profileImageUrl: string | null }[] })[]> {
    const memberships = await db.select({ groupId: groupMembers.groupId })
      .from(groupMembers)
      .where(eq(groupMembers.userId, userId));

    if (memberships.length === 0) return [];

    const groupIds = memberships.map(m => m.groupId);
    const groupRows = await db.select().from(groups).where(inArray(groups.id, groupIds)).orderBy(desc(groups.createdAt));

    const memberCounts = await db.select({
      groupId: groupMembers.groupId,
      cnt: count(groupMembers.id),
    })
      .from(groupMembers)
      .where(inArray(groupMembers.groupId, groupIds))
      .groupBy(groupMembers.groupId);

    const countMap = new Map<string, number>();
    for (const mc of memberCounts) {
      countMap.set(mc.groupId, mc.cnt);
    }

    const trophyCounts = await db.select({
      groupId: groupTrophies.groupId,
      cnt: count(groupTrophies.id),
    })
      .from(groupTrophies)
      .where(inArray(groupTrophies.groupId, groupIds))
      .groupBy(groupTrophies.groupId);

    const trophyCountMap = new Map<string, number>();
    for (const tc of trophyCounts) {
      trophyCountMap.set(tc.groupId, tc.cnt);
    }

    const memberRows = await db.select({
      groupId: groupMembers.groupId,
      userId: users.id,
      firstName: users.firstName,
      profileImageUrl: users.profileImageUrl,
    })
      .from(groupMembers)
      .innerJoin(users, eq(groupMembers.userId, users.id))
      .where(inArray(groupMembers.groupId, groupIds));

    const memberPreviewMap = new Map<string, { id: string; firstName: string | null; profileImageUrl: string | null }[]>();
    for (const mr of memberRows) {
      const list = memberPreviewMap.get(mr.groupId) || [];
      if (list.length < 5) {
        list.push({ id: mr.userId, firstName: mr.firstName, profileImageUrl: mr.profileImageUrl });
      }
      memberPreviewMap.set(mr.groupId, list);
    }

    return groupRows.map(g => ({
      ...g,
      memberCount: countMap.get(g.id) ?? 0,
      trophyCount: trophyCountMap.get(g.id) ?? 0,
      memberPreviews: memberPreviewMap.get(g.id) ?? [],
    }));
  }

  async getGroupMembers(groupId: string, requestingUserId: string): Promise<(GroupMember & { user: { id: string; firstName: string | null; lastName: string | null; profileImageUrl: string | null } })[]> {
    const isMember = await this.isGroupMember(groupId, requestingUserId);
    if (!isMember) return [];
    const rows = await db.select({
      member: groupMembers,
      userId: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      profileImageUrl: users.profileImageUrl,
    })
      .from(groupMembers)
      .innerJoin(users, eq(groupMembers.userId, users.id))
      .where(eq(groupMembers.groupId, groupId))
      .orderBy(asc(groupMembers.joinedAt));

    return rows.map(r => ({
      ...r.member,
      user: { id: r.userId, firstName: r.firstName, lastName: r.lastName, profileImageUrl: r.profileImageUrl },
    }));
  }

  async isGroupMember(groupId: string, userId: string): Promise<boolean> {
    const [row] = await db.select().from(groupMembers).where(
      and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId))
    );
    return !!row;
  }

  async isGroupAdmin(groupId: string, userId: string): Promise<boolean> {
    const [row] = await db.select().from(groupMembers).where(
      and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId), eq(groupMembers.role, "admin"))
    );
    return !!row;
  }

  // Group invites
  async createGroupInvite(groupId: string, invitedByUserId: string, invitedUserId: string): Promise<GroupInvite> {
    const [created] = await db.insert(groupInvites).values({
      groupId,
      invitedByUserId,
      invitedUserId,
      status: "pending",
    }).returning();
    return created;
  }

  async getUserPendingInvites(userId: string): Promise<(GroupInvite & { group: Group; invitedBy: { id: string; firstName: string | null; lastName: string | null } })[]> {
    const rows = await db.select({
      invite: groupInvites,
      group: groups,
      invitedById: users.id,
      invitedByFirstName: users.firstName,
      invitedByLastName: users.lastName,
    })
      .from(groupInvites)
      .innerJoin(groups, eq(groupInvites.groupId, groups.id))
      .innerJoin(users, eq(groupInvites.invitedByUserId, users.id))
      .where(and(eq(groupInvites.invitedUserId, userId), eq(groupInvites.status, "pending")))
      .orderBy(desc(groupInvites.createdAt));

    return rows.map(r => ({
      ...r.invite,
      group: r.group,
      invitedBy: { id: r.invitedById, firstName: r.invitedByFirstName, lastName: r.invitedByLastName },
    }));
  }

  async respondToGroupInvite(inviteId: string, userId: string, accept: boolean): Promise<GroupInvite | undefined> {
    return await db.transaction(async (tx) => {
      const [invite] = await tx.select().from(groupInvites).where(
        and(eq(groupInvites.id, inviteId), eq(groupInvites.invitedUserId, userId), eq(groupInvites.status, "pending"))
      );
      if (!invite) return undefined;

      const newStatus = accept ? "accepted" : "declined";
      const [updated] = await tx.update(groupInvites).set({ status: newStatus }).where(eq(groupInvites.id, inviteId)).returning();

      if (accept) {
        const [existing] = await tx.select().from(groupMembers).where(
          and(eq(groupMembers.groupId, invite.groupId), eq(groupMembers.userId, userId))
        );
        if (!existing) {
          await tx.insert(groupMembers).values({ groupId: invite.groupId, userId, role: "member" });
        }
      }

      return updated;
    });
  }

  // Group trophies
  async addGroupTrophy(groupId: string, trophyId: string, sharedByUserId: string, assignedToUserId?: string | null): Promise<GroupTrophy> {
    const [created] = await db.insert(groupTrophies).values({
      groupId,
      trophyId,
      sharedByUserId,
      assignedToUserId: assignedToUserId || null,
    }).returning();
    return created;
  }

  async removeGroupTrophy(groupId: string, trophyId: string): Promise<boolean> {
    const result = await db.delete(groupTrophies).where(
      and(eq(groupTrophies.groupId, groupId), eq(groupTrophies.trophyId, trophyId))
    ).returning();
    return result.length > 0;
  }

  async getGroupTrophies(groupId: string, requestingUserId: string): Promise<(GroupTrophy & { trophy: Trophy })[]> {
    const isMember = await this.isGroupMember(groupId, requestingUserId);
    if (!isMember) return [];
    const rows = await db.select({
      groupTrophy: groupTrophies,
      trophy: trophies,
    })
      .from(groupTrophies)
      .innerJoin(trophies, eq(groupTrophies.trophyId, trophies.id))
      .where(eq(groupTrophies.groupId, groupId))
      .orderBy(desc(groupTrophies.createdAt));

    return rows.map(r => ({ ...r.groupTrophy, trophy: r.trophy }));
  }
}

export const storage = new DatabaseStorage();
