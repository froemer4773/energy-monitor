import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { EnergyService, EnergyData } from '../../services/energy.service';

@Component({
  selector: 'app-energy-tracker',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule
  ],
  templateUrl: './energy-tracker.component.html',
  styleUrls: ['./energy-tracker.component.css']
})
export class EnergyTrackerComponent implements OnInit {
  activeView: 'input' | 'dashboard' = 'dashboard';
  
  // Math für Template verfügbar machen
  Math = Math;
  
  formData: EnergyData = {
    monat: '',
    gas_kwh: 0,
    wasser_m3: 0,
    solar_kwh: 0,
    impulse: 0,
    strom_180_kwh: 0,
    strom_280_kwh: 0
  };

  entries: EnergyData[] = [];
  chartData: any[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  
  // Sichtbarkeit der Chart-Daten
  chartVisibility = {
    Gas: true,
    Wasser: true,
    Solar: true,
    'Strom 1.8.0': true,
    'Strom 2.8.0': true,
    Impulse: true
  };

  constructor(private energyService: EnergyService) {}

  ngOnInit(): void {
    this.initializeMonth();
    this.loadData();
  }

  initializeMonth(): void {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    this.formData.monat = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;
  }

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.energyService.getAll().subscribe({
      next: (data) => {
        // Konvertiere Strings zu Numbers
        this.entries = data.map(entry => ({
          ...entry,
          gas_kwh: Number(entry.gas_kwh) || 0,
          wasser_m3: Number(entry.wasser_m3) || 0,
          solar_kwh: Number(entry.solar_kwh) || 0,
          impulse: Number(entry.impulse) || 0,
          strom_180_kwh: Number(entry.strom_180_kwh) || 0,
          strom_280_kwh: Number(entry.strom_280_kwh) || 0
        }));
        this.prepareChartData();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Fehler beim Laden:', error);
        this.errorMessage = 'Fehler beim Laden der Daten. Bitte Backend überprüfen.';
        this.isLoading = false;
      }
    });
  }

