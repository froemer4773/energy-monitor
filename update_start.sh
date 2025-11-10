#!/bin/bash
echo "?? Update Energie Monitor..."

# Container stoppen
docker stop energy-monitor-backend energy-monitor-frontend
docker rm energy-monitor-backend energy-monitor-frontend

# Images neu bauen
cd ~/energy-monitor
docker build -t energy-monitor-backend:latest ./backend
docker build -t energy-monitor-frontend:latest ./frontend

# Alte Images aufräumen
docker image prune -f

# Neu starten
# ./start.sh
docker stack deploy -c energy-monitor-stack.yml energy-monitor

echo "? Update abgeschlossen!"
