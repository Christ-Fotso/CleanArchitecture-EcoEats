import rateLimit from "express-rate-limit";

const isTest = process.env.NODE_ENV === "test" || process.env.SKIP_RATE_LIMIT === "true";

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isTest ? 99999 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts, please try again later" },
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: isTest ? 99999 : 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many registration attempts, please try again later" },
});
