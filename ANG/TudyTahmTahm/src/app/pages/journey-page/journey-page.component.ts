import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';

@Component({
    selector: 'app-journey-page',
    templateUrl: './journey-page.component.html',
    styleUrls: ['./journey-page.component.scss'],
    standalone: true,
    imports: [
      CommonModule,
      FormsModule,
      LeafletModule,
    ]
})
export class JourneyPageComponent implements OnInit {
  journeyName = '';
  distance = 0;

  map: any;
  mapOptions: any;
  mapLayers: any;

  points = [
    { lat: 50.12, lng: 14.45, visible: true },
    { lat: 50.121, lng: 14.451, visible: true },
    { lat: 50.122, lng: 14.452, visible: true },
    { lat: 50.123, lng: 14.453, visible: true },
    // ... přidej další body dle potřeby
  ];

  ngOnInit(): void {
    this.mapOptions = {
      center: L.latLng(50.121, 14.451),
      zoom: 17,
      layers: [
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        })
      ]
    };

    this.map = L.map('map', this.mapOptions); // Inicializace mapy

    this.mapLayers = [];

    this.updatePath();
  }

  updatePath() {
    const visiblePoints = this.points.filter(p => p.visible);
    if (visiblePoints.length < 2) return;

    const latlngs = visiblePoints.map(p => L.latLng(p.lat, p.lng));

    this.mapLayers = [
      L.polyline(latlngs, { color: 'red', weight: 4 })
    ];

    latlngs.forEach(p => {
      this.mapLayers.push(L.circleMarker(p, { radius: 5, color: 'red' }));
    });

    this.distance = this.calculateDistance(latlngs);
  }

  calculateDistance(points: Array<{lat: number, lng: number} & L.LatLngLiteral>): number {
    let dist = 0;
    for (let i = 1; i < points.length; i++) {
      const point1 = L.latLng(points[i-1]);
      const point2 = L.latLng(points[i]);
      dist += point1.distanceTo(point2);
    }
    return parseFloat((dist / 1000).toFixed(2)); // km
  }
}
