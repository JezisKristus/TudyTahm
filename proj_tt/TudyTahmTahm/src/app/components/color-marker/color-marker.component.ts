import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import * as L from 'leaflet';
import { AppMarker } from '../../models/appMarker';
import { CommonModule } from '@angular/common';
import { ExtendedMarker } from '../../models/extended-marker';

@Component({
  selector: 'app-color-marker',
  template: '<div class="marker-wrapper"></div>',
  standalone: true,
  imports: [CommonModule]
})
export class ColorMarkerComponent implements OnInit, OnChanges, OnDestroy {
  @Input() map!: L.Map;
  @Input() markerData!: AppMarker;
  @Output() markerClick = new EventEmitter<AppMarker>();

  leafletMarker?: ExtendedMarker;
  private _labelColor: string = '#d4af37';

  @Input()
  set labelColor(value: string) {
    this._labelColor = value;
    if (this.leafletMarker) {
      this.updateColor();
    }
  }
  get labelColor(): string {
    return this._labelColor;
  }

  ngOnInit(): void {
    if (this.map && this.markerData) {
      this.addMarker();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['map'] && !changes['map'].firstChange) ||
      (changes['markerData'] && !changes['markerData'].firstChange)) {
      this.addMarker();
    }
    if (changes['labelColor'] && !changes['labelColor'].firstChange && this.leafletMarker) {
      this.updateColor();
    }
  }

  private addMarker(): void {
    if (!this.map || !this.markerData) {
      console.error('Missing map or marker data in ColorMarkerComponent');
      return;
    }

    if (!this.isValidLatLng(this.markerData.latitude, this.markerData.longitude)) {
      console.error('Invalid marker coordinates:', this.markerData);
      return;
    }

    if (this.leafletMarker) {
      this.leafletMarker.remove();
    }

    const coords: L.LatLngExpression = [
      this.markerData.latitude,
      this.markerData.longitude
    ];

    const marker = L.marker(coords, {
      icon: this.createPinIcon(this.labelColor),
      interactive: true,
      draggable: false
    }).on('click', () => {
      console.log('Marker clicked in component:', this.markerData);
      this.markerClick.emit(this.markerData);
    });

    // Extend the marker with our custom properties
    const extendedMarker = marker as ExtendedMarker;
    extendedMarker.selected = false;
    extendedMarker.markerData = this.markerData;
    extendedMarker.markerID = this.markerData.markerID;

    this.leafletMarker = extendedMarker;
    this.leafletMarker.addTo(this.map);
  }

  removeFromMap(): void {
    if (this.leafletMarker) {
      this.leafletMarker.remove();
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

  public refreshMarker(): void {
    if (this.leafletMarker) {
      this.leafletMarker.remove();
    }
    this.addMarker();
  }

  ngOnDestroy(): void {
    if (this.leafletMarker) {
      this.map.removeLayer(this.leafletMarker);
    }
  }

  hide(): void {
    if (this.leafletMarker) {
      this.leafletMarker.setOpacity(0);
    }
  }

  show(): void {
    if (this.leafletMarker) {
      this.leafletMarker.setOpacity(1);
    }
  }
}
