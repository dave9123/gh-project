import { relations } from "drizzle-orm";
import {
    integer,
    pgTable,
    varchar,
    timestamp,
    boolean,
    unique,
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
    businessId: integer()
        .notNull()
        .references(() => businessTable.id),

    createdAt: timestamp().defaultNow().notNull(),
    lastModified: timestamp().defaultNow().notNull(),
});

export const businessTable = pgTable("business", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),

    name: varchar().notNull(),
    slug: varchar().notNull().unique(),
    phoneNumber: varchar().notNull(),
    ownerEmail: varchar()
        .notNull()
        .references(() => usersTable.email),

    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp().defaultNow().notNull()
});

export const ordersTable = pgTable("orders", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),

    name: varchar().notNull(),
    description: varchar().default("").notNull(),
    currency: varchar().default("IDR").notNull(),
    status: varchar().default("pending").notNull(),

    userId: integer()
        .notNull()
        .references(() => usersTable.id),
    businessId: integer()
        .notNull()
        .references(() => businessTable.id),
    productId: integer()
        .notNull()
        .references(() => productsTable.id),
    fileId: integer().notNull(),

    quantity: integer().notNull(),
    totalPrice: integer().notNull(),

    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp().defaultNow().notNull(),
});

// Relations
export const businessRelations = relations(businessTable, ({ many, one }) => ({
    products: many(productsTable),
    orders: many(ordersTable),
    owner: one(usersTable, {
        fields: [businessTable.ownerEmail],
        references: [usersTable.email],
    }),
}));

export const productsRelations = relations(productsTable, ({ one, many }) => ({
    business: one(businessTable, {
        fields: [productsTable.businessId],
        references: [businessTable.id],
    }),
    orders: many(ordersTable),
}));

export const ordersRelations = relations(ordersTable, ({ one }) => ({
    user: one(usersTable, {
        fields: [ordersTable.userId],
        references: [usersTable.id],
    }),
    business: one(businessTable, {
        fields: [ordersTable.businessId],
        references: [businessTable.id],
    }),
    product: one(productsTable, {
        fields: [ordersTable.productId],
        references: [productsTable.id],
    }),
}));

export const usersRelations = relations(usersTable, ({ many }) => ({
    businesses: many(businessTable),
    orders: many(ordersTable),
}));