  prepareChartData(): void {
    // Sortiere nach Monat aufsteigend für Differenz-Berechnung
    const sortedEntries = [...this.entries].sort((a, b) => a.monat.localeCompare(b.monat));
    
    this.chartData = sortedEntries.slice(0, 12).map((entry, index) => {
      const date = new Date(entry.monat + '-01');
      
      // Vormonat suchen
      const previousEntry = index > 0 ? sortedEntries[index - 1] : null;
      
      // Aktuelle Werte
      const gasAktuell = Number(entry.gas_kwh);
      const wasserAktuell = Number(entry.wasser_m3);
      const solarAktuell = Number(entry.solar_kwh);
      const impulseAktuell = Number(entry.impulse);
      const strom180Aktuell = Number(entry.strom_180_kwh);
      const strom280Aktuell = Number(entry.strom_280_kwh);
      
      // Vormonat Werte
      const gasVormonat = previousEntry ? Number(previousEntry.gas_kwh) : 0;
      const wasserVormonat = previousEntry ? Number(previousEntry.wasser_m3) : 0;
      const solarVormonat = previousEntry ? Number(previousEntry.solar_kwh) : 0;
      const impulseVormonat = previousEntry ? Number(previousEntry.impulse) : 0;
      const strom180Vormonat = previousEntry ? Number(previousEntry.strom_180_kwh) : 0;
      const strom280Vormonat = previousEntry ? Number(previousEntry.strom_280_kwh) : 0;
      
      // Differenzen berechnen
      const gasDiff = previousEntry ? gasAktuell - gasVormonat : 0;
      const wasserDiff = previousEntry ? wasserAktuell - wasserVormonat : 0;
      const solarDiff = previousEntry ? solarAktuell - solarVormonat : 0;
      const impulseDiff = previousEntry ? impulseAktuell - impulseVormonat : 0;
      const strom180Diff = previousEntry ? strom180Aktuell - strom180Vormonat : 0;
      const strom280Diff = previousEntry ? strom280Aktuell - strom280Vormonat : 0;
      
      return {
        monat: date.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' }),
        fullMonat: date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }),
        originalMonat: entry.monat,
        Gas: gasDiff,
        Wasser: wasserDiff,
        Solar: solarDiff,
        'Strom 1.8.0': strom180Diff,
        'Strom 2.8.0': strom280Diff,
        Impulse: impulseDiff,
        // Tooltip-Daten
        GasTooltip: `Vormonat: ${gasVormonat.toFixed(2)} kWh | Aktuell: ${gasAktuell.toFixed(2)} kWh | Differenz: ${gasDiff.toFixed(2)} kWh`,
        WasserTooltip: `Vormonat: ${wasserVormonat.toFixed(2)} m³ | Aktuell: ${wasserAktuell.toFixed(2)} m³ | Differenz: ${wasserDiff.toFixed(2)} m³`,
        SolarTooltip: `Vormonat: ${solarVormonat.toFixed(2)} kWh | Aktuell: ${solarAktuell.toFixed(2)} kWh | Differenz: ${solarDiff.toFixed(2)} kWh`,
        Strom180Tooltip: `Vormonat: ${strom180Vormonat.toFixed(2)} kWh | Aktuell: ${strom180Aktuell.toFixed(2)} kWh | Differenz: ${strom180Diff.toFixed(2)} kWh`,
        Strom280Tooltip: `Vormonat: ${strom280Vormonat.toFixed(2)} kWh | Aktuell: ${strom280Aktuell.toFixed(2)} kWh | Differenz: ${strom280Diff.toFixed(2)} kWh`,
        ImpulseTooltip: `Vormonat: ${impulseVormonat} | Aktuell: ${impulseAktuell} | Differenz: ${impulseDiff}`
      };
    }).reverse(); // Für Anzeige wieder neueste zuerst
  }

  onSubmit(): void {
    if (!this.formData.monat) {
      this.errorMessage = 'Bitte wählen Sie einen Monat aus.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.energyService.create(this.formData).subscribe({
      next: (response) => {
        this.successMessage = 'Daten erfolgreich gespeichert!';
        this.loadData();
        this.resetForm();
        this.isLoading = false;
        
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error) => {
        console.error('Fehler beim Speichern:', error);
        if (error.status === 409) {
          this.errorMessage = 'Daten für diesen Monat existieren bereits. Bitte verwenden Sie die Bearbeiten-Funktion.';
        } else {
          this.errorMessage = 'Fehler beim Speichern der Daten.';
        }
        this.isLoading = false;
      }
    });
  }

  resetForm(): void {
    const [year, month] = this.formData.monat.split('-').map(Number);
    const nextMonth = new Date(year, month, 1);
    const nextMonthStr = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`;
    
    this.formData = {
      monat: nextMonthStr,
      gas_kwh: 0,
      wasser_m3: 0,
      solar_kwh: 0,
      impulse: 0,
      strom_180_kwh: 0,
      strom_280_kwh: 0
    };
  }

  deleteEntry(monat: string): void {
    if (!confirm('Möchten Sie diesen Eintrag wirklich löschen?')) {
      return;
    }

    this.energyService.delete(monat).subscribe({
      next: () => {
        this.successMessage = 'Eintrag erfolgreich gelöscht!';
        this.loadData();
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error) => {
        console.error('Fehler beim Löschen:', error);
        this.errorMessage = 'Fehler beim Löschen des Eintrags.';
      }
    });
  }

  switchView(view: 'input' | 'dashboard'): void {
    this.activeView = view;
    this.errorMessage = '';
    this.successMessage = '';
  }

  getMonthName(monat: string): string {
    const date = new Date(monat + '-01');
    return date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
  }

  toggleChartData(key: string): void {
    const allVisible = Object.values(this.chartVisibility).every(v => v);
    const currentVisible = this.chartVisibility[key as keyof typeof this.chartVisibility];
    
    // Wenn alle sichtbar sind und wir auf eines klicken: Zeige nur dieses
    if (allVisible) {
      Object.keys(this.chartVisibility).forEach(k => {
        this.chartVisibility[k as keyof typeof this.chartVisibility] = (k === key);
      });
    } 
    // Wenn nur eines sichtbar ist und wir darauf klicken: Zeige alle
    else if (currentVisible && Object.values(this.chartVisibility).filter(v => v).length === 1) {
      Object.keys(this.chartVisibility).forEach(k => {
        this.chartVisibility[k as keyof typeof this.chartVisibility] = true;
      });
    }
    // Sonst: Toggle das angeklickte
    else {
      this.chartVisibility[key as keyof typeof this.chartVisibility] = !currentVisible;
    }
  }

  isChartDataVisible(key: string): boolean {
    return this.chartVisibility[key as keyof typeof this.chartVisibility];
  }

  getMonthDifference(currentEntry: EnergyData, field: keyof EnergyData): number {
    // Finde den Vormonat
    const currentIndex = this.entries.findIndex(e => e.monat === currentEntry.monat);
    if (currentIndex === -1 || currentIndex === this.entries.length - 1) {
      return 0; // Kein Vormonat vorhanden
    }
    
    const previousEntry = this.entries[currentIndex + 1]; // Entries sind absteigend sortiert
    const currentValue = Number(currentEntry[field]) || 0;
    const previousValue = Number(previousEntry[field]) || 0;
    
    return currentValue - previousValue;
  }

  getTooltipForDifference(currentEntry: EnergyData, field: keyof EnergyData, unit: string): string {
    const currentIndex = this.entries.findIndex(e => e.monat === currentEntry.monat);
    if (currentIndex === -1 || currentIndex === this.entries.length - 1) {
      return `Kein Vormonat | Aktuell: ${Number(currentEntry[field]).toFixed(2)} ${unit}`;
    }
    
    const previousEntry = this.entries[currentIndex + 1];
    const currentValue = Number(currentEntry[field]) || 0;
    const previousValue = Number(previousEntry[field]) || 0;
    const difference = currentValue - previousValue;
    
    return `Vormonat: ${previousValue.toFixed(2)} ${unit} | Aktuell: ${currentValue.toFixed(2)} ${unit} | Differenz: ${difference.toFixed(2)} ${unit}`;
  }
}