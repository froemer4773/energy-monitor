#!/bin/bash

echo "?? Starte Energie Monitor (MariaDB Multi-Network)..."

# ANPASSEN!
DB_PASSWORD="energy-app"

# 1. Custom Network erstellen (falls nicht vorhanden)
docker network create energy-network 2>/dev/null && echo "? Netzwerk erstellt" || echo "? Netzwerk existiert bereits"

# 2. MariaDB finden
MARIADB_CONTAINER=$(docker ps | grep mariadb | awk '{print $1}')
MARIADB_NAME=$(docker inspect $MARIADB_CONTAINER --format='{{.Name}}' | sed 's/\///' 2>/dev/null)

if [ -z "$MARIADB_CONTAINER" ]; then
    echo "? MariaDB Container nicht gefunden!"
    exit 1
fi

echo "?? MariaDB: $MARIADB_NAME (ID: $MARIADB_CONTAINER)"

# 3. MariaDB ZUSÄTZLICH mit energy-network verbinden
echo "Verbinde MariaDB mit energy-network (zusätzlich)..."
docker network connect energy-network $MARIADB_CONTAINER 2>/dev/null && \
    echo "? MariaDB ist jetzt in beiden Netzwerken" || \
    echo "? MariaDB war bereits verbunden"

# 4. Zeige MariaDB Netzwerke
echo "MariaDB Netzwerke:"
docker inspect $MARIADB_CONTAINER --format='{{range $net, $config := .NetworkSettings.Networks}}  - {{$net}}{{"\n"}}{{end}}'

# 5. Alte Energy-Container entfernen
docker stop energy-monitor-backend energy-monitor-frontend 2>/dev/null
docker rm energy-monitor-backend energy-monitor-frontend 2>/dev/null

# 6. Backend im energy-network starten
echo "Starte Backend..."
docker run -d \
  --name energy-monitor-backend \
  --network energy-network \
  --restart unless-stopped \
  -e NODE_ENV=production \
  -e DB_HOST=10.55.10.9 \
  -e DB_USER=energy-app \
  -e DB_PASSWORD=$DB_PASSWORD \
  -e DB_NAME=Solaranlage \
  -e PORT=3003 \
  energy-monitor-backend:latest

echo "? Backend gestartet (energy-network)"
sleep 3

# 7. Frontend im energy-network starten
echo "Starte Frontend..."
docker run -d \
  --name energy-monitor-frontend \
  --network energy-network \
  --restart unless-stopped \
  -p 4200:80 \
  energy-monitor-frontend:latest

echo "? Frontend gestartet (energy-network)"
sleep 5

# 8. Tests
echo ""
echo "=== Verbindungstests ==="

echo "1. Backend ? MariaDB:"
docker exec energy-monitor-backend ping -c 2 $MARIADB_NAME 2>&1 | head -3

echo ""
echo "2. Frontend ? Backend:"
docker exec energy-monitor-frontend ping -c 2 energy-monitor-backend 2>&1 | head -3

echo ""
echo "3. Backend Health:"
docker exec energy-monitor-backend wget -qO- http://localhost:3003/health 2>&1

echo ""
echo "4. API über Frontend:"
curl -s http://localhost:4200/api/health 2>&1

echo ""
echo "=== Container Status ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Networks}}" | grep -E "NAME|energy|mariadb"

echo ""
echo "?? Fertig! App verfügbar: http://localhost:4200"
echo ""
echo "??  MariaDB ist weiterhin in ihrem ursprünglichen Netzwerk für andere Tools"