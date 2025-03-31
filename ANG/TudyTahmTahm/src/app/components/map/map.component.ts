import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet';  // Correct import

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit {
  private map: L.Map;
  private layer: L.TileLayer;
  private marker: L.Marker;

  ngOnInit(): void {
    this.map = L.map('map', {
      center: [51.958, 9.141],
      zoom: 10
    });

    this.layer = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
    this.layer.addTo(this.map);

    this.marker = L.marker([51.958, 9.141]);
    this.marker.addTo(this.map);
  }
}
