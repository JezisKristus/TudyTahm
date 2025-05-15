import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges
} from '@angular/core';
import * as L from 'leaflet';
import { AppMarker } from '../../models/appMarker';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-color-marker',
  // We need a minimal template to create a DOM element
  template: '<div class="marker-wrapper"></div>',
  standalone: true,
  imports: [CommonModule]
})
export class ColorMarkerComponent implements OnInit, OnChanges, OnDestroy {
  @Input() map!: L.Map;
  @Input() markerData!: AppMarker;       // data from backend
  @Input() labelColor: string = '#d4af37'; // hex code from label

  leafletMarker?: L.Marker;

  ngOnInit(): void {
    // Add marker only if we have all required inputs
    if (this.map && this.markerData) {
      this.addMarker();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // If map or markerData changes, recreate the marker
    if ((changes['map'] && !changes['map'].firstChange) ||
      (changes['markerData'] && !changes['markerData'].firstChange)) {
      this.addMarker();
    }
    // Color change
    if (changes['labelColor'] && !changes['labelColor'].firstChange && this.leafletMarker) {
      this.updateColor();
    }
  }

  private addMarker(): void {
    // Skip if we don't have required data
    if (!this.map || !this.markerData) {
      console.error('Missing map or marker data in ColorMarkerComponent');
      return;
    }

    // Validate coordinates
    if (!this.isValidLatLng(this.markerData.latitude, this.markerData.longitude)) {
      console.error('Invalid marker coordinates:', this.markerData);
      return;
    }

    // Remove old marker if it exists
    if (this.leafletMarker) {
      this.map.removeLayer(this.leafletMarker);
    }

    const coords: L.LatLngExpression = [
      this.markerData.latitude,
      this.markerData.longitude
    ];

    this.leafletMarker = L.marker(coords, {
      icon: this.createPinIcon(this.labelColor)
    }).addTo(this.map);

    // Add popup with marker name
    if (this.markerData.markerName) {
      this.leafletMarker.bindPopup(this.markerData.markerName);
    }
  }

  private updateColor(): void {
    if (this.leafletMarker) {
      this.leafletMarker.setIcon(this.createPinIcon(this.labelColor));
    }
  }

  private createPinIcon(hexColor: string): L.DivIcon {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 41" width="25" height="41">
        <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 9.7 12.5 28.5 12.5 28.5S25 22.2 25 12.5C25 5.6 19.4 0 12.5 0z"
              fill="${hexColor}" stroke="#333" stroke-width="2"/>
        <circle cx="12.5" cy="12.5" r="5" fill="#fff"/>
      </svg>
    `;
    return L.divIcon({
      className: 'custom-marker',
      html: svg,
      iconSize: [25, 41],
      iconAnchor: [12.5, 41]
    });
  }

  private isValidLatLng(lat: number, lng: number): boolean {
    return typeof lat === 'number' && typeof lng === 'number' &&
      !isNaN(lat) && !isNaN(lng) &&
      lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }

  ngOnDestroy(): void {
    if (this.leafletMarker) {
      this.map.removeLayer(this.leafletMarker);
    }
  }
}
