-- Datenbank-Initialisierung für Docker
-- Wird automatisch beim ersten Start ausgeführt

-- Tabelle erstellen
CREATE TABLE IF NOT EXISTS energy_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  monat VARCHAR(7) NOT NULL UNIQUE COMMENT 'Format: YYYY-MM',
  gas_kwh DECIMAL(10,2) DEFAULT 0 COMMENT 'Gas Verbrauch in kWh',
  wasser_m3 DECIMAL(10,2) DEFAULT 0 COMMENT 'Wasser Verbrauch in m³',
  solar_kwh DECIMAL(10,2) DEFAULT 0 COMMENT 'Solar Produktion in kWh',
  impulse INT DEFAULT 0 COMMENT 'Impulszähler',
  strom_180_kwh DECIMAL(10,2) DEFAULT 0 COMMENT 'Strom Tarif 1.8.0 in kWh',
  strom_280_kwh DECIMAL(10,2) DEFAULT 0 COMMENT 'Strom Tarif 2.8.0 in kWh',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_monat (monat),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Energie- und Verbrauchsdaten pro Monat';

-- Optional: Beispieldaten einfügen (auskommentiert)
-- Entferne die Kommentare, wenn du Testdaten möchtest

/*
INSERT IGNORE INTO energy_data (monat, gas_kwh, wasser_m3, solar_kwh, impulse, strom_180_kwh, strom_280_kwh)
VALUES 
  ('2024-01', 850.50, 9.20, 180.30, 920, 380.20, 190.50),
  ('2024-02', 780.20, 8.50, 210.80, 880, 350.80, 175.20),
  ('2024-03', 680.80, 7.90, 245.50, 850, 320.50, 160.80),
  ('2024-04', 520.30, 8.20, 280.20, 800, 290.30, 145.60),
  ('2024-05', 420.60, 9.10, 310.80, 780, 270.80, 135.40),
  ('2024-06', 350.20, 10.20, 340.50, 750, 250.20, 125.80),
  ('2024-07', 280.50, 11.50, 360.20, 720, 230.50, 115.20),
  ('2024-08', 310.80, 10.80, 350.80, 740, 240.80, 120.50),
  ('2024-09', 450.20, 9.30, 320.30, 770, 260.30, 130.80),
  ('2024-10', 620.50, 8.60, 280.60, 820, 290.60, 145.30),
  ('2024-11', 750.80, 8.20, 230.20, 870, 330.20, 165.80),
  ('2024-12', 820.30, 7.80, 190.50, 910, 360.50, 180.20);
*/