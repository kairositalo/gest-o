import { 
  users, 
  projects, 
  projectAssignments, 
  files, 
  activityLog,
  systemSettings,
  type User, 
  type InsertUser,
  type Project,
  type InsertProject,
  type ProjectAssignment,
  type File,
  type InsertFile,
  type ActivityLog,
  type InsertActivityLog,
  type SystemSetting,
  type InsertSystemSetting,
  type UserRole
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql, count } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  
  // Project methods
  createProject(project: InsertProject): Promise<Project>;
  getProject(id: number): Promise<Project | undefined>;
  getAllProjects(): Promise<Project[]>;
  updateProject(id: number, updates: Partial<InsertProject>): Promise<Project | undefined>;
  getProjectsByUser(userId: number): Promise<Project[]>;
  
  // Project assignment methods
  assignUserToProject(projectId: number, userId: number): Promise<ProjectAssignment>;
  removeUserFromProject(projectId: number, userId: number): Promise<void>;
  getProjectAssignments(projectId: number): Promise<User[]>;
  
  // File methods
  createFile(file: InsertFile): Promise<File>;
  getFile(id: number): Promise<File | undefined>;
  getFilesByProject(projectId: number): Promise<File[]>;
  updateFileStatus(id: number, status: string, reviewedById?: number, reviewNotes?: string): Promise<File | undefined>;
  checkFileExists(name: string, projectId: number): Promise<File | undefined>;
  getLatestFileVersion(baseName: string, projectId: number): Promise<number>;
  
  // Activity log methods
  logActivity(activity: InsertActivityLog): Promise<ActivityLog>;
  getUserActivity(userId: number, limit?: number): Promise<ActivityLog[]>;
  getRecentActivity(limit?: number): Promise<ActivityLog[]>;
  
  // Dashboard methods
  getDashboardStats(): Promise<{
    totalProjects: number;
    totalFiles: number;
    totalUsers: number;
    approvalRate: number;
  }>;
  
  // System settings methods
  getSetting(key: string): Promise<SystemSetting | undefined>;
  setSetting(setting: InsertSystemSetting): Promise<SystemSetting>;
  getAllSettings(): Promise<SystemSetting[]>;
  getEmailDomains(): Promise<string[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        updatedAt: new Date(),
      })
      .returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.isActive, true)).orderBy(users.name);
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const [project] = await db
      .insert(projects)
      .values({
        ...insertProject,
        updatedAt: new Date(),
      })
      .returning();
    return project;
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }

  async getAllProjects(): Promise<Project[]> {
    return await db.select().from(projects).orderBy(desc(projects.updatedAt));
  }

  async updateProject(id: number, updates: Partial<InsertProject>): Promise<Project | undefined> {
    const [project] = await db
      .update(projects)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return project || undefined;
  }

  async getProjectsByUser(userId: number): Promise<Project[]> {
    const userProjects = await db
      .select({ project: projects })
      .from(projects)
      .innerJoin(projectAssignments, eq(projects.id, projectAssignments.projectId))
      .where(eq(projectAssignments.userId, userId))
      .orderBy(desc(projects.updatedAt));
    
    return userProjects.map(up => up.project);
  }

  async assignUserToProject(projectId: number, userId: number): Promise<ProjectAssignment> {
    const [assignment] = await db
      .insert(projectAssignments)
      .values({ projectId, userId })
      .returning();
    return assignment;
  }

  async removeUserFromProject(projectId: number, userId: number): Promise<void> {
    await db
      .delete(projectAssignments)
      .where(and(eq(projectAssignments.projectId, projectId), eq(projectAssignments.userId, userId)));
  }

  async getProjectAssignments(projectId: number): Promise<User[]> {
    const assignments = await db
      .select({ user: users })
      .from(users)
      .innerJoin(projectAssignments, eq(users.id, projectAssignments.userId))
      .where(eq(projectAssignments.projectId, projectId));
    
    return assignments.map(a => a.user);
  }

  async createFile(insertFile: InsertFile): Promise<File> {
    const [file] = await db
      .insert(files)
      .values(insertFile)
      .returning();
    return file;
  }

  async getFile(id: number): Promise<File | undefined> {
    const [file] = await db.select().from(files).where(eq(files.id, id));
    return file || undefined;
  }

  async getFilesByProject(projectId: number): Promise<File[]> {
    return await db
      .select()
      .from(files)
      .where(eq(files.projectId, projectId))
      .orderBy(desc(files.uploadedAt));
  }

  async updateFileStatus(id: number, status: string, reviewedById?: number, reviewNotes?: string): Promise<File | undefined> {
    const updates: any = { status };
    if (reviewedById) updates.reviewedById = reviewedById;
    if (reviewNotes) updates.reviewNotes = reviewNotes;
    if (reviewedById || reviewNotes) updates.reviewedAt = new Date();

    const [file] = await db
      .update(files)
      .set(updates)
      .where(eq(files.id, id))
      .returning();
    return file || undefined;
  }

  async checkFileExists(name: string, projectId: number): Promise<File | undefined> {
    const [file] = await db
      .select()
      .from(files)
      .where(and(eq(files.originalName, name), eq(files.projectId, projectId)));
    return file || undefined;
  }

  async getLatestFileVersion(baseName: string, projectId: number): Promise<number> {
    const [result] = await db
      .select({ maxVersion: sql<number>`MAX(${files.version})` })
      .from(files)
      .where(and(eq(files.name, baseName), eq(files.projectId, projectId)));
    
    return result?.maxVersion || 0;
  }

  async logActivity(insertActivity: InsertActivityLog): Promise<ActivityLog> {
    const [activity] = await db
      .insert(activityLog)
      .values(insertActivity)
      .returning();
    return activity;
  }

  async getUserActivity(userId: number, limit: number = 10): Promise<ActivityLog[]> {
    return await db
      .select()
      .from(activityLog)
      .where(eq(activityLog.userId, userId))
      .orderBy(desc(activityLog.createdAt))
      .limit(limit);
  }

  async getRecentActivity(limit: number = 10): Promise<ActivityLog[]> {
    return await db
      .select()
      .from(activityLog)
      .orderBy(desc(activityLog.createdAt))
      .limit(limit);
  }

  async getDashboardStats(): Promise<{
    totalProjects: number;
    totalFiles: number;
    totalUsers: number;
    approvalRate: number;
  }> {
    const [projectCount] = await db.select({ count: count() }).from(projects);
    const [fileCount] = await db.select({ count: count() }).from(files);
    const [userCount] = await db.select({ count: count() }).from(users).where(eq(users.isActive, true));
    
    const [approvedFiles] = await db
      .select({ count: count() })
      .from(files)
      .where(eq(files.status, "aprovado"));
    
    const approvalRate = fileCount.count > 0 ? Math.round((approvedFiles.count / fileCount.count) * 100) : 0;

    return {
      totalProjects: projectCount.count,
      totalFiles: fileCount.count,
      totalUsers: userCount.count,
      approvalRate,
    };
  }

  async getSetting(key: string): Promise<SystemSetting | undefined> {
    const [setting] = await db.select().from(systemSettings).where(eq(systemSettings.key, key));
    return setting || undefined;
  }

  async setSetting(insertSetting: InsertSystemSetting): Promise<SystemSetting> {
    const existing = await this.getSetting(insertSetting.key);
    
    if (existing) {
      const [updated] = await db
        .update(systemSettings)
        .set({
          value: insertSetting.value,
          description: insertSetting.description,
          updatedBy: insertSetting.updatedBy,
          updatedAt: new Date(),
        })
        .where(eq(systemSettings.key, insertSetting.key))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(systemSettings)
        .values(insertSetting)
        .returning();
      return created;
    }
  }

  async getAllSettings(): Promise<SystemSetting[]> {
    return await db.select().from(systemSettings).orderBy(systemSettings.key);
  }

  async getEmailDomains(): Promise<string[]> {
    const setting = await this.getSetting("allowed_email_domains");
    if (!setting) {
      return ["axionpowert.com.br"]; // Default domain
    }
    
    try {
      return JSON.parse(setting.value);
    } catch {
      return ["axionpowert.com.br"];
    }
  }
}

export const storage = new DatabaseStorage();
