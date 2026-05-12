# Use slim node image for production
FROM node:18-slim AS base

# Set working directory
WORKDIR /app

# Install dependencies first (for caching)
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Create a non-root user and set permissions
RUN groupadd -r nodejs && useradd -r -g nodejs nodejs \
    && chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Start application
CMD ["node", "server.js"]
