import { Component, OnInit, OnDestroy } from '@angular/core';
// Import the required classes from the Leaflet library
import * as L from 'leaflet';  // This imports the entire Leaflet library, including its types

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit, OnDestroy {
  public map: L.Map;  // Correct type for Leaflet Map
  private layer: L.TileLayer;  // Tile layer type
  private marker: L.Marker;  // Marker type

  ngOnInit(): void {
    this.map = L.map('map').setView([51.505, -0.09], 13); // Initialize map with a view

    // Add OpenStreetMap tile layer
    this.layer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    // Add a marker to the map
    this.marker = L.marker([51.505, -0.09]).addTo(this.map)
      .bindPopup('A pretty CSS3 popup.<br> Easily customizable.')
      .openPopup();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove(); // Clean up the map instance when the component is destroyed
    }
  }
}
