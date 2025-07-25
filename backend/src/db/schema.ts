import { relations } from "drizzle-orm";
import {
  integer,
  pgTable,
  varchar,
  timestamp,
  boolean, unique,
} from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),

  email: varchar().notNull().unique(),
  provider: varchar().notNull(),

  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
  lastUsed: timestamp().defaultNow().notNull(),
});

export const productsTable = pgTable("products", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),

  name: varchar().notNull(),
  description: varchar().default("").notNull(),
  basePrice: integer().notNull(),
  currencyType: varchar().default("IDR").notNull(),

  createdAt: timestamp().defaultNow().notNull(),
  lastModified: timestamp().defaultNow().notNull(),
});

export const businessTable = pgTable("business", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),

    name: varchar().notNull(),
    slug: varchar().notNull(),
    phoneNumber: varchar().notNull(),
    ownerEmail: varchar().notNull().references(() => usersTable.email),

  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
}, (table) => {
    return {
        slugUnique: unique('slug').on(table.slug),
    }
});

export const ordersTable = pgTable("orders", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),

    name: varchar().notNull(),
    description: varchar().default("").notNull(),
    currency: varchar().default("IDR").notNull(),
    status: varchar().default("pending").notNull(),

    userId: integer().notNull().references(() => usersTable.id),
    businessId: integer().notNull().references(() => businessTable.id),
    productId: integer().notNull().references(() => productsTable.id),
    fileId: integer().notNull(),

    quantity: integer().notNull(),
    totalPrice: integer().notNull(),

    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp().defaultNow().notNull()
});
