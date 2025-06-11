import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import pgSession from "connect-pg-simple";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import { db } from "./db";

const app = express();

// CORS configuration
const allowedOrigins = process.env.NODE_ENV === "production"
  ? [process.env.PRODUCTION_URL || "https://your-production-domain.com"]
  : ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5000", "http://127.0.0.1:5000"];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));

// Session configuration
const pgStore = pgSession(session);
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
  resave: false,
  saveUninitialized: false,
    rolling: true, // Refresh session with each request
  cookie: {
      secure: process.env.NODE_ENV === "production", // Only use secure in production
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: "lax",
      path: "/"
    },
    store: new pgStore({
      createTableIfMissing: true,
      tableName: "sessions",
      conObject: {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
      },
      pruneSessionInterval: 60 // Clean up expired sessions every minute
    })
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

async function main() {
  // Initialize storage
  await storage.init();

  // Create admin user if it doesn't exist
  const adminEmail = "charmantshema112@gmail.com";
  const adminPassword = "123456";
  
  try {
    const existingAdmin = await storage.getAdminByEmail(adminEmail);
    if (!existingAdmin) {
      await storage.createAdmin(adminEmail, "Admin", adminPassword);
      console.log("Admin user created successfully");
    }
  } catch (error) {
    console.error("Error creating admin user:", error);
  }

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
}

main();
