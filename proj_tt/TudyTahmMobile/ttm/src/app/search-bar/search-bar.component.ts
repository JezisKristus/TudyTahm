import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { OpenStreetMapProvider } from 'leaflet-geosearch';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { IonSearchbar, IonList, IonItem } from '@ionic/angular/standalone';

@Component({
  selector: 'app-search-bar',
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss'],
  imports: [ FormsModule, IonicModule, IonSearchbar,IonItem, IonList, CommonModule ],
  standalone: true
})

export class SearchBarComponent {
  @Input() map!: L.Map;
  private provider = new OpenStreetMapProvider();
  suggestions: Array<{ label: string, x: number, y: number }> = [];

  async searchLocation(event: CustomEvent): Promise<void> {
    console.log('searching')
    const query = event.detail.value;
  
    if (!query && !query.trim()) {
      this.suggestions = [];
      return;
    }
  
    try {
      const results = await this.provider.search({ query });
      //suggestions autofill
      this.suggestions = results.slice(0, 5);
    } catch (error) {
      console.error('Search error:', error);
      this.suggestions = [];
    }
    console.log('Filtered suggestions:', this.suggestions);
  }

  


  // async searchLocation(event: CustomEvent): Promise<void> {
  //   const query = event.detail.value;

  //   if (!query || !query.trim()) {
  //     this.suggestions = [];
  //     return;
  //   }

  //   try {
  //     const results = await this.provider.search({ query });
  //     //suggestions autofill
  //     this.suggestions = results.slice(0, 5);


  //     if (results.length > 0) {
  //       const { y: lat, x: lon, label } = results[0];
  //       // Center map on the searched location
  //       this.map.setView([lat, lon], 15);

  //       // Add a marker
  //       L.marker([lat, lon])
  //         .addTo(this.map)
  //         .bindPopup(label)
  //         .openPopup();
  //     }
  //   } catch (error) {
  //     console.error('Search error:', error);
  //     this.suggestions = [];
  //   }
  // }

  selectSuggestion(suggestion: { label: string, x: number, y: number }) {
    this.map.setView([suggestion.y, suggestion.x], 15);
    L.marker([suggestion.y, suggestion.x])
      .addTo(this.map)
      .bindPopup(suggestion.label)
      .openPopup();
  
    this.suggestions = [];
  }

}