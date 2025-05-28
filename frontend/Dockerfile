# Frontend Dockerfile - React TypeScript
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first (for Docker layer caching)
COPY package*.json ./

# Install dependencies (use npm install instead of npm ci for development)
RUN npm install

# Copy application code
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S reactuser -u 1001
RUN chown -R reactuser:nodejs /app
USER reactuser

# Expose port
EXPOSE 3000

# Command to run the application
CMD ["npm", "start"]