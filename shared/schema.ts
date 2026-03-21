import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, real, doublePrecision, uniqueIndex, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";
import { users } from "./models/auth";

export const weapons = pgTable("weapons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(),
  caliber: text("caliber"),
  make: text("make"),
  model: text("model"),
  optic: text("optic"),
  notes: text("notes"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const trophies = pgTable("trophies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  species: text("species").notNull(),
  name: text("name").notNull(),
  date: text("date").notNull(),
  location: text("location"),
  score: text("score"),
  method: text("method"),
  weaponId: varchar("weapon_id").references(() => weapons.id),
  notes: text("notes"),
  huntNotes: text("hunt_notes"),
  gender: text("gender"),
  shotDistance: text("shot_distance"),
  imageUrl: text("image_url"),
  renderImageUrl: text("render_image_url"),
  glbUrl: text("glb_url"),
  glbPreviewUrl: text("glb_preview_url"),
  usdzUrl: text("usdz_url"),
  mountType: text("mount_type"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  featured: boolean("featured").default(false),
  isAiAnalyzed: boolean("is_ai_analyzed").default(false),
  taggedProUserId: varchar("tagged_pro_user_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userPreferences = pgTable("user_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  theme: text("theme").default("lodge"),
  pursuit: text("pursuit"),
  scoringSystem: text("scoring_system").default("SCI"),
  units: text("units").default("imperial"),
  roomVisibility: text("room_visibility").default("private"),
  huntingLocations: text("hunting_locations").array().default(sql`'{}'::text[]`),
  profileImageUrl: text("profile_image_url"),
  isPremium: boolean("is_premium").default(false),
  accountTier: text("account_tier").default("free"),
  userType: text("user_type").default("hunter"),
  leaderboardVerified: boolean("leaderboard_verified").default(false),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  firstTrophyUploaded: boolean("first_trophy_uploaded").default(false),
  upgradePromptShown: boolean("upgrade_prompt_shown").default(false),
  credits: integer("credits").default(0),
});

export const proProfiles = pgTable("pro_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  entityType: text("entity_type").notNull(),
  businessName: text("business_name").notNull(),
  businessHandle: text("business_handle"),
  location: text("location"),
  referralCode: varchar("referral_code").unique().notNull(),
  referralLink: text("referral_link"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const referrals = pgTable("referrals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  proUserId: varchar("pro_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  referredUserId: varchar("referred_user_id").references(() => users.id, { onDelete: "set null" }),
  referralCode: varchar("referral_code").notNull(),
  status: text("status").default("pending"),
  convertedAt: timestamp("converted_at"),
  payoutAmount: real("payout_amount").default(0),
  payoutStatus: text("payout_status").default("unpaid"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const usageLedger = pgTable("usage_ledger", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  actionType: text("action_type").notNull(),
  estimatedCost: real("estimated_cost").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const roomRatings = pgTable("room_ratings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomOwnerId: varchar("room_owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  raterId: varchar("rater_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  score: integer("score").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const follows = pgTable("follows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  followerId: varchar("follower_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  followedId: varchar("followed_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  uniqueIndex("follows_follower_followed_unique").on(table.followerId, table.followedId),
]);

export const trophyApplauds = pgTable("trophy_applauds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  trophyId: varchar("trophy_id").notNull().references(() => trophies.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  uniqueIndex("trophy_applauds_user_trophy_unique").on(table.userId, table.trophyId),
]);

// ========== GROUPS ==========
export const groups = pgTable("groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  region: text("region"),
  description: text("description"),
  adminUserId: varchar("admin_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const groupMembers = pgTable("group_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("member"),
  joinedAt: timestamp("joined_at").defaultNow(),
}, (table) => [
  uniqueIndex("group_members_group_user_unique").on(table.groupId, table.userId),
]);

export const groupInvites = pgTable("group_invites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
  invitedByUserId: varchar("invited_by_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  invitedUserId: varchar("invited_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const groupTrophies = pgTable("group_trophies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
  trophyId: varchar("trophy_id").notNull().references(() => trophies.id, { onDelete: "cascade" }),
  sharedByUserId: varchar("shared_by_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  assignedToUserId: varchar("assigned_to_user_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  uniqueIndex("group_trophies_group_trophy_unique").on(table.groupId, table.trophyId),
]);

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  trophies: many(trophies),
  weapons: many(weapons),
  preferences: one(userPreferences),
  proProfile: one(proProfiles),
  adminGroups: many(groups),
  groupMemberships: many(groupMembers),
}));

export const weaponsRelations = relations(weapons, ({ one }) => ({
  user: one(users, { fields: [weapons.userId], references: [users.id] }),
}));

export const trophiesRelations = relations(trophies, ({ one }) => ({
  user: one(users, { fields: [trophies.userId], references: [users.id] }),
  weapon: one(weapons, { fields: [trophies.weaponId], references: [weapons.id] }),
}));

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, { fields: [userPreferences.userId], references: [users.id] }),
}));

export const proProfilesRelations = relations(proProfiles, ({ one, many }) => ({
  user: one(users, { fields: [proProfiles.userId], references: [users.id] }),
  referrals: many(referrals),
}));

export const referralsRelations = relations(referrals, ({ one }) => ({
  proUser: one(users, { fields: [referrals.proUserId], references: [users.id] }),
}));

export const usageLedgerRelations = relations(usageLedger, ({ one }) => ({
  user: one(users, { fields: [usageLedger.userId], references: [users.id] }),
}));

export const roomRatingsRelations = relations(roomRatings, ({ one }) => ({
  owner: one(users, { fields: [roomRatings.roomOwnerId], references: [users.id] }),
  rater: one(users, { fields: [roomRatings.raterId], references: [users.id] }),
}));

export const groupsRelations = relations(groups, ({ one, many }) => ({
  admin: one(users, { fields: [groups.adminUserId], references: [users.id] }),
  members: many(groupMembers),
  invites: many(groupInvites),
  groupTrophies: many(groupTrophies),
}));

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  group: one(groups, { fields: [groupMembers.groupId], references: [groups.id] }),
  user: one(users, { fields: [groupMembers.userId], references: [users.id] }),
}));

