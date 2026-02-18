import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";
import { users } from "./models/auth";

export const weapons = pgTable("weapons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(), // Rifle, Bow, Muzzleloader, Handgun, Shotgun
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
  location: text("location").notNull(),
  score: text("score"),
  method: text("method").notNull(), // Rifle, Bow, Muzzleloader
  weaponId: varchar("weapon_id").references(() => weapons.id),
  notes: text("notes"),
  imageUrl: text("image_url"),
  featured: boolean("featured").default(false),
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
});

export const roomRatings = pgTable("room_ratings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomOwnerId: varchar("room_owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  raterId: varchar("rater_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  score: integer("score").notNull(), // 1-5
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  trophies: many(trophies),
  weapons: many(weapons),
  preferences: one(userPreferences),
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

export const roomRatingsRelations = relations(roomRatings, ({ one }) => ({
  owner: one(users, { fields: [roomRatings.roomOwnerId], references: [users.id] }),
  rater: one(users, { fields: [roomRatings.raterId], references: [users.id] }),
}));

// Insert schemas
export const insertWeaponSchema = createInsertSchema(weapons).omit({ id: true, userId: true, createdAt: true });
export const insertTrophySchema = createInsertSchema(trophies).omit({ id: true, userId: true, createdAt: true });
export const insertPreferencesSchema = createInsertSchema(userPreferences).omit({ id: true, userId: true });
export const insertRoomRatingSchema = createInsertSchema(roomRatings).omit({ id: true, raterId: true, createdAt: true });

// Types
export type InsertWeapon = z.infer<typeof insertWeaponSchema>;
export type Weapon = typeof weapons.$inferSelect;
export type InsertTrophy = z.infer<typeof insertTrophySchema>;
export type Trophy = typeof trophies.$inferSelect;
export type InsertPreferences = z.infer<typeof insertPreferencesSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertRoomRating = z.infer<typeof insertRoomRatingSchema>;
export type RoomRating = typeof roomRatings.$inferSelect;
