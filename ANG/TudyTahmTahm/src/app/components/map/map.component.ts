import { Component, OnInit, OnDestroy } from '@angular/core';
import * as L from 'leaflet';  // This imports the entire Leaflet library, including its types

@Component({
  selector: 'app-map',
  standalone: true,
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit, OnDestroy {
  map : any;
  layer : any;
  private markers: L.Marker[] = []; // Seznam markerů

  ngOnInit(): void {
    this.map = L.map('map').setView([49.8022514,15.6252330], 8); // Initialize map with a view
    // Add OpenStreetMap tile layer
    this.layer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    // Přidání události na pravé tlačítko myši
    this.map.on('contextmenu', (event: L.LeafletMouseEvent) => {
      this.addMarker(event.latlng); // Přidání markeru na mapu
    });
  }

  private addMarker(latlng: L.LatLng): void {
    // Vytvoření nového markeru
    const marker = L.marker(latlng).addTo(this.map);

    // Přidání markeru do seznamu
    this.markers.push(marker);

    console.log('Marker přidán:', marker);
    console.log('Aktuální seznam markerů:', this.markers);
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove(); // Clean up the map instance when the component is destroyed
    }
  }
}
