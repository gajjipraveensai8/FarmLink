# -------------- BUILD STAGE --------------
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev for build if needed)
RUN npm ci

# Copy source code
COPY . .

# -------------- PRODUCTION STAGE --------------
FROM node:20-alpine

# Set to Production environment
ENV NODE_ENV=production

WORKDIR /usr/src/app

# Only grab package.json and package-lock
COPY package*.json ./

# Install ONLY production dependencies to keep image small
RUN npm ci --omit=dev

# Copy source code from builder (avoiding local node_modules)
COPY --from=builder /usr/src/app/src ./src

# Create non-root user for security (FAANG Standard)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN mkdir -p /usr/src/app/logs && chown -R appuser:appgroup /usr/src/app

USER appuser

EXPOSE 5000

# Run via node directly (Not nodemon)
CMD ["node", "src/server.js"]
