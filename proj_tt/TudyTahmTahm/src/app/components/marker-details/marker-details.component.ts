import { Component, Input, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import * as L from 'leaflet';
import {NgForOf, NgIf, NgOptimizedImage} from '@angular/common';
import {LeafletModule} from '@bluehalo/ngx-leaflet';
import { MarkerService } from '../../services/marker.service';
import { Marker} from '../../models/marker';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-marker-details',
  standalone: true,
  templateUrl: './marker-details.component.html',
  styleUrls: ['./marker-details.component.scss'],
  imports: [
    NgOptimizedImage,
    NgForOf,
    LeafletModule,
    NgIf,
    FormsModule
  ],
})

export class MarkerDetailsComponent implements OnChanges {
  @Input() marker: L.Marker | null = null; // Input for the selected marker
  @Output() cancel = new EventEmitter<void>(); // Emit when cancel is clicked
  @Output() save = new EventEmitter<void>(); // Emit when save is clicked
  @Output() deleteMarker = new EventEmitter<void>(); // Emit when marker should be deleted
  @Output() markerCreated = new EventEmitter<Marker>(); // Emit when a marker is created

  isVisible = true
  description: string = ''; // Description of the marker

  // Array of icon URLs for the icon grid
  icons: string[] = [
    'assets/icons/icon1.png',
    'assets/icons/icon2.png',
    'assets/icons/icon3.png',
    'assets/icons/icon4.png'
  ];

  constructor(private markerService: MarkerService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['marker'] && changes['marker'].currentValue) {
      console.log('Selected marker updated:', this.marker);
    }
  }

  onCancel(): void {
    this.deleteMarker.emit(); // Emit delete marker event
    this.cancel.emit(); // Emit cancel event
    this.isVisible = false; // Hide the marker details
  }

  onSave(): void {
    if (this.marker) {
      const markerDto = {
        idUser: 6, // Debug user
        markerName: 'New Marker', // Replace with actual name logic
        markerDescription: 'Description', // Replace with actual description logic
        markerIconPath: 'assets/icons/icon1.png', // Replace with selected icon logic
        latitude: this.marker.getLatLng().lat,
        longitude: this.marker.getLatLng().lng
      };

      /*if ((this.marker as any).markerId) {
        // Update existing marker
        this.markerService.update({ ...markerDto, markerId: (this.marker as any).markerId }).subscribe({
          next: (updatedMarker) => {
            console.log('Marker updated:', updatedMarker);
            this.markerCreated.emit(updatedMarker); // Emit the updated marker
            this.save.emit(); // Emit save event after successful update
          },
          error: (err) => {
            console.error('Error updating marker:', err);
          }
        });
      } else {*/
        // Create new marker
        this.markerService.create(markerDto).subscribe({
          next: (createdMarker) => {
            console.log('Marker created:', createdMarker);
            this.markerCreated.emit(createdMarker); // Emit the created marker
            this.save.emit(); // Emit save event after successful creation
          },
          error: (err) => {
            console.error('Error creating marker:', err);
          }
        });
      //}
    }
  }

  show(): void {
    this.isVisible = true; // Znovu zobrazí komponentu
  }
}
