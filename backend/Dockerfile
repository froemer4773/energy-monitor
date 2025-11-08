# Backend Dockerfile
FROM node:node:latest

# Arbeitsverzeichnis erstellen
WORKDIR /app

# Package files kopieren
COPY package*.json ./

# Dependencies installieren
RUN npm ci --only=production

# App-Code kopieren
COPY . .

# Logs-Verzeichnis erstellen
RUN mkdir -p /app/logs

# Non-root User erstellen
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

# Zu Non-root User wechseln
USER nodejs

# Port exponieren
EXPOSE 3003

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3003/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# App starten
CMD ["node", "server.js"]