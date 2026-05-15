const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

const resolveHttpFramework = (): "express" | "fastify" => {
  const configuredFramework = process.env.HTTP_FRAMEWORK?.toLowerCase();
  return configuredFramework === "fastify" ? "fastify" : "express";
};

const resolveCorsOrigins = (): string[] => {
  const configuredCorsOrigin = process.env.CORS_ORIGIN?.trim();
  if (!configuredCorsOrigin) {
    return ["http://localhost:3000", "http://localhost:3002"];
  }

  return configuredCorsOrigin
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

export const env = {
  jwtAccessSecret:     requireEnv("JWT_ACCESS_SECRET"),
  jwtRefreshSecret:    requireEnv("JWT_REFRESH_SECRET"),
  databaseUrl:         requireEnv("DATABASE_URL"),
  stripeSecretKey:     requireEnv("STRIPE_SECRET_KEY"),
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  httpFramework:       resolveHttpFramework(),
  corsOrigins:         resolveCorsOrigins(),
  port:                process.env.PORT ?? "3001",
};