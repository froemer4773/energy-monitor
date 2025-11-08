# Energie Monitor - Installations- und Deployment-Anleitung

## 📋 Übersicht

Diese Anleitung führt Sie durch die komplette Installation der Energie-Monitor-Anwendung mit Angular 20 Frontend, Node.js Backend und MariaDB Datenbank.

---

## 🔧 Voraussetzungen

### Software installieren:
- **Node.js** (Version 18 oder höher) - [Download](https://nodejs.org/)
- **MariaDB** (Version 10.5 oder höher) - [Download](https://mariadb.org/download/)
- **Angular CLI** (Version 20) - Installation siehe unten
- **Git** (optional) - [Download](https://git-scm.com/)

---

## 📦 Installation

### 1. MariaDB einrichten

```bash
# MariaDB starten (Linux/Mac)
sudo systemctl start mariadb

# MariaDB starten (Windows - im MariaDB Terminal)
net start MariaDB

# MariaDB Root-Login
mysql -u root -p
```

### 2. Backend einrichten

```bash
# Neues Verzeichnis erstellen
mkdir energy-monitor-backend
cd energy-monitor-backend

# Dateien erstellen
# Kopieren Sie die folgenden Dateien in dieses Verzeichnis:
# - server.js
# - config.json
# - package.json
# - setup-database.js

# Dependencies installieren
npm install

# config.json anpassen
# Öffnen Sie config.json und passen Sie die Datenbankzugangsdaten an:
{
  "database": {
    "host": "localhost",
    "port": 3306,
    "user": "energy_user",
    "password": "IhrSicheresPasswort123!",
    "database": "energy_monitor"
  }
}

# setup-database.js anpassen
# Öffnen Sie setup-database.js und setzen Sie Ihr MariaDB Root-Passwort
# Zeile 17: password: 'IhrRootPasswort'

# Datenbank initialisieren
npm run setup-db

# Server starten
npm start
```

Der Backend-Server läuft jetzt auf **http://localhost:3000**

### 3. Angular Frontend einrichten

```bash
# In ein neues Verzeichnis wechseln
cd ..
mkdir energy-monitor-frontend
cd energy-monitor-frontend

# Angular CLI installieren (falls noch nicht vorhanden)
npm install -g @angular/cli@20

# Neue Angular App erstellen
ng new energy-app --routing --style=css

# In das App-Verzeichnis wechseln
cd energy-app

# Dependencies installieren
npm install recharts lucide-react

# API Service erstellen
ng generate service services/energy

# Component erstellen
ng generate component components/energy-tracker
```

Nun müssen Sie den Code des Frontends einfügen:

#### **src/app/services/energy.service.ts**
```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface EnergyData {
  id?: number;
  monat: string;
  gas_kwh: number;
  wasser_m3: number;
  solar_kwh: number;
  impulse: number;
  strom_180_kwh: number;
  strom_280_kwh: number;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EnergyService {
  private apiUrl = 'http://localhost:3000/api/energy';

  constructor(private http: HttpClient) { }

  getAll(): Observable<EnergyData[]> {
    return this.http.get<EnergyData[]>(this.apiUrl);
  }

  getByMonth(monat: string): Observable<EnergyData> {
    return this.http.get<EnergyData>(`${this.apiUrl}/${monat}`);
  }

  create(data: EnergyData): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  update(monat: string, data: EnergyData): Observable<any> {
    return this.http.put(`${this.apiUrl}/${monat}`, data);
  }

  delete(monat: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${monat}`);
  }
}
```

#### **src/app/app.module.ts** (falls Angular ohne Standalone Components)
```typescript
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { EnergyTrackerComponent } from './components/energy-tracker/energy-tracker.component';

