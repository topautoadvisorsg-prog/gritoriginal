import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { env } from "../../config/env";
import {
  discovery,
  randomPKCECodeVerifier,
  calculatePKCECodeChallenge,
  buildAuthorizationUrl,
  authorizationCodeGrant,
  randomState,
  fetchUserInfo,
  type Configuration,
} from "openid-client";

const PgStore = connectPg(session);
export const sessionStore = new PgStore({
  conObject: {
    connectionString: env.DATABASE_URL,
  },
  createTableIfMissing: true,
  ttl: 7 * 24 * 60 * 60,
});

export const sessionMiddleware = session({
  secret: env.SESSION_SECRET,
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: "lax",
  },
});

export function getSession() {
  return sessionMiddleware;
}

// Lazily discover and cache the OIDC configuration
let oidcConfig: Configuration | null = null;
async function getOIDCConfig(): Promise<Configuration> {
  if (!oidcConfig) {
    oidcConfig = await discovery(
      new URL("https://replit.com/oidc"),
      env.REPL_ID || ""
    );
  }
  return oidcConfig;
}

// Determine the absolute callback URL from environment variables
function getCallbackURL(): string {
  // Explicit override for production custom domain (e.g. grtix.replit.app)
  if (process.env.CUSTOM_DOMAIN) {
    return `https://${process.env.CUSTOM_DOMAIN}/api/callback`;
  }
  if (env.REPLIT_DEV_DOMAIN) {
    return `https://${env.REPLIT_DEV_DOMAIN}/api/callback`;
  }
  if (env.REPLIT_DOMAINS) {
    const first = env.REPLIT_DOMAINS.split(",")[0].trim();
    return `https://${first}/api/callback`;
  }
  return "http://localhost:3001/api/callback";
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Pre-warm the OIDC discovery to catch config errors at startup
  try {
    await getOIDCConfig();
  } catch (err) {
    console.error("OIDC discovery failed:", err);
  }

  passport.serializeUser((user: Express.User, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(
    async (
      id: string,
      done: (err: Error | null, user?: Express.User | false) => void
    ) => {
      try {
        const user = await storage.getUser(id);
        if (!user) return done(null, false);

        const ADMIN_EMAIL_VALUE = env.ADMIN_EMAIL;
        if (ADMIN_EMAIL_VALUE && user.email === ADMIN_EMAIL_VALUE && user.role !== "admin") {
          await storage.upsertUser({ id: user.id, role: "admin" });
          user.role = "admin";
        }

        done(null, user as Express.User);
      } catch (err) {
        done(err instanceof Error ? err : new Error(String(err)), false);
      }
    }
  );
}

/**
 * Register Replit OIDC login/callback/logout routes.
 */
export function registerReplitOIDCRoutes(app: Express) {
  const callbackURL = getCallbackURL();

  app.get("/api/login", async (req, res) => {
    try {
      const config = await getOIDCConfig();

      // Generate PKCE pair — openid-client handles this natively
      const codeVerifier = randomPKCECodeVerifier();
      const codeChallenge = await calculatePKCECodeChallenge(codeVerifier);
      const state = randomState();

      // Persist in session so callback can retrieve them
      // @ts-ignore
      req.session.pkce_verifier = codeVerifier;
      // @ts-ignore
      req.session.oauth_state = state;

      // Save session explicitly before redirecting so the values are committed
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).send("Authentication setup failed");
        }

        const redirectUrl = buildAuthorizationUrl(config, {
          redirect_uri: callbackURL,
          scope: "openid email profile",
          code_challenge: codeChallenge,
          code_challenge_method: "S256",
          state,
        });

        res.redirect(redirectUrl.href);
      });
    } catch (err) {
      console.error("Login initiation error:", err);
      res.status(500).send("Authentication failed");
    }
  });

  app.get("/api/callback", async (req, res) => {
    try {
      const config = await getOIDCConfig();

      // @ts-ignore
      const codeVerifier: string | undefined = req.session.pkce_verifier;
      // @ts-ignore
      const expectedState: string | undefined = req.session.oauth_state;

      if (!codeVerifier || !expectedState) {
        console.warn("Missing PKCE verifier or state in session — restarting login");
        return res.redirect("/api/login");
      }

      // Reconstruct the full callback URL (with code + state query params)
      // openid-client needs this to extract the authorization response
      const incomingSearch = new URL(req.url, "http://localhost").search;
      const currentUrl = new URL(callbackURL + incomingSearch);

      // Exchange the authorization code for tokens — sends code_verifier natively
      const tokens = await authorizationCodeGrant(config, currentUrl, {
        pkceCodeVerifier: codeVerifier,
        expectedState,
      });

      // Clean up session PKCE state
      // @ts-ignore
      delete req.session.pkce_verifier;
      // @ts-ignore
      delete req.session.oauth_state;

      const claims = tokens.claims();
      const sub = String(claims?.sub ?? "");

      if (!sub) {
        console.error("No sub claim in ID token");
        return res.redirect("/api/login");
      }

      // Fetch full user profile from userinfo endpoint
      let profile: Record<string, unknown> = {};
      if (tokens.access_token) {
        try {
          profile = (await fetchUserInfo(config, tokens.access_token, sub)) as Record<string, unknown>;
        } catch (e) {
          console.warn("UserInfo fetch failed, falling back to ID token claims:", e);
        }
      }

      const ADMIN_EMAIL = env.ADMIN_EMAIL;
      const emailValue = String(profile.email ?? claims?.email ?? "") || null;

      const user = await storage.upsertUser({
        id: sub,
        email: emailValue,
        firstName: String(profile.first_name ?? claims?.first_name ?? "") || null,
        lastName: String(profile.last_name ?? claims?.last_name ?? "") || null,
        profileImageUrl: String(profile.profile_image_url ?? claims?.profile_image_url ?? "") || null,
        ...(ADMIN_EMAIL && emailValue === ADMIN_EMAIL ? { role: "admin" } : {}),
      });

      req.login(user as Express.User, (err) => {
        if (err) {
          console.error("Session login error:", err);
          return res.redirect("/api/login");
        }
        res.redirect("/");
      });
    } catch (err) {
      console.error("Callback error:", err);
      res.redirect("/api/login");
    }
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect("/");
    });
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};
