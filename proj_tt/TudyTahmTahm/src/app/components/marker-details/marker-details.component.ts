import {Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {AppMarker} from '../../models/appMarker'; // Import custom marker model
import {MarkerService} from '../../services/marker.service';
import {FormsModule} from '@angular/forms';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {Label} from '../../models/label';

@Component({
  selector: 'app-marker-details',
  standalone: true,
  templateUrl: './marker-details.component.html',
  styleUrls: ['./marker-details.component.scss'],
  imports: [
    FormsModule,
    CommonModule,
    NgOptimizedImage,
  ],
})
export class MarkerDetailsComponent implements OnChanges {
  @Input() marker: AppMarker | null = null;  // Ensure we're receiving AppMarker
  @Input() labels: Label[] = []; // Input for available labels

  @Output() cancel = new EventEmitter<void>();
  @Output() save = new EventEmitter<AppMarker>();
  @Output() deleteMarker = new EventEmitter<AppMarker>(); // Emits AppMarker
  @Output() refreshMarkers = new EventEmitter<void>(); // Added new EventEmitter

  description: string = '';
  markerName: string = '';
  isNewMarker: boolean = true;
  isVisible: boolean = true;

  constructor(private markerService: MarkerService) {}

  ngOnInit() {
    if (this.marker) {
      this.description = this.marker.markerDescription || '';
      this.markerName = this.marker.markerName || '';
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['marker'] && changes['marker'].currentValue) {
      if (this.marker?.markerID) {
        this.isNewMarker = false;
        this.markerName = this.marker.markerName || '';
        this.description = this.marker.markerDescription || '';
      } else {
        this.isNewMarker = true;
        this.markerName = 'New Marker';
        this.description = '';
      }
    }
  }

  getFormattedCoordinates(): string {
    if (!this.marker || this.marker.latitude === undefined || this.marker.longitude === undefined) {
      return 'Coordinates not available';
    }
    return `${this.marker.latitude.toFixed(6)}, ${this.marker.longitude.toFixed(6)}`;
  }

  onCancel(): void {
    if (this.marker?.markerID == 0) {
      this.deleteMarker.emit(this.marker); // Emit the AppMarker to delete it
    }
    this.isVisible = false;
    this.cancel.emit();
  }

  onDelete(): void {
    if (this.marker) {
      // Otevři potvrzovací dialog s využitím nativního window.confirm
      const confirmDelete = window.confirm(`Do you really want to delete the marker "${this.marker.markerName}"?`);

      if (confirmDelete) {
        this.deleteMarker.emit(this.marker); // Emituj marker ke smazání pouze po potvrzení
        this.isVisible = false;
      }
    }
  }

  onSave(): void {
    if (this.marker) {
      const mapID = Number(sessionStorage.getItem('Map.mapID')) || 0;
      if (mapID === 0) {
        console.error('No valid mapID found in sessionStorage');
        return;
      }

      const markerDto: AppMarker = {
        ...this.marker,
        markerName: this.markerName,
        markerDescription: this.description
      };

      this.save.emit(markerDto);
      this.isVisible = false;
    }
  }

  show(): void {
    this.isVisible = true;
  }
}
