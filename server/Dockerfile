# Backend Dockerfile for Railway deployment
# Build context is the repo root (Railway sets rootDirectory=/server for detection,
# but the Docker build context remains the full repository root).
#
# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package manifests and lock file from repo root
COPY package.json package-lock.json ./

# Install all dependencies
RUN npm ci

# Copy full source (needed for server/, shared/, drizzle/ etc.)
COPY . .

# Build the server bundle (outputs to dist/index.js)
RUN npm run build

# Stage 2: Runtime
FROM node:22-alpine

WORKDIR /app

# Copy package manifests and lock file
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built bundle from builder stage
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start server
CMD ["npm", "start"]
