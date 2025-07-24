import { integer, pgTable, varchar, timestamp, boolean } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),

    provider: varchar().notNull(),

    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp().defaultNow().notNull(),
    lastUsed: timestamp().defaultNow().notNull()
});

export const productsTable = pgTable("products", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    
    name: varchar().notNull(),
    description: varchar().notNull(),
    basePrice: integer().notNull(),
    currencyType: varchar().notNull(),
    ownerId: integer().notNull(),

    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp().defaultNow().notNull(),
    lastUsed: timestamp().defaultNow().notNull()
});