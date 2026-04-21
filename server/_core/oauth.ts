import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const.js";

import type { Express, Request, Response } from "express";

import { getUserByOpenId, upsertUser } from "../db";

import { getSessionCookieOptions } from "./cookies";

import { sdk } from "./sdk";



function getQueryParam(req: Request, key: string): string | undefined {

  const value = req.query[key];

  return typeof value === "string" ? value : undefined;

}



async function syncUser(userInfo: {

  openId?: string | null;

  name?: string | null;

  email?: string | null;

  loginMethod?: string | null;

  platform?: string | null;

}) {

  if (!userInfo.openId) {

    throw new Error("openId missing from user info");

  }



  const lastSignedIn = new Date();

  await upsertUser({

    openId: userInfo.openId,

    name: userInfo.name || null,

    email: userInfo.email ?? null,

    loginMethod: userInfo.loginMethod ?? userInfo.platform ?? "oauth",

    lastSignedIn,

  });

  const saved = await getUserByOpenId(userInfo.openId);

  return (

    saved ?? {

      openId: userInfo.openId,

      name: userInfo.name,

      email: userInfo.email,

      loginMethod: userInfo.loginMethod ?? null,

      lastSignedIn,

    }

  );

}



function buildUserResponse(

  user:

    | Awaited<ReturnType<typeof getUserByOpenId>>

    | {

        openId: string;

        name?: string | null;

        email?: string | null;

        loginMethod?: string | null;

        lastSignedIn?: Date | null;

      },

) {

  return {

    id: (user as any)?.id ?? null,

    openId: user?.openId ?? null,

    name: user?.name ?? null,

    email: user?.email ?? null,

    loginMethod: user?.loginMethod ?? null,

    lastSignedIn: (user?.lastSignedIn ?? new Date()).toISOString(),

  };

}



