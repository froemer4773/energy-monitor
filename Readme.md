# Energie Monitor - Docker Deployment Anleitung

## 📋 Voraussetzungen

- Docker Engine 20.10+
- Docker Compose 2.0+
- Mind. 2GB RAM verfügbar
- Port 8080 verfügbar (oder anpassen)

---

## 🏗️ Projekt-Struktur

```
energy-monitor/
├── docker-compose.yml
├── .env
├── init-db.sql
├── backend/
│   ├── Dockerfile
│   ├── server.js
│   ├── package.json
│   └── package-lock.json
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    ├── angular.json
    └── src/
        └── ... (Angular App)
```

---

## 🚀 Deployment Schritte

### Schritt 1: Projekt vorbereiten

```bash
# Projekt-Verzeichnis erstellen
mkdir -p energy-monitor
cd energy-monitor

# Unterverzeichnisse erstellen
mkdir -p backend frontend
```

### Schritt 2: Dateien kopieren

Kopiere folgende Dateien in die entsprechenden Ordner:

#### **Root-Verzeichnis:**
- `docker-compose.yml`
- `.env`
- `init-db.sql`

#### **backend/**
- `Dockerfile`
- `server.js` (Docker-optimierte Version)
- `package.json`

#### **frontend/**
- `Dockerfile`
- `nginx.conf`
- Komplette Angular App (src/, package.json, angular.json, etc.)

### Schritt 3: .env anpassen

```bash
nano .env
```

Passe die Passwörter an:
```env
DB_ROOT_PASSWORD=IhrSicheresRootPasswort123!
DB_PASSWORD=IhrSicheresUserPasswort456!
FRONTEND_PORT=8080
```

### Schritt 4: Backend package.json

Erstelle `backend/package.json`:
```json
{
  "name": "energy-monitor-backend",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mysql2": "^3.6.5",
    "cors": "^2.8.5"
  }
}
```

### Schritt 5: Build und Start

```bash
# Images bauen
docker-compose build

# Container starten
docker-compose up -d

# Logs anzeigen
docker-compose logs -f
```

### Schritt 6: Überprüfung

```bash
# Container Status
docker-compose ps

# Sollte zeigen:
# energy-monitor-db         Up (healthy)
# energy-monitor-backend    Up (healthy)
# energy-monitor-frontend   Up (healthy)

# Backend testen
curl http://localhost:8080/api/energy

# Frontend öffnen
# http://localhost:8080
```

---

## 🔧 Verwaltungsbefehle

### Container Management

```bash
# Starten
docker-compose up -d

# Stoppen
docker-compose stop

# Neu starten
docker-compose restart

# Stoppen und entfernen
docker-compose down

# Mit Volumes entfernen (ACHTUNG: Datenverlust!)
docker-compose down -v
```

### Logs

```bash
# Alle Logs
docker-compose logs -f

# Nur Backend
docker-compose logs -f backend

# Nur Datenbank
docker-compose logs -f mariadb

# Letzte 50 Zeilen
docker-compose logs --tail=50
```

### Updates durchführen

```bash
# 1. Code aktualisieren
git pull  # oder Dateien manuell aktualisieren

# 2. Neu bauen
docker-compose build --no-cache

# 3. Container neu starten
docker-compose up -d

# 4. Alte Images aufräumen
docker image prune -f
```

---

## 🗄️ Datenbank-Management

### Datenbank-Zugriff

```bash
# MySQL Shell öffnen
docker-compose exec mariadb mysql -u root -p

# Mit User-Account
docker-compose exec mariadb mysql -u energy_user -p energy_monitor
```

### Backup erstellen

```bash
# Backup erstellen
docker-compose exec mariadb mysqldump -u root -p energy_monitor > backup_$(date +%Y%m%d).sql

# Backup mit Compression
docker-compose exec mariadb mysqldump -u root -p energy_monitor | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Backup wiederherstellen

```bash
# SQL-Datei
docker-compose exec -T mariadb mysql -u root -p energy_monitor < backup.sql

# Komprimierte Datei
gunzip < backup.sql.gz | docker-compose exec -T mariadb mysql -u root -p energy_monitor
```

---

## 🔒 Sicherheit

### SSL/TLS mit Traefik (Empfohlen)

Wenn du bereits Traefik verwendest, füge diese Labels zu `docker-compose.yml` hinzu:

```yaml
frontend:
  labels:
    - "traefik.enable=true"
    - "traefik.http.routers.energy-monitor.rule=Host(`energy.yourdomain.com`)"
    - "traefik.http.routers.energy-monitor.entrypoints=websecure"
    - "traefik.http.routers.energy-monitor.tls.certresolver=letsencrypt"
    - "traefik.http.services.energy-monitor.loadbalancer.server.port=80"
  networks:
    - traefik-network
    - energy-network

