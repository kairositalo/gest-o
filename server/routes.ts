import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, insertUserSchema, insertProjectSchema } from "@shared/schema";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";
import fs from "fs";
import session from "express-session";

// Configure multer for file uploads
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  }),
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.dwg', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos .dwg e .pdf são permitidos'));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

// Authentication middleware
function requireAuth(req: any, res: any, next: any) {
  if (!req.session?.user) {
    return res.status(401).json({ message: "Não autorizado" });
  }
  next();
}

// Role-based authorization middleware
function requireRole(...roles: string[]) {
  return (req: any, res: any, next: any) => {
    if (!req.session?.user) {
      return res.status(401).json({ message: "Não autorizado" });
    }
    if (!roles.includes(req.session.user.role)) {
      return res.status(403).json({ message: "Acesso negado" });
    }
    next();
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
  }));

  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "E-mail ou senha inválidos" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "E-mail ou senha inválidos" });
      }

      if (!user.isActive) {
        return res.status(401).json({ message: "Usuário inativo" });
      }

      (req.session as any).user = { id: user.id, email: user.email, role: user.role, name: user.name };
      
      // Log activity
      await storage.logActivity({
        userId: user.id,
        action: "login",
        entityType: "user",
        entityId: user.id,
      });

      res.json({ user: { id: user.id, email: user.email, role: user.role, name: user.name } });
    } catch (error) {
      res.status(400).json({ message: "Dados inválidos" });
    }
  });

  app.post("/api/auth/logout", requireAuth, async (req: any, res) => {
    const userId = req.session.user.id;
    
    // Log activity
    await storage.logActivity({
      userId,
      action: "logout",
      entityType: "user",
      entityId: userId,
    });

    req.session.destroy((err: any) => {
      if (err) {
        console.error('Session destroy error:', err);
      }
    });
    res.json({ success: true });
  });

  app.get("/api/auth/me", requireAuth, async (req: any, res) => {
    const user = await storage.getUser(req.session.user.id);
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }
    res.json({ user: { id: user.id, email: user.email, role: user.role, name: user.name } });
  });

  // User routes
  app.get("/api/users", requireAuth, requireRole("administrador", "gestor"), async (req, res) => {
    const users = await storage.getAllUsers();
    res.json(users.map(u => ({ ...u, password: undefined })));
  });

  app.post("/api/users", requireAuth, requireRole("administrador", "gestor"), async (req: any, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "E-mail já cadastrado" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      // Log activity
      await storage.logActivity({
        userId: req.session.user.id,
        action: "create_user",
        entityType: "user",
        entityId: user.id,
        details: { createdUserEmail: user.email, createdUserRole: user.role },
      });

      res.json({ ...user, password: undefined });
    } catch (error) {
      res.status(400).json({ message: "Dados inválidos" });
    }
  });

  app.put("/api/users/:id", requireAuth, requireRole("administrador", "gestor"), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      if (updates.password) {
        updates.password = await bcrypt.hash(updates.password, 10);
      }

      const user = await storage.updateUser(id, updates);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      // Log activity
      await storage.logActivity({
        userId: req.session.user.id,
        action: "update_user",
        entityType: "user",
        entityId: user.id,
        details: { updatedFields: Object.keys(updates) },
      });

      res.json({ ...user, password: undefined });
    } catch (error) {
      res.status(400).json({ message: "Dados inválidos" });
    }
  });

  // Project routes
  app.get("/api/projects", requireAuth, async (req: any, res) => {
    const user = req.session.user;
    
    let projects;
    if (user.role === "administrador" || user.role === "gestor") {
      projects = await storage.getAllProjects();
    } else {
      projects = await storage.getProjectsByUser(user.id);
    }
    
    res.json(projects);
  });

  app.post("/api/projects", requireAuth, requireRole("administrador", "gestor"), async (req: any, res) => {
    try {
      const projectData = insertProjectSchema.parse(req.body);
      const assignedUserIds = req.body.assignedUserIds || [];

      const project = await storage.createProject({
        ...projectData,
        createdById: req.session.user.id,
      });

      // Assign users to project
      for (const userId of assignedUserIds) {
        await storage.assignUserToProject(project.id, userId);
      }

      // Log activity
      await storage.logActivity({
        userId: req.session.user.id,
        action: "create_project",
        entityType: "project",
        entityId: project.id,
        details: { projectName: project.name, assignedUsers: assignedUserIds.length },
      });

      res.json(project);
    } catch (error) {
      res.status(400).json({ message: "Dados inválidos" });
    }
  });

  app.get("/api/projects/:id/assignments", requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    const assignments = await storage.getProjectAssignments(id);
    res.json(assignments.map(u => ({ ...u, password: undefined })));
  });

  // File routes
  app.get("/api/projects/:id/files", requireAuth, async (req, res) => {
    const projectId = parseInt(req.params.id);
    const files = await storage.getFilesByProject(projectId);
    res.json(files);
  });

  app.post("/api/projects/:id/files", requireAuth, upload.array('files'), async (req: any, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const uploadedFiles = req.files;
      
      if (!uploadedFiles || uploadedFiles.length === 0) {
        return res.status(400).json({ message: "Nenhum arquivo enviado" });
      }

      const results = [];

      for (const file of uploadedFiles) {
        // Check for duplicates
        const existingFile = await storage.checkFileExists(file.originalname, projectId);
        
        let version = 1;
        let fileName = file.originalname;
        
        if (existingFile) {
          // Get base name without extension
          const baseName = path.parse(file.originalname).name;
          version = await storage.getLatestFileVersion(baseName, projectId) + 1;
          const ext = path.extname(file.originalname);
          fileName = `${baseName}_v${version}${ext}`;
        }

        const newFile = await storage.createFile({
          name: fileName,
          originalName: file.originalname,
          path: file.path,
          size: file.size,
          mimeType: file.mimetype,
          version,
          projectId,
          uploadedById: req.session.user.id,
          status: "pendente",
        });

        results.push(newFile);

        // Log activity
        await storage.logActivity({
          userId: req.session.user.id,
          action: "upload_file",
          entityType: "file",
          entityId: newFile.id,
          details: { fileName: newFile.name, projectId, version },
        });
      }

      res.json(results);
    } catch (error) {
      res.status(400).json({ message: "Erro no upload" });
    }
  });

  app.put("/api/files/:id/status", requireAuth, requireRole("administrador", "gestor", "gestor_final"), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, reviewNotes } = req.body;

      const file = await storage.updateFileStatus(id, status, req.session.user.id, reviewNotes);
      if (!file) {
        return res.status(404).json({ message: "Arquivo não encontrado" });
      }

      // Log activity
      await storage.logActivity({
        userId: req.session.user.id,
        action: "review_file",
        entityType: "file",
        entityId: file.id,
        details: { status, reviewNotes },
      });

      res.json(file);
    } catch (error) {
      res.status(400).json({ message: "Dados inválidos" });
    }
  });

  // Dashboard routes
  app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    const stats = await storage.getDashboardStats();
    res.json(stats);
  });

  app.get("/api/dashboard/activity", requireAuth, async (req: any, res) => {
    const limit = parseInt(req.query.limit as string) || 10;
    
    let activities;
    if (req.session.user.role === "administrador" || req.session.user.role === "gestor") {
      activities = await storage.getRecentActivity(limit);
    } else {
      activities = await storage.getUserActivity(req.session.user.id, limit);
    }
    
    res.json(activities);
  });

  const httpServer = createServer(app);
  return httpServer;
}