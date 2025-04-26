import {Component, OnInit} from '@angular/core';
import * as L from 'leaflet';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {LeafletModule} from '@bluehalo/ngx-leaflet';

@Component({
  selector: 'app-journey-page',
  templateUrl: './journey-page.component.html',
  styleUrls: ['./journey-page.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LeafletModule,
    RouterLink,
  ]
})
export class JourneyPageComponent implements OnInit {
  journeyName = '';
  distance = 0;

  mapOptions: L.MapOptions = {} as L.MapOptions;
  mapLayers: L.Layer[] = [];

  points = [
    { lat: 50.1192600, lng: 14.4918975, visible: true },
    { lat: 50.121, lng: 14.451, visible: true },
    { lat: 50.122, lng: 14.452, visible: true },
    { lat: 50.123, lng: 14.453, visible: true },
  ];

  ngOnInit(): void {
    this.mapOptions = {
      center: L.latLng(50.1192600, 14.4918975),
      zoom: 17,
      layers: [
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        })
      ]
    };
    this.updatePath();
  }

  updatePath() {
    const visiblePoints = this.points.filter(p => p.visible);
    if (visiblePoints.length < 2) return;

    const latlngs = visiblePoints.map(p => L.latLng(p.lat, p.lng));

    this.mapLayers = [
      L.polyline(latlngs, { color: 'red', weight: 4 }),
      ...latlngs.map(p => L.circleMarker(p, { radius: 5, color: 'red' }))
    ];

    this.distance = this.calculateDistance(latlngs);
  }

  calculateDistance(points: L.LatLng[]): number {
    let dist = 0;
    for (let i = 1; i < points.length; i++) {
      dist += points[i - 1].distanceTo(points[i]);
    }
    return parseFloat((dist / 1000).toFixed(2)); // km
  }
}
