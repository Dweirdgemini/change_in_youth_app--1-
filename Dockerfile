# Multi-stage build for Change In Youth backend
# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Enable corepack and prepare pnpm with explicit version
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Create pnpm store directory with proper permissions
RUN mkdir -p /pnpm/store && chmod -R 777 /pnpm

# Set pnpm environment variables
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

# Configure pnpm store location
RUN pnpm config set store-dir /pnpm/store

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies (without --frozen-lockfile to avoid lockfile mismatch issues)
RUN pnpm install

# Copy source code
COPY . .

# Build server bundle
RUN npm run build

# Stage 2: Runtime
FROM node:22-alpine

WORKDIR /app

# Enable corepack and prepare pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Create pnpm store directory with proper permissions
RUN mkdir -p /pnpm/store && chmod -R 777 /pnpm

# Set pnpm environment variables
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

# Configure pnpm store location
RUN pnpm config set store-dir /pnpm/store

# Copy package files from builder
COPY package.json pnpm-lock.yaml ./

# Install production dependencies only
RUN pnpm install --prod

# Copy built bundle from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start server
CMD ["npm", "start"]