networks:
  traefik-network:
    external: true
```

### SSL/TLS mit Nginx Proxy Manager

Konfiguriere einen Proxy Host:
- Domain: `energy.yourdomain.com`
- Forward Hostname: `energy-monitor-frontend`
- Forward Port: `80`
- SSL: Let's Encrypt aktivieren

### Firewall-Regeln

```bash
# Port nur für localhost (wenn Reverse Proxy verwendet)
sudo ufw allow from 127.0.0.1 to any port 8080

# Oder für alle (ohne Reverse Proxy)
sudo ufw allow 8080/tcp
```

---

## 📊 Monitoring

### Health Checks

```bash
# Manueller Health Check
curl http://localhost:8080/api/health

# Docker Health Status
docker inspect --format='{{.State.Health.Status}}' energy-monitor-backend
```

### Resource Usage

```bash
# Container Stats
docker stats

# Nur Energy Monitor
docker stats energy-monitor-frontend energy-monitor-backend energy-monitor-db
```

### Logs rotieren

Erstelle `/etc/docker/daemon.json`:
```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

Dann Docker neu starten:
```bash
sudo systemctl restart docker
```

---

## 🔄 Automatische Updates (Watchtower)

```yaml
# In docker-compose.yml hinzufügen
  watchtower:
    image: containrrr/watchtower
    container_name: watchtower
    restart: unless-stopped
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    command: --interval 86400 energy-monitor-frontend energy-monitor-backend
```

---

## 🐛 Troubleshooting

### Problem: Container startet nicht

```bash
# Logs prüfen
docker-compose logs

# Container Status
docker-compose ps

# Einzelnen Container prüfen
docker logs energy-monitor-backend
```

### Problem: Datenbank nicht erreichbar

```bash
# Datenbank-Container prüfen
docker-compose exec mariadb mysql -u root -p -e "SELECT 1"

# Netzwerk prüfen
docker network inspect energy-monitor_energy-network
```

### Problem: Frontend zeigt Fehler

```bash
# Nginx-Konfiguration testen
docker-compose exec frontend nginx -t

# Nginx neu laden
docker-compose exec frontend nginx -s reload
```

### Problem: Backend API nicht erreichbar

```bash
# Health Check
curl http://localhost:8080/api/health

# Backend direkt testen (innerhalb Docker)
docker-compose exec frontend wget -O- http://backend:3000/api/energy
```

### Port bereits belegt

```bash
# Ändere FRONTEND_PORT in .env
FRONTEND_PORT=8081

# Oder finde den Prozess
sudo lsof -i :8080
```

---

## 📈 Performance-Optimierung

### MariaDB Tuning

Erstelle `mariadb/my.cnf`:
```ini
[mysqld]
innodb_buffer_pool_size = 256M
max_connections = 50
query_cache_type = 1
query_cache_size = 32M
```

Mounte in docker-compose.yml:
```yaml
volumes:
  - ./mariadb/my.cnf:/etc/mysql/conf.d/custom.cnf:ro
```

### Nginx Caching

Bereits in `nginx.conf` konfiguriert mit:
- Gzip Kompression
- Browser Caching für statische Assets
- Optimierte Proxy-Settings

---

## 🔐 Backup-Strategie

### Automatisches Backup-Script

Erstelle `backup.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/path/to/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Datenbank-Backup
docker-compose exec -T mariadb mysqldump -u root -p$DB_ROOT_PASSWORD energy_monitor | \
  gzip > "$BACKUP_DIR/db_backup_$DATE.sql.gz"

# Alte Backups löschen (älter als 30 Tage)
find "$BACKUP_DIR" -name "db_backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: db_backup_$DATE.sql.gz"
```

Cronjob einrichten:
```bash
# Täglich um 2 Uhr
0 2 * * * /path/to/backup.sh >> /var/log/energy-monitor-backup.log 2>&1
```

---

## 📞 Support

Bei Problemen:
1. Logs prüfen: `docker-compose logs`
2. Health Checks testen
3. Netzwerk überprüfen
4. Volumes überprüfen

---

## 🎉 Fertig!

Die App ist jetzt verfügbar unter:
**http://your-server-ip:8080**

Oder mit Domain:
**https://energy.yourdomain.com**