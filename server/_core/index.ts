import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import * as cookie from "cookie";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import pino from "pino";
import { registerOAuthRoutes } from "./oauth";
import { setupQRAuthRoutes } from "../routes/qr-auth";
import { setupConsentFormRoutes } from "../routes/consent-form";
import { registerMagicLinkRoutes } from "../routes/magic-link";
import { setupDeleteAccountRoutes } from "../routes/delete-account";
import { registerAuthRestRoutes } from "../routes/auth-rest";
import { appRouter } from "../routers";
import { createContext } from "./context";

/**
 * Production-grade logger with structured logging
 * AUDIT-0002: Replace console.log with pino for security and observability
 */
const log = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug"),
  transport: process.env.NODE_ENV === "production" ? undefined : {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:standard",
      ignore: "pid,hostname",
    },
  },
});

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // HIGH-RISK FIX #6: CORS - Whitelist allowed origins instead of reflecting arbitrary origins
  const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "").split(",").filter(Boolean);
  
  // Add default origins for development
  if (process.env.NODE_ENV !== "production") {
    ALLOWED_ORIGINS.push(
      "http://localhost:8081",
      "http://localhost:3000",
      "http://127.0.0.1:8081",
      "http://127.0.0.1:3000"
    );
  }

  app.use((req, res, next) => {
    const origin = req.headers.origin;
    
    // Only set CORS headers for whitelisted origins
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-dev-mode"
      );
      res.header("Access-Control-Allow-Credentials", "true");
      res.header("Access-Control-Max-Age", "86400");
    }

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // Manual cookie parsing middleware
  app.use((req, res, next) => {
    if (req.headers.cookie) {
      req.cookies = cookie.parse(req.headers.cookie);
    } else {
      req.cookies = {};
    }
    next();
  });

  registerOAuthRoutes(app);
  setupQRAuthRoutes(app);
  setupConsentFormRoutes(app);
  registerMagicLinkRoutes(app);
  setupDeleteAccountRoutes(app);
  registerAuthRestRoutes(app);

  // NOTE: Test login endpoints removed for production security.
  // Use OAuth flow for all authentication in production.

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: Date.now() });
  });

  // REST API endpoint for pending invoices (bypass TRPC)
  app.get("/api/invoices/pending", async (req, res) => {
    try {
      // Check authentication
      const { COOKIE_NAME } = require('../../shared/const');
      const sessionToken = req.cookies[COOKIE_NAME];
      
      if (!sessionToken) {
        log.warn({ endpoint: "/api/invoices/pending" }, "No session token found");
        return res.status(401).json({ error: 'Not authenticated' });
      }
      
      // Get user from session
      let user = null;
      if (global.testSessions && global.testSessions.has(sessionToken)) {
        user = global.testSessions.get(sessionToken);
      }
      
      if (!user) {
        log.warn({ endpoint: "/api/invoices/pending" }, "Invalid session token");
        return res.status(401).json({ error: 'Invalid session' });
      }
      
      // Check if user is admin or finance
      if (user.role !== 'admin' && user.role !== 'finance') {
        log.warn({ endpoint: "/api/invoices/pending", userRole: user.role }, "User not authorized");
        return res.status(403).json({ error: 'Not authorized' });
      }
      
      // Query database for pending auto-generated invoices
      const { getDb } = require('../db');
      const { invoices, users, projects } = require('../../drizzle/schema');
      const { eq, and } = require('drizzle-orm');
      
      const db = await getDb();
      if (!db) {
        log.error({ endpoint: "/api/invoices/pending" }, "Database not available");
        return res.status(500).json({ error: 'Database not available' });
      }
      
      const result = await db
        .select({
          id: invoices.id,
          userId: invoices.userId,
          projectId: invoices.projectId,
          invoiceCode: invoices.invoiceCode,
          totalAmount: invoices.totalAmount,
          status: invoices.status,
          submittedAt: invoices.submittedAt,
          autoGenerated: invoices.autoGenerated,
          userName: users.name,
          userEmail: users.email,
          projectName: projects.name,
        })
        .from(invoices)
        .leftJoin(users, eq(invoices.userId, users.id))
        .leftJoin(projects, eq(invoices.projectId, projects.id))
        .where(
          and(
            eq(invoices.autoGenerated, true),
            eq(invoices.status, 'pending')
          )
        )
        .orderBy(invoices.submittedAt);
      
      log.debug({ endpoint: "/api/invoices/pending", count: result.length }, "Pending invoices retrieved");
      res.json({ success: true, invoices: result });
      
    } catch (error) {
      log.error({ endpoint: "/api/invoices/pending", error }, "Request failed");
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    log.warn({ preferredPort, actualPort: port }, "Preferred port unavailable, using alternative");
  }

  server.listen(port, "0.0.0.0", () => {
    log.info({ port, host: "0.0.0.0" }, "Server listening on all interfaces");
  });

  // Handle graceful shutdown
  process.on("SIGTERM", () => {
    log.info("SIGTERM received, shutting down gracefully");
    server.close(() => {
      log.info("Server closed");
      process.exit(0);
    });
  });

  process.on("SIGINT", () => {
    log.info("SIGINT received, shutting down gracefully");
    server.close(() => {
      log.info("Server closed");
      process.exit(0);
    });
  });

  // Handle unhandled rejections and exceptions
  process.on("unhandledRejection", (reason, promise) => {
    log.error({ reason, promise }, "Unhandled Rejection");
  });

  process.on("uncaughtException", (error) => {
    log.error(error, "Uncaught Exception");
    process.exit(1);
  });
}

startServer().catch((error) => {
  log.error(error, "Server startup failed");
  process.exit(1);
});
