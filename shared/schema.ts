import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User roles enum
export const userRoles = [
  "administrador",
  "gestor", 
  "especialista",
  "analista",
  "projetista",
  "gestor_final"
] as const;

export type UserRole = typeof userRoles[number];

// Project priorities and status
export const projectPriorities = ["baixa", "media", "alta", "critica"] as const;
export const projectStatuses = ["planejamento", "em_andamento", "aguardando_revisao", "aprovado", "cancelado"] as const;
export const fileStatuses = ["pendente", "aprovado", "rejeitado", "revisao"] as const;

export type ProjectPriority = typeof projectPriorities[number];
export type ProjectStatus = typeof projectStatuses[number];
export type FileStatus = typeof fileStatuses[number];

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: userRoles }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Projects table
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  priority: text("priority", { enum: projectPriorities }).notNull().default("media"),
  status: text("status", { enum: projectStatuses }).notNull().default("planejamento"),
  createdById: integer("created_by_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Project assignments (many-to-many relationship between users and projects)
export const projectAssignments = pgTable("project_assignments", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  userId: integer("user_id").notNull(),
  assignedAt: timestamp("assigned_at").notNull().defaultNow(),
});

// Files table
export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  originalName: text("original_name").notNull(),
  path: text("path").notNull(),
  size: integer("size").notNull(),
  mimeType: text("mime_type").notNull(),
  version: integer("version").notNull().default(1),
  projectId: integer("project_id").notNull(),
  uploadedById: integer("uploaded_by_id").notNull(),
  status: text("status", { enum: fileStatuses }).notNull().default("pendente"),
  reviewedById: integer("reviewed_by_id"),
  reviewNotes: text("review_notes"),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
});

// Activity log for tracking user actions
export const activityLog = pgTable("activity_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: integer("entity_id"),
  details: jsonb("details"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// System settings for email domains and other configurations
export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedBy: integer("updated_by").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  createdProjects: many(projects),
  projectAssignments: many(projectAssignments),
  uploadedFiles: many(files, { relationName: "uploader" }),
  reviewedFiles: many(files, { relationName: "reviewer" }),
  activities: many(activityLog),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [projects.createdById],
    references: [users.id],
  }),
  assignments: many(projectAssignments),
  files: many(files),
}));

export const projectAssignmentsRelations = relations(projectAssignments, ({ one }) => ({
  project: one(projects, {
    fields: [projectAssignments.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [projectAssignments.userId],
    references: [users.id],
  }),
}));

export const filesRelations = relations(files, ({ one }) => ({
  project: one(projects, {
    fields: [files.projectId],
    references: [projects.id],
  }),
  uploadedBy: one(users, {
    fields: [files.uploadedById],
    references: [users.id],
    relationName: "uploader",
  }),
  reviewedBy: one(users, {
    fields: [files.reviewedById],
    references: [users.id],
    relationName: "reviewer",
  }),
}));

export const activityLogRelations = relations(activityLog, ({ one }) => ({
  user: one(users, {
    fields: [activityLog.userId],
    references: [users.id],
  }),
}));

export const systemSettingsRelations = relations(systemSettings, ({ one }) => ({
  updatedByUser: one(users, {
    fields: [systemSettings.updatedBy],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFileSchema = createInsertSchema(files).omit({
  id: true,
  uploadedAt: true,
  reviewedAt: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLog).omit({
  id: true,
  createdAt: true,
});

export const insertSystemSettingSchema = createInsertSchema(systemSettings).omit({
  id: true,
  updatedAt: true,
});

// Login schema
export const loginSchema = z.object({
  email: z.string().email("E-mail inválido").refine(
    (email) => {
      const personalDomains = ["gmail.com", "hotmail.com", "yahoo.com", "outlook.com", "live.com"];
      const domain = email.split("@")[1]?.toLowerCase();
      return domain && !personalDomains.includes(domain);
    },
    "Use um e-mail corporativo"
  ),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type ProjectAssignment = typeof projectAssignments.$inferSelect;
export type File = typeof files.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;
export type ActivityLog = typeof activityLog.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;
export type LoginData = z.infer<typeof loginSchema>;
