const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Datenbank-Konfiguration direkt aus Umgebungsvariablen
const dbConfig = {
  host: process.env.DB_HOST || '10.xx.xx.xx',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'energy-app',
  password: process.env.DB_PASSWORD || 'energy-app',
  database: process.env.DB_NAME || 'Solaranlage',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

console.log('📊 Verbinde zur Datenbank:', dbConfig.host);

let pool;

const initDatabase = async () => {
  try {
    pool = mysql.createPool(dbConfig);
    
    const connection = await pool.getConnection();
    console.log('✓ Datenbank-Verbindung erfolgreich');
    connection.release();

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS energy_data (
        id INT AUTO_INCREMENT PRIMARY KEY,
        monat VARCHAR(7) NOT NULL UNIQUE,
        gas_kwh DECIMAL(10,2) DEFAULT 0,
        wasser_m3 DECIMAL(10,2) DEFAULT 0,
        solar_kwh DECIMAL(10,2) DEFAULT 0,
        impulse INT DEFAULT 0,
        strom_180_kwh DECIMAL(10,2) DEFAULT 0,
        strom_280_kwh DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_monat (monat)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await pool.query(createTableQuery);
    console.log('✓ Datenbank-Tabelle bereit');
  } catch (error) {
    console.error('❌ Datenbankfehler:', error);
    throw error;
  }
};

// API Routes
app.get('/api/energy', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM energy_data ORDER BY monat DESC LIMIT 12');
    const data = rows.map(row => ({
      ...row,
      gas_kwh: parseFloat(row.gas_kwh),
      wasser_m3: parseFloat(row.wasser_m3),
      solar_kwh: parseFloat(row.solar_kwh),
      impulse: parseInt(row.impulse),
      strom_180_kwh: parseFloat(row.strom_180_kwh),
      strom_280_kwh: parseFloat(row.strom_280_kwh)
    }));
    res.json(data);
  } catch (error) {
    console.error('Fehler beim Abrufen:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Daten' });
  }
});

app.get('/api/energy/:monat', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM energy_data WHERE monat = ?', [req.params.monat]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Monat nicht gefunden' });
    }
    const data = {
      ...rows[0],
      gas_kwh: parseFloat(rows[0].gas_kwh),
      wasser_m3: parseFloat(rows[0].wasser_m3),
      solar_kwh: parseFloat(rows[0].solar_kwh),
      impulse: parseInt(rows[0].impulse),
      strom_180_kwh: parseFloat(rows[0].strom_180_kwh),
      strom_280_kwh: parseFloat(rows[0].strom_280_kwh)
    };
    res.json(data);
  } catch (error) {
    console.error('Fehler beim Abrufen:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Daten' });
  }
});

app.post('/api/energy', async (req, res) => {
  const { monat, gas_kwh, wasser_m3, solar_kwh, impulse, strom_180_kwh, strom_280_kwh } = req.body;
  if (!monat || !/^\d{4}-\d{2}$/.test(monat)) {
    return res.status(400).json({ error: 'Ungültiges Monatsformat (YYYY-MM)' });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO energy_data (monat, gas_kwh, wasser_m3, solar_kwh, impulse, strom_180_kwh, strom_280_kwh) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [monat, gas_kwh || 0, wasser_m3 || 0, solar_kwh || 0, impulse || 0, strom_180_kwh || 0, strom_280_kwh || 0]
    );
    res.status(201).json({ message: 'Daten erfolgreich gespeichert', id: result.insertId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Daten für diesen Monat existieren bereits' });
    }
    console.error('Fehler beim Speichern:', error);
    res.status(500).json({ error: 'Fehler beim Speichern der Daten' });
  }
});

app.put('/api/energy/:monat', async (req, res) => {
  const { monat } = req.params;
  const { gas_kwh, wasser_m3, solar_kwh, impulse, strom_180_kwh, strom_280_kwh } = req.body;
  try {
    const [result] = await pool.query(
      'UPDATE energy_data SET gas_kwh = ?, wasser_m3 = ?, solar_kwh = ?, impulse = ?, strom_180_kwh = ?, strom_280_kwh = ? WHERE monat = ?',
      [gas_kwh || 0, wasser_m3 || 0, solar_kwh || 0, impulse || 0, strom_180_kwh || 0, strom_280_kwh || 0, monat]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Monat nicht gefunden' });
    }
    res.json({ message: 'Daten erfolgreich aktualisiert' });
  } catch (error) {
    console.error('Fehler beim Aktualisieren:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren der Daten' });
  }
});

app.delete('/api/energy/:monat', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM energy_data WHERE monat = ?', [req.params.monat]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Monat nicht gefunden' });
    }
    res.json({ message: 'Daten erfolgreich gelöscht' });
  } catch (error) {
    console.error('Fehler beim Löschen:', error);
    res.status(500).json({ error: 'Fehler beim Löschen der Daten' });
  }
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: pool ? 'connected' : 'disconnected'
  });
});

// Server starten
const PORT = process.env.PORT || 3003;

const startServer = async () => {
  try {
    await initDatabase();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✓ Server läuft auf Port ${PORT}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Fehler beim Starten des Servers:', error);
    process.exit(1);
  }
};

startServer();

process.on('SIGTERM', async () => {
  console.log('SIGTERM empfangen, schließe Verbindungen...');
  if (pool) await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT empfangen, schließe Verbindungen...');
  if (pool) await pool.end();
  process.exit(0);
});