export function registerOAuthRoutes(app: Express) {

  app.get("/api/oauth/callback", async (req: Request, res: Response) => {

    const code = getQueryParam(req, "code");

    const state = getQueryParam(req, "state");



    if (!code || !state) {

      res.status(400).json({ error: "code and state are required" });

      return;

    }



    try {

      const tokenResponse = await sdk.exchangeCodeForToken(code, state);

      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      const user = await syncUser(userInfo);

      const sessionToken = await sdk.createSessionToken(userInfo.openId!, {

        name: userInfo.name || "",

        expiresInMs: ONE_YEAR_MS,

      });



      const cookieOptions = getSessionCookieOptions(req);

      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });



      // Redirect to the frontend URL with session token in query params

      const frontendUrl =

        process.env.EXPO_WEB_PREVIEW_URL ||

        process.env.EXPO_PACKAGER_PROXY_URL ||

        "http://localhost:8081";

      

      const userInfo64 = Buffer.from(

        JSON.stringify({

          id: (user as any)?.id ?? null,

          openId: user?.openId ?? null,

          name: user?.name ?? null,

          email: user?.email ?? null,

          loginMethod: user?.loginMethod ?? null,

          lastSignedIn: (user?.lastSignedIn ?? new Date()).toISOString(),

        })

      ).toString("base64");

      

      const redirectUrl = `${frontendUrl}/oauth/callback?sessionToken=${encodeURIComponent(sessionToken)}&user=${encodeURIComponent(userInfo64)}`;

      res.redirect(302, redirectUrl);

    } catch (error) {

      console.error("[OAuth] Callback failed", error);

      res.status(500).json({ error: "OAuth callback failed" });

    }

  });



  app.get("/api/oauth/mobile", async (req: Request, res: Response) => {

    const requestId = `mobile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const code = getQueryParam(req, "code");

    const state = getQueryParam(req, "state");



    console.log(`[OAuth Mobile ${requestId}] Request received:`, {

      hasCode: !!code,

      hasState: !!state,

      code: code?.substring(0, 20) + "...",

      state: state?.substring(0, 20) + "...",

      userAgent: req.get('User-Agent'),

      referer: req.get('Referer')

    });



    if (!code || !state) {

      console.error(`[OAuth Mobile ${requestId}] Missing parameters:`, { hasCode: !!code, hasState: !!state });

      res.status(400).json({ error: "code and state are required" });

      return;

    }



    try {

      // Decode state to extract deep link

      let deepLink: string | undefined;

      try {

        const stateDecoded = Buffer.from(state, "base64").toString("utf-8");

        const stateData = JSON.parse(stateDecoded);

        deepLink = stateData.deepLink;

        console.log(`[OAuth Mobile ${requestId}] State decoded successfully:`, { deepLink });

      } catch (e) {

        console.log(`[OAuth Mobile ${requestId}] Could not parse state as JSON:`, e);

      }



      console.log(`[OAuth Mobile ${requestId}] Exchanging code for token...`);

      const tokenResponse = await sdk.exchangeCodeForToken(code, state);

      console.log(`[OAuth Mobile ${requestId}] Token exchange successful:`, {

        hasAccessToken: !!tokenResponse.accessToken,

        tokenType: tokenResponse.tokenType

      });



      console.log(`[OAuth Mobile ${requestId}] Getting user info...`);

      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      console.log(`[OAuth Mobile ${requestId}] User info retrieved:`, {

        openId: userInfo.openId,

        name: userInfo.name,

        email: userInfo.email,

        loginMethod: userInfo.loginMethod

      });



      console.log(`[OAuth Mobile ${requestId}] Syncing user...`);

      const user = await syncUser(userInfo);

      console.log(`[OAuth Mobile ${requestId}] User synced:`, { userId: (user as any)?.id });



      console.log(`[OAuth Mobile ${requestId}] Creating session token...`);

      const sessionToken = await sdk.createSessionToken(userInfo.openId!, {

        name: userInfo.name || "",

        expiresInMs: ONE_YEAR_MS,

      });

      console.log(`[OAuth Mobile ${requestId}] Session token created successfully`);



      const cookieOptions = getSessionCookieOptions(req);

      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });



      // Check if we have a deep link from state

      if (deepLink && deepLink.startsWith("manus")) {

        console.log(`[OAuth Mobile ${requestId}] Mobile app detected, returning HTML redirect`);

        // Mobile app - return HTML page that triggers deep link

        const deepLinkWithToken = `${deepLink}?sessionToken=${encodeURIComponent(sessionToken)}&userId=${'id' in user ? user.id : ""}`;

        res.send(`

          <!DOCTYPE html>

          <html>

          <head>

            <meta charset="utf-8">

            <meta name="viewport" content="width=device-width, initial-scale=1">

            <title>Redirecting to App...</title>

            <style>

              body {

                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

                display: flex;

                align-items: center;

                justify-content: center;

                min-height: 100vh;

                margin: 0;

                background: #f5f5f5;

              }

              .container {

                text-align: center;

                padding: 2rem;

                background: white;

                border-radius: 12px;

                box-shadow: 0 2px 8px rgba(0,0,0,0.1);

                max-width: 400px;

              }

              h1 { color: #333; font-size: 1.5rem; margin-bottom: 1rem; }

              p { color: #666; margin-bottom: 1.5rem; }

              .spinner {

                border: 3px solid #f3f3f3;

                border-top: 3px solid #0a7ea4;

                border-radius: 50%;

                width: 40px;

                height: 40px;

                animation: spin 1s linear infinite;

                margin: 0 auto 1rem;

              }

              @keyframes spin {

                0% { transform: rotate(0deg); }

                100% { transform: rotate(360deg); }

              }

              a { color: #0a7ea4; text-decoration: none; }

            </style>

          </head>

          <body>

            <div class="container">

              <div class="spinner"></div>

              <h1>Opening App...</h1>

              <p>You will be redirected to the app in a moment.</p>

              <p><small>If the app doesn't open automatically, <a href="${deepLinkWithToken}">tap here</a>.</small></p>

            </div>

            <script>

              // Immediately trigger deep link

              window.location.href = "${deepLinkWithToken}";

              

              // Fallback: try again after 1 second

              setTimeout(function() {

                window.location.href = "${deepLinkWithToken}";

              }, 1000);

            </script>

          </body>

          </html>

        `);

      } else {

        console.log(`[OAuth Mobile ${requestId}] API request detected, returning JSON`);

        // API request - return JSON

        res.json({

          app_session_id: sessionToken,

          user: buildUserResponse(user),

        });

      }

    } catch (error) {

      console.error(`[OAuth Mobile ${requestId}] Mobile exchange failed:`, {

        error: error instanceof Error ? error.message : String(error),

        stack: error instanceof Error ? error.stack : undefined,

        code: code?.substring(0, 20) + "...",

        state: state?.substring(0, 20) + "..."

      });

      res.status(500).json({ 

        error: "OAuth mobile exchange failed",

        details: error instanceof Error ? error.message : "Unknown error"

      });

    }

  });



  app.post("/api/auth/logout", (req: Request, res: Response) => {

    const cookieOptions = getSessionCookieOptions(req);

    res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });

    res.json({ success: true });

  });



  // Get current authenticated user - works with both cookie (web) and Bearer token (mobile)

  app.get("/api/auth/me", async (req: Request, res: Response) => {

    try {

      const user = await sdk.authenticateRequest(req);

      res.json({ user: buildUserResponse(user) });

    } catch (error) {

      console.error("[Auth] /api/auth/me failed:", error);

      res.status(401).json({ error: "Not authenticated", user: null });

    }

  });



  // Establish session cookie from Bearer token

  // Used by iframe preview: frontend receives token via postMessage, then calls this endpoint

  // to get a proper Set-Cookie response from the backend (3000-xxx domain)

  app.post("/api/auth/session", async (req: Request, res: Response) => {

    try {

      // Authenticate using Bearer token from Authorization header

      const user = await sdk.authenticateRequest(req);



      // Get the token from the Authorization header to set as cookie

      const authHeader = req.headers.authorization || req.headers.Authorization;

      if (typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {

        res.status(400).json({ error: "Bearer token required" });

        return;

      }

      const token = authHeader.slice("Bearer ".length).trim();



      // Set cookie for this domain (3000-xxx)

      const cookieOptions = getSessionCookieOptions(req);

      res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });



      res.json({ success: true, user: buildUserResponse(user) });

    } catch (error) {

      console.error("[Auth] /api/auth/session failed:", error);

      res.status(401).json({ error: "Invalid token" });

    }

  });

}

