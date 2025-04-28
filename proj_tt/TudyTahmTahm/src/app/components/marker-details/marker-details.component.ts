import { Component, Input, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { AppMarker } from '../../models/appMarker'; // Import custom marker model
import { MarkerService } from '../../services/marker.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-marker-details',
  standalone: true,
  templateUrl: './marker-details.component.html',
  styleUrls: ['./marker-details.component.scss'],
  imports: [
    FormsModule,
    CommonModule // PřIDání CommonModule pro podporu NgIf
  ],
})
export class MarkerDetailsComponent implements OnChanges {
  @Input() marker: AppMarker | null = null;  // Zajistí, že přijímáme AppMarker
  @Input() markerID : number = 0; // explicitně si převzít markerID

  @Output() cancel = new EventEmitter<void>();
  @Output() save = new EventEmitter<AppMarker>();
  @Output() deleteMarker = new EventEmitter<AppMarker>(); // Now emits AppMarker
  @Output() refreshMarkers = new EventEmitter<void>(); // PřIDání nového EventEmitteru

  isVisible = false;
  description: string = '';
  markerName: string = '';
  selectedIconIndex: number = 0;
  isNewMarker: boolean = true;


  // Array of icon URLs for the icon grID
  icons: string[] = [
    'icon1.png'
  ];

  constructor(private markerService: MarkerService)   {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['marker'] && changes['marker'].currentValue) {
      this.isVisible = true;
      if (this.marker?.markerID) {
        this.isNewMarker = false;
        this.markerName = this.marker.markerName || '';
        this.description = this.marker.markerDescription || '';
        this.selectedIconIndex = this.icons.indexOf(this.marker.markerIconPath || '');
        if (this.selectedIconIndex < 0) this.selectedIconIndex = 0;
      } else {
        this.isNewMarker = true;
        this.markerName = '';
        this.description = '';
        this.selectedIconIndex = 0;
      }

      // Ensure default icon is used if markerIconPath is empty
      if (this.marker && !this.marker.markerIconPath) {
        this.marker.markerIconPath = 'default-icon.png';
      }
    }
  }

  getFormattedCoordinates(): string {
    if (!this.marker || this.marker.latitude === undefined || this.marker.longitude === undefined) {
      return 'Coordinates not available';
    }
    return `${this.marker.latitude.toFixed(6)}, ${this.marker.longitude.toFixed(6)}`;
  }

  selectIcon(index: number): void {
    this.selectedIconIndex = index;
  }

  onCancel(): void {
    if (this.isNewMarker && this.marker) {
      this.deleteMarker.emit(this.marker); // Emit the AppMarker to delete it
    }
    this.isVisible = false;
    this.cancel.emit();
  }

  onDelete(): void {
    if (this.marker) {
      this.deleteMarker.emit(this.marker); // Emit the AppMarker to delete it
      this.isVisible = false;
    }
  }

  onSave(): void {
    if (this.marker) {
      const markerDto = {
        markerID: this.marker.markerID || 0,
        IDUser: this.marker.IDUser || 6,
        IDPoint: this.marker.IDPoint || 0,
        markerName: this.markerName || 'Unnamed Marker',
        markerDescription: this.description || '',
        markerIconPath: this.icons[this.selectedIconIndex],
        latitude: this.marker.latitude,
        longitude: this.marker.longitude
      };

      if (this.marker.markerID) {
        // Update existing marker
        this.markerService.update(markerDto).subscribe({
          next: (updatedMarker) => {
            this.marker = updatedMarker;
            this.save.emit(updatedMarker);
            this.isVisible = false;
            this.refreshMarkers.emit(); // Emit události pro znovunačtení markerů
          },
          error: (err) => console.error('Error updating marker:', err)
        });
      } else {
        // Create new marker
        this.markerService.create(markerDto).subscribe({
          next: (createdMarker) => {
            this.marker = createdMarker;
            this.save.emit(createdMarker);
            this.isVisible = false;
            this.refreshMarkers.emit(); // Emit události pro znovunačtení markerů
          },
          error: (err) => console.error('Error creating marker:', err)
        });
      }
    }
  }

  show(): void {
    this.isVisible = true;
  }
}
