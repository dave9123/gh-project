import { relations } from "drizzle-orm";
import { integer, pgTable, varchar, timestamp, boolean } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),

    email: varchar().notNull().unique(),
    provider: varchar().notNull(),

    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp().defaultNow().notNull(),
    lastUsed: timestamp().defaultNow().notNull()
});

export const productsTable = pgTable("products", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    
    name: varchar().notNull(),
    description: varchar().default("").notNull(),
    basePrice: integer().notNull(),
    currencyType: varchar().default("IDR").notNull(),

    createdAt: timestamp().defaultNow().notNull(),
    lastModified: timestamp().defaultNow().notNull()
});

export const businessTable = pgTable("business", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),

    name: varchar().notNull(),
    slug: varchar().notNull(),
    phoneNumber: varchar().notNull(),
    ownerEmail: varchar().notNull().references(() => usersTable.email),

    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp().defaultNow().notNull()
});