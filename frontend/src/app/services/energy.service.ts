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
  private apiUrl = '/api/energy';

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