export const groupInvitesRelations = relations(groupInvites, ({ one }) => ({
  group: one(groups, { fields: [groupInvites.groupId], references: [groups.id] }),
  invitedBy: one(users, { fields: [groupInvites.invitedByUserId], references: [users.id] }),
  invitedUser: one(users, { fields: [groupInvites.invitedUserId], references: [users.id] }),
}));

export const groupTrophiesRelations = relations(groupTrophies, ({ one }) => ({
  group: one(groups, { fields: [groupTrophies.groupId], references: [groups.id] }),
  trophy: one(trophies, { fields: [groupTrophies.trophyId], references: [trophies.id] }),
  sharedBy: one(users, { fields: [groupTrophies.sharedByUserId], references: [users.id] }),
}));

// Insert schemas
export const insertWeaponSchema = createInsertSchema(weapons).omit({ id: true, userId: true, createdAt: true });
export const insertTrophySchema = createInsertSchema(trophies).omit({ id: true, userId: true, createdAt: true });
export const insertPreferencesSchema = createInsertSchema(userPreferences).omit({ id: true, userId: true });
export const insertRoomRatingSchema = createInsertSchema(roomRatings).omit({ id: true, raterId: true, createdAt: true });
export const insertProProfileSchema = createInsertSchema(proProfiles).omit({ id: true, userId: true, createdAt: true, referralCode: true, referralLink: true });
export const insertUsageLedgerSchema = createInsertSchema(usageLedger).omit({ id: true, userId: true, createdAt: true });

// Types
export type InsertWeapon = z.infer<typeof insertWeaponSchema>;
export type Weapon = typeof weapons.$inferSelect;
export type InsertTrophy = z.infer<typeof insertTrophySchema>;
export type Trophy = typeof trophies.$inferSelect;
export type InsertPreferences = z.infer<typeof insertPreferencesSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertRoomRating = z.infer<typeof insertRoomRatingSchema>;
export type RoomRating = typeof roomRatings.$inferSelect;
export type InsertProProfile = z.infer<typeof insertProProfileSchema>;
export type ProProfile = typeof proProfiles.$inferSelect;
export type UsageLedgerEntry = typeof usageLedger.$inferSelect;
export type Referral = typeof referrals.$inferSelect;

export const insertFollowSchema = createInsertSchema(follows).omit({ id: true, createdAt: true });
export const insertTrophyApplaudSchema = createInsertSchema(trophyApplauds).omit({ id: true, createdAt: true });
export const insertGroupSchema = createInsertSchema(groups).omit({ id: true, adminUserId: true, createdAt: true });
export const insertGroupInviteSchema = createInsertSchema(groupInvites).omit({ id: true, invitedByUserId: true, status: true, createdAt: true });
export const insertGroupTrophySchema = createInsertSchema(groupTrophies).omit({ id: true, sharedByUserId: true, createdAt: true });

export type InsertFollow = z.infer<typeof insertFollowSchema>;
export type Follow = typeof follows.$inferSelect;
export type InsertTrophyApplaud = z.infer<typeof insertTrophyApplaudSchema>;
export type TrophyApplaud = typeof trophyApplauds.$inferSelect;
export type Group = typeof groups.$inferSelect;
export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type GroupMember = typeof groupMembers.$inferSelect;
export type GroupInvite = typeof groupInvites.$inferSelect;
export type InsertGroupInvite = z.infer<typeof insertGroupInviteSchema>;
export type GroupTrophy = typeof groupTrophies.$inferSelect;
export type InsertGroupTrophy = z.infer<typeof insertGroupTrophySchema>;

// Tier constants
export const TIER_LIMITS = {
  free: {
    maxAiAnalyses: 3,
    max3dModels: 1,
    maxManualTrophies: 25,
    monthlyCostCap: 0,
  },
  paid: {
    maxAiAnalyses: Infinity,
    max3dModels: Infinity,
    maxManualTrophies: Infinity,
    monthlyCostCap: 10,
  },
  pro: {
    maxAiAnalyses: Infinity,
    max3dModels: Infinity,
    maxManualTrophies: Infinity,
    monthlyCostCap: 20,
  },
} as const;

export const AI_COSTS = {
  ai_analysis: 0.10,
  "3d_model": 0.15,
} as const;

export type AccountTier = "free" | "paid" | "pro";
export type ProEntityType = "outfitter" | "professional_hunter" | "taxidermist";
