# --- Stage 1: Build ---
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (all)
COPY package*.json ./
RUN npm install

# Copy source and config
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the application (TS to JS)
RUN npm run build

# --- Stage 2: Production ---
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies
RUN npm install --omit=dev

# Copy built files and prisma schema from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.* ./

# RE-GENERATE Prisma Client in the production node_modules
# This ensures .prisma/client exists in the final container
RUN npx prisma generate

# Expose the API port
EXPOSE 3001

# Command to start the application
CMD ["node", "dist/index.js"]