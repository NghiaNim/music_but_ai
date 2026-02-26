import { pgTable } from "drizzle-orm/pg-core";

export const user = pgTable("user", (t) => ({
  id: t.text().primaryKey(),
  name: t.text().notNull(),
  email: t.text().notNull().unique(),
  emailVerified: t.boolean().notNull(),
  image: t.text(),
  createdAt: t.timestamp({ mode: "date" }).notNull(),
  updatedAt: t.timestamp({ mode: "date" }).notNull(),
}));

export const session = pgTable("session", (t) => ({
  id: t.text().primaryKey(),
  expiresAt: t.timestamp({ mode: "date" }).notNull(),
  token: t.text().notNull().unique(),
  createdAt: t.timestamp({ mode: "date" }).notNull(),
  updatedAt: t.timestamp({ mode: "date" }).notNull(),
  ipAddress: t.text(),
  userAgent: t.text(),
  userId: t
    .text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
}));

export const account = pgTable("account", (t) => ({
  id: t.text().primaryKey(),
  accountId: t.text().notNull(),
  providerId: t.text().notNull(),
  userId: t
    .text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: t.text(),
  refreshToken: t.text(),
  idToken: t.text(),
  accessTokenExpiresAt: t.timestamp({ mode: "date" }),
  refreshTokenExpiresAt: t.timestamp({ mode: "date" }),
  scope: t.text(),
  password: t.text(),
  createdAt: t.timestamp({ mode: "date" }).notNull(),
  updatedAt: t.timestamp({ mode: "date" }).notNull(),
}));

export const verification = pgTable("verification", (t) => ({
  id: t.text().primaryKey(),
  identifier: t.text().notNull(),
  value: t.text().notNull(),
  expiresAt: t.timestamp({ mode: "date" }).notNull(),
  createdAt: t.timestamp({ mode: "date" }),
  updatedAt: t.timestamp({ mode: "date" }),
}));
