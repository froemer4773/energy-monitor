# Multi-stage Build für Angular App

# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Package files kopieren
COPY package*.json ./

# Dependencies installieren
RUN npm ci

# App-Code kopieren
COPY . .

# Production Build
RUN npm run build -- --configuration production
#RUN npm install

# Stage 2: Nginx Server
FROM nginx:alpine

# Nginx Konfiguration kopieren
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Built App von Builder Stage kopieren
COPY --from=builder /app/dist/energy-app/browser /usr/share/nginx/html

# Non-root User
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80 || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]