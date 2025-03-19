import { Component } from '@angular/core';
import {}
@Component({
  selector: 'app-map',
  imports: [],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss'
})

export class MapComponent {
  private mapOptions: L.MapOptions = {
    center: [51.958, 9.141],
    zoom: 10
  };

  private map: L.Map;
  private layer: L.TileLayer;
  private marker: L.Marker;

  constructor() {
    // Inicializace mapy
    this.map = L.map('map', this.mapOptions);

    // Přidání vrstevnice
    this.layer = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
    this.layer.addTo(this.map);

    // Přidání markeru
    this.marker = L.marker([51.958, 9.141]);
    this.marker.addTo(this.map);
  }
}