@NgModule({
  declarations: [
    AppComponent,
    EnergyTrackerComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

#### **proxy.conf.json** erstellen (für CORS während der Entwicklung)
```json
{
  "/api": {
    "target": "http://localhost:3000",
    "secure": false,
    "changeOrigin": true
  }
}
```

#### **angular.json** anpassen
Fügen Sie in der serve-Konfiguration hinzu:
```json
"serve": {
  "options": {
    "proxyConfig": "proxy.conf.json"
  }
}
```

### 4. App starten

```bash
# Backend (Terminal 1)
cd energy-monitor-backend
npm start

# Frontend (Terminal 2)
cd energy-monitor-frontend/energy-app
ng serve

# App öffnen im Browser
http://localhost:4200
```

---

## 🚀 Production Deployment

### Backend (Node.js)

```bash
# PM2 installieren (Process Manager)
npm install -g pm2

# App mit PM2 starten
pm2 start server.js --name energy-api

# PM2 beim Systemstart aktivieren
pm2 startup
pm2 save

# Logs anzeigen
pm2 logs energy-api
```

### Frontend (Angular)

```bash
# Production Build erstellen
ng build --configuration production

# Dateien aus dist/energy-app nach /var/www/html kopieren
# oder mit einem Webserver wie Nginx/Apache bereitstellen
```

### Nginx Konfiguration (Beispiel)

```nginx
# /etc/nginx/sites-available/energy-monitor
server {
    listen 80;
    server_name ihre-domain.de;

    # Frontend
    root /var/www/energy-monitor;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API Proxy
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🔒 Sicherheit

### MariaDB absichern
```bash
mysql_secure_installation
```

### Firewall konfigurieren
```bash
# Port 3000 (Backend) nur für localhost
sudo ufw allow from 127.0.0.1 to any port 3000

# Port 80/443 für Webserver
sudo ufw allow 80
sudo ufw allow 443
```

### Umgebungsvariablen nutzen
Erstellen Sie eine `.env` Datei für sensible Daten:
```bash
DB_HOST=localhost
DB_USER=energy_user
DB_PASSWORD=IhrSicheresPasswort
DB_NAME=energy_monitor
```

---

## 🐳 Docker Deployment (Optional)

### docker-compose.yml
```yaml
version: '3.8'

services:
  mariadb:
    image: mariadb:10.11
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: energy_monitor
      MYSQL_USER: energy_user
      MYSQL_PASSWORD: userpassword
    volumes:
      - mariadb_data:/var/lib/mysql
    ports:
      - "3306:3306"

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    depends_on:
      - mariadb
    environment:
      DB_HOST: mariadb
      DB_USER: energy_user
      DB_PASSWORD: userpassword
      DB_NAME: energy_monitor

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mariadb_data:
```

Starten mit:
```bash
docker-compose up -d
```

---

## 📱 Mobile App (Optional)

Die App ist bereits responsive. Für native Apps:

### PWA (Progressive Web App)
```bash
ng add @angular/pwa
ng build --configuration production
```

### Ionic (Native Mobile)
```bash
npm install -g @ionic/cli
ionic start energy-monitor blank --type=angular
# Angular Components in Ionic integrieren
```

---

## 🔍 Troubleshooting

### Backend startet nicht
- Überprüfen Sie die MariaDB-Verbindung
- Prüfen Sie die config.json
- Logs: `npm start` oder `pm2 logs`

### Frontend kann Backend nicht erreichen
- CORS-Einstellungen im Backend überprüfen
- proxy.conf.json korrekt konfiguriert?
- Backend läuft auf Port 3000?

### Datenbankfehler
```bash
# MariaDB Status prüfen
sudo systemctl status mariadb

# Logs prüfen
sudo tail -f /var/log/mysql/error.log
```

---

## 📚 API Dokumentation

### Endpoints

**GET** `/api/energy`
- Gibt alle Einträge zurück (max. 12 Monate)

**GET** `/api/energy/:monat`
- Gibt einen spezifischen Monat zurück (Format: YYYY-MM)

**POST** `/api/energy`
```json
{
  "monat": "2024-10",
  "gas_kwh": 450.5,
  "wasser_m3": 8.2,
  "solar_kwh": 210.3,
  "impulse": 1234,
  "strom_180_kwh": 320.1,
  "strom_280_kwh": 180.5
}
```

**PUT** `/api/energy/:monat`
- Aktualisiert einen Eintrag

**DELETE** `/api/energy/:monat`
- Löscht einen Eintrag

---

## 📞 Support

Bei Fragen oder Problemen:
1. Überprüfen Sie die Logs
2. Testen Sie die API mit Postman/curl
3. Prüfen Sie die Browser-Console (F12)

---

## 📄 Lizenz

MIT License - Freie Verwendung für private und kommerzielle Projekte.

---

Viel Erfolg mit Ihrer Energie-Monitor-App! 🚀