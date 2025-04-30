import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { compare } from "bcrypt";
import { storage } from "./storage";
import { User } from "@shared/schema";
import crypto from "crypto";

declare global {
  namespace Express {
    interface User extends User {}
  }
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      secure: process.env.NODE_ENV === "production",
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user) {
            return done(null, false, { message: "Incorrect email or password" });
          }
          
          const isMatch = await compare(password, user.password);
          if (!isMatch) {
            return done(null, false, { message: "Incorrect email or password" });
          }
          
          // Check if user is blocked
          if (user.status === "blocked") {
            return done(null, false, { message: "Account is blocked. Please contact support." });
          }
          
          // Update last login time
          await storage.updateUser(user.id, { 
            lastLoginAt: new Date() 
          });
          
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/auth/register", async (req, res, next) => {
    try {
      const { role, ...userData } = req.body;
      
      // Check if email already exists
      const existingUserByEmail = await storage.getUserByEmail(userData.email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }
      
      // Check if username already exists
      const existingUserByUsername = await storage.getUserByUsername(userData.username);
      if (existingUserByUsername) {
        return res.status(400).json({ message: "Username already in use" });
      }
      
      // Set initial status based on role
      let status = "active";
      if (role === "teacher") {
        status = "pending"; // Teachers need admin approval
      } else if (role === "admin") {
        return res.status(403).json({ message: "Admin accounts can only be created by system administrators" });
      }
      
      // Create user
      const user = await storage.createUser({
        ...userData,
        role: role || "student",
        status,
      });
      
      // Create profile based on role
      if (role === "student") {
        await storage.createStudentProfile({
          userId: user.id,
          subjects: req.body.subjects || "",
          interests: req.body.interests || "",
          gradeLevel: req.body.gradeLevel,
          bio: req.body.bio,
        });
      } else if (role === "teacher") {
        await storage.createTeacherProfile({
          userId: user.id,
          expertise: req.body.expertise || "",
          level: req.body.level || "intermediate",
          bio: req.body.bio || "",
          demoVideoUrl: req.body.demoVideoUrl,
          isAnonymous: false,
          donationEnabled: true,
        });
      }
      
      // If the user is a student, log them in automatically
      if (role === "student") {
        req.login(user, (err) => {
          if (err) return next(err);
          return res.status(201).json(user);
        });
      } else {
        // If teacher, just return the user without logging in (pending approval)
        return res.status(201).json({
          ...user,
          message: "Your account has been created and is pending approval",
        });
      }
    } catch (error) {
      console.error("Registration error:", error);
      return res.status(500).json({ message: "An error occurred during registration" });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info.message || "Authentication failed" });
      }
      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        return res.json(user);
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Don't send password hash to the client
    const user = req.user as User;
    const { password, ...userWithoutPassword } = user;
    
    res.json(userWithoutPassword);
  });

  app.get("/api/auth/session", (req, res) => {
    res.json({
      isAuthenticated: req.isAuthenticated(),
      user: req.user ? {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        username: req.user.username,
        role: req.user.role,
        profileImage: req.user.profileImage,
        preferredLanguage: req.user.preferredLanguage,
        timezone: req.user.timezone,
      } : null,
    });
  });
}

// Middleware for checking authentication
export function isAuthenticated(req: Express.Request, res: Express.Response, next: Express.NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Authentication required" });
}

// Middleware for checking roles
export function hasRole(roles: string[]) {
  return (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const userRole = req.user.role;
    if (roles.includes(userRole)) {
      return next();
    }
    
    res.status(403).json({ message: "Insufficient permissions" });
  };
}

// Middleware for admin only
export function isAdmin(req: Express.Request, res: Express.Response, next: Express.NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  if (req.user.role === "admin") {
    return next();
  }
  
  res.status(403).json({ message: "Admin access required" });
}

// Middleware for teacher or admin
export function isTeacherOrAdmin(req: Express.Request, res: Express.Response, next: Express.NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  if (req.user.role === "teacher" || req.user.role === "admin") {
    return next();
  }
  
  res.status(403).json({ message: "Teacher or admin access required" });
}

// Middleware to check if user is blocked from a country
export function countryBlockCheck(req: Express.Request, res: Express.Response, next: Express.NextFunction) {
  if (!req.isAuthenticated()) {
    return next(); // Let the regular auth middleware handle this
  }
  
  const user = req.user;
  const clientCountry = req.headers["x-client-country"] as string; // Assuming this is set by a proxy or similar
  
  if (clientCountry && user.blockedFromCountries && user.blockedFromCountries.includes(clientCountry)) {
    req.logout((err) => {
      if (err) console.error("Error during logout:", err);
      return res.status(403).json({ message: "Access from your country is restricted" });
    });
    return;
  }
  
  next();
}