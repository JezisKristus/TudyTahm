import {Component, OnInit} from '@angular/core';
import * as L from 'leaflet';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {LeafletModule} from '@bluehalo/ngx-leaflet';
import { JourneyService } from '../../services/journey.service';
import { Journey } from '../../models/journey';
import { ActivatedRoute, Router } from '@angular/router';
import {SidebarComponent} from '../../components/sidebar/sidebar.component';

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
    SidebarComponent,
  ]
})
export class JourneyPageComponent implements OnInit {
  journeyName = '';
  distance = 0;
  journey: Journey | null = null;
  loading = true;
  error: string | null = null;

  mapOptions: L.MapOptions = {} as L.MapOptions;
  mapLayers: L.Layer[] = [];
  mapInstance: L.Map | null = null;

  points: { lat: number; lng: number; visible: boolean }[] = [];

  constructor(
    private journeyService: JourneyService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.error = null;
    // Load journey from sessionStorage
    const journeyStr = sessionStorage.getItem('Journey');
    if (!journeyStr) {
      this.error = 'No journey selected.';
      this.loading = false;
      return;
    }
    try {
      this.journey = JSON.parse(journeyStr);
      if (this.journey) {
        this.journeyName = this.journey.name;
      }
    } catch (e) {
      this.error = 'Failed to load journey data.';
      this.loading = false;
      return;
    }
    // Set map default
    this.mapOptions = {
      center: L.latLng(50.1192600, 14.4918975),
      zoom: 17,
      layers: [
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        })
      ]
    };
    // Load points for this journey
    if (this.journey && this.journey.journeyID) {
      this.journeyService.getPointsByJourneyID(this.journey.journeyID).subscribe({
        next: (points) => {
          // Expecting points to have lat/lng
          this.points = points.map((p: any) => ({
            lat: p.latitude || p.lat,
            lng: p.longitude || p.lng,
            visible: true
          }));

          // Center and zoom map to fit all points
          if (this.points.length > 0) {
            const latlngs = this.points.map(p => L.latLng(p.lat, p.lng));
            const bounds = L.latLngBounds(latlngs);
            // Pokud je mapa již inicializovaná, posuň pohled
            if (this.mapInstance) {
              this.mapInstance.fitBounds(bounds, {padding: [30, 30]});
            } else {
              // fallback pro případ, že mapa ještě není ready
              this.mapOptions = {
                ...this.mapOptions,
                center: bounds.getCenter(),
                zoom: this.getBoundsZoom(bounds),
              };
            }
          }

          this.updatePath();
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to load journey points.';
          this.loading = false;
        }
      });
    } else {
      this.error = 'Invalid journey data.';
      this.loading = false;
    }
  }

  updatePath() {
    const visiblePoints = this.points.filter(p => p.visible);
    if (visiblePoints.length < 2) {
      this.mapLayers = [];
      this.distance = 0;
      return;
    }
    const latlngs = visiblePoints.map(p => L.latLng(p.lat, p.lng));
    this.mapLayers = [
      L.polyline(latlngs, { color: 'red', weight: 4 }),
      ...latlngs.map(p => L.circleMarker(p, { radius: 3, color: 'red' }))
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

  // Add helper to get zoom to fit bounds
  getBoundsZoom(bounds: L.LatLngBounds): number {
    // Default Leaflet zoom levels: 0 (whole world) to 18+ (street)
    // We'll use a map size of 800x600 for calculation, but leaflet will auto-adjust
    const mapSize = {width: 800, height: 600};
    // Use Leaflet's built-in getBoundsZoom if available, otherwise fallback
    // @ts-ignore
    if (L.CRS.EPSG3857.getBoundsZoom) {
      // @ts-ignore
      return L.CRS.EPSG3857.getBoundsZoom(bounds, false, mapSize);
    }
    // Fallback: use zoom 13 for city, 10 for region, 7 for country
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    const latDiff = Math.abs(ne.lat - sw.lat);
    const lngDiff = Math.abs(ne.lng - sw.lng);
    if (latDiff < 0.01 && lngDiff < 0.01) return 16;
    if (latDiff < 0.1 && lngDiff < 0.1) return 13;
    if (latDiff < 1 && lngDiff < 1) return 10;
    return 7;
  }

  onMapReady(map: L.Map) {
    this.mapInstance = map;
    // Pokud už jsou body načtené, fitni bounds
    if (this.points.length > 0) {
      const latlngs = this.points.map(p => L.latLng(p.lat, p.lng));
      const bounds = L.latLngBounds(latlngs);
      map.fitBounds(bounds, {padding: [30, 30]});
    }
  }
}
