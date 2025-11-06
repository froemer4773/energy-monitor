import { Component } from '@angular/core';
import { EnergyTrackerComponent } from './components/energy-tracker/energy-tracker.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [EnergyTrackerComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Energie Monitor';
}