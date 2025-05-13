import {
  AfterViewInit,
  Component,
  ComponentRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  ViewContainerRef,
  ViewEncapsulation
} from '@angular/core';
import { CommonModule, NgForOf, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import 'leaflet-search';

import { AddMarkerPopupComponent } from './add-marker-popup/add-marker-popup.component';
import { MarkerDetailsComponent } from '../marker-details/marker-details.component';
import {SearchComponent} from '../search/search.component';
import { MarkerService } from '../../services/marker.service';
import { LabelService } from '../../services/label.service';
import { AppMarker } from '../../models/appMarker';
import { Label } from '../../models/label';
import { CreateLabelDto } from '../../models/dtos/create-label.dto';

// Interface for extended marker with AppMarker properties
interface ExtendedMarker extends L.Marker, AppMarker {
  markerData: AppMarker;
  markerID: number;
}

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    NgIf,
    NgForOf,
    FormsModule,
    SearchComponent,
    MarkerDetailsComponent
  ],
  encapsulation: ViewEncapsulation.None
})
export class MapComponent implements OnInit, OnDestroy, AfterViewInit, OnChanges {
  // Map related properties
  map!: L.Map;
  layer: any;
  mapID: number = Number(sessionStorage.getItem('Map.mapID')) || 1;
  private Lmarkers: ExtendedMarker[] = [];
  private searchMarker: L.Marker | null = null;
  private markerDetailsRef?: ComponentRef<MarkerDetailsComponent>;
  private popupRef: ComponentRef<AddMarkerPopupComponent> | null = null;
  searchQuery: string = '';

  // Marker related properties
  selectedMarker: ExtendedMarker | null = null;

  // Label related properties
  @Input() labelFilter: number | null = null;
  selectedLabelFilter: number | null = null;
  labels: Label[] = [];
  showLabelModal: boolean = false;
  newLabel: Label = {
    labelID: 0,
    labelName: '',
    labelColor: '#3a5a40' // Default color - matches the theme
  };

  // Outputs
  @Output() markerClicked = new EventEmitter<L.Marker<any>>();

  constructor(
    private viewContainerRef: ViewContainerRef,
    private markerService: MarkerService,
    private labelService: LabelService
  ) {}

  ngOnInit(): void {
    const mapID = sessionStorage.getItem('Map.mapID');
    if (!mapID) {
      console.error('No mapID found in sessionStorage.');
      sessionStorage.setItem('Map.mapID', '1'); // Default mapID
      console.log('Setting default mapID to 1.');
    } else {
      console.log('Retrieved mapID from sessionStorage:', mapID);
    }
    this.mapID = Number(mapID) || 1;
    this.labels = []; // Ensure labels array is initialized
  }

  ngAfterViewInit(): void {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
      console.error('Map container not found!');
      return;
    }

    this.initializeMap();
    this.loadMarkers();
    this.loadLabels();
  }

  private initializeMap(): void {
    this.map = L.map('map').setView([49.8022514, 15.6252330], 8); // Initialize the map
    this.layer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    // Add context menu handler for right-click
    this.map.on('contextmenu', (event: L.LeafletMouseEvent) => {
      this.showPopup(event.latlng);
    });
  }

  private showPopup(latlng: L.LatLng): void {
    // Destroy existing popup if it exists
    if (this.popupRef) {
      this.popupRef.destroy();
      this.popupRef = null;
    }

    // Create popup container
    const popupContainer = L.DomUtil.create('div', 'custom-popup-container');

    // Create component
    this.popupRef = this.viewContainerRef.createComponent(AddMarkerPopupComponent);
    this.popupRef.instance.latlng = latlng; // Pass coordinates to popup
    this.popupRef.instance.addMarker.subscribe((coordinates: L.LatLng) => {
      this.addMarker(coordinates); // Add marker to map
      this.popupRef?.destroy(); // Close popup after adding marker
      this.popupRef = null;
    });

    // Attach popup to DOM
    document.body.appendChild(this.popupRef.location.nativeElement);

    const popupOverlay = L.popup({
      closeButton: false,
      closeOnClick: false,
      autoClose: false,
      className: 'custom-popup-container',
    })
      .setLatLng(latlng)
      .setContent(this.popupRef.location.nativeElement)
      .openOn(this.map);

    // Logic to remove popup when clicking on map
    const removePopup = () => {
      this.map.closePopup(popupOverlay);
      if (this.popupRef) {
        this.popupRef.destroy();
        this.popupRef = null;
      }
      this.map.off('click', removePopup); // Remove listener
    };

    this.map.on('click', removePopup);
  }

  // For new marker
  private addMarker(latlng: L.LatLng): void {
    const marker = L.marker(latlng, {
      icon: L.icon({
        iconUrl: 'http://localhost:5010/api/Image/default-icon.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41]
      })
    }).addTo(this.map) as ExtendedMarker;

    // Initialize markerData with default values
    marker.markerData = {
      markerID: 0, // Will be assigned by the server after creation
      IDPoint: 0, // Will be assigned by the server after creation
      IDMap: this.mapID, // Current map ID
      IDLabel: 0, // Default label ID
      markerName: 'New Marker',
      markerDescription: '',
      markerIconPath: 'http://localhost:5010/api/Image/default-icon.png',
      longitude: latlng.lng,
      latitude: latlng.lat
    };

    this.Lmarkers.push(marker);

    marker.on('click', () => {
      this.onMarkerClick(marker);
    });

    this.selectedMarker = marker;
    this.onMarkerClick(marker);
  }

  // Essentially converting our markers to Leaflet markers
  private addMarkersToMap(markers: AppMarker[]): void {
    markers.forEach(markerData => {
      if (this.isValidLatLng(markerData.latitude, markerData.longitude)) {
        // Use default icon if markerIconPath is empty
        const markerIcon = L.icon({
          iconUrl: 'http://localhost:5010/api/Image/' + markerData.markerIconPath || 'http://localhost:5010/api/Image/default-icon.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41]
        });

        // Create Leaflet marker
        const leafletMarker = L.marker(
          [markerData.latitude, markerData.longitude],
          { icon: markerIcon }
        ).addTo(this.map) as ExtendedMarker;

        // Set markerData and ID
        leafletMarker.markerData = markerData;
        leafletMarker.markerID = markerData.markerID;

        this.Lmarkers.push(leafletMarker);

        leafletMarker.on('click', () => {
          this.onMarkerClick(leafletMarker);
        });

        // Apply label filter
        if (this.labelFilter !== null && markerData.IDLabel !== this.labelFilter) {
          leafletMarker.setOpacity(0); // Hide marker
        } else {
          leafletMarker.setOpacity(1); // Show marker
        }
      } else {
        console.warn('Invalid marker coordinates:', markerData);
      }
    });
  }

  private isValidLatLng(lat: number, lng: number): boolean {
    return typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng);
  }

  onMarkerClick(marker: ExtendedMarker): void {
    // Reset icon of previously selected marker
    if (this.selectedMarker && this.selectedMarker !== marker) {
      const defaultIcon = L.icon({
        iconUrl: this.selectedMarker.markerData.markerIconPath || 'http://localhost:5010/api/Image/default-marker.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41]
      });
      this.selectedMarker.setIcon(defaultIcon);
    }

    this.selectedMarker = marker;

    // Change icon of the selected marker
    const selectedIcon = L.icon({
      iconUrl: 'http://localhost:5010/api/Image/selected-marker.png', // Path to the selected marker icon
      iconSize: [30, 45], // Slightly larger size for emphasis
      iconAnchor: [15, 45]
    });
    marker.setIcon(selectedIcon);

    const markerData = marker.markerData || {};

    console.log('Normalized marker data:', markerData);

    this.markerClicked.emit(marker);

    // Destroy existing MarkerDetailsComponent if it exists
    if (this.markerDetailsRef) {
      this.markerDetailsRef.destroy();
    }

    this.markerDetailsRef = this.viewContainerRef.createComponent(MarkerDetailsComponent);

    // Set up event handlers
    this.markerDetailsRef.instance.cancel.subscribe(() => this.onCancel());
    this.markerDetailsRef.instance.save.subscribe((markerData: AppMarker) => this.onSave(markerData));
    this.markerDetailsRef.instance.deleteMarker.subscribe((marker: AppMarker) => this.onDeleteMarker(marker));
    this.markerDetailsRef.instance.refreshMarkers.subscribe(() => {
      this.refreshMarkers();
    });

    // Pass the markerData (including id) to the MarkerDetailsComponent
    console.log('Passing marker data to MarkerDetailsComponent:', marker.markerData);
    this.markerDetailsRef.instance.marker = marker.markerData;
    this.markerDetailsRef.instance.show();
  }

  onCancel(): void {
    if (this.selectedMarker) {
      // Reset icon of the last selected marker
      const originalIcon = L.icon({
        iconUrl: this.selectedMarker.markerData.markerIconPath || 'http://localhost:5010/api/Image/default-marker.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41]
      });
      this.selectedMarker.setIcon(originalIcon);
    }
    this.selectedMarker = null; // Reset selected marker
  }

  onSave(markerData?: AppMarker): void {
    if (this.selectedMarker) {
      if (markerData) {
        // Update icon if needed
        if (markerData.markerIconPath) {
          const icon = L.icon({
            iconUrl: markerData.markerIconPath,
            iconSize: [25, 41],
            iconAnchor: [12, 41]
          });
          this.selectedMarker.setIcon(icon);
        }

        // Refresh only the saved marker
        this.markerService.getMarkerByMarkerID(markerData.markerID).subscribe({
          next: (updatedMarker) => {
            this.selectedMarker!.markerData = updatedMarker;
            console.log(`Marker with ID ${markerData.markerID} refreshed.`);
          },
          error: (err) => console.error('Error refreshing marker:', err)
        });
      }

      // Reset icon of the last selected marker
      const originalIcon = L.icon({
        iconUrl: this.selectedMarker.markerData.markerIconPath || 'http://localhost:5010/api/Image/default-marker.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41]
      });
      this.selectedMarker.setIcon(originalIcon);
    }
    this.selectedMarker = null;
    console.log('Saving changes');
  }

  onDeleteMarker(marker: AppMarker | null): void {
    if (!marker) return;

    // Check for both capitalization variants
    const markerIdToUse = marker.markerID || (marker as any).markerID;

    // Ensure markerId is defined before sending the delete request
    if (markerIdToUse) {
      this.markerService.delete({...marker, markerID: markerIdToUse}).subscribe({
        next: () => {
          console.log(`Marker with ID ${markerIdToUse} deleted successfully.`);
          const markerToRemove = this.Lmarkers.find(m =>
            (m.markerID === markerIdToUse) || (m.markerID === markerIdToUse)
          );
          if (markerToRemove) {
            this.removeMarkerFromMap(markerToRemove);
          }
          this.resetMarkerDetails();
        },
        error: (err) => console.error('Error deleting marker:', err)
      });
    } else {
      console.warn('Cannot delete marker without a valid markerId.');
    }

    console.log('Deleting marker:', marker);
  }

  private resetMarkerDetails(): void {
    this.selectedMarker = null; // Reset selected marker
    if (this.markerDetailsRef) {
      this.markerDetailsRef.destroy(); // Destroy the MarkerDetailsComponent
      this.markerDetailsRef = undefined;
    }
  }

  private removeMarkerFromMap(marker: ExtendedMarker): void {
    if (!marker) return;

    // Remove from map
    marker.remove();
    // Remove from our array
    this.Lmarkers = this.Lmarkers.filter(m => m !== marker);
    this.selectedMarker = null;
  }

  private loadMarkers(): void {
    const mapID = sessionStorage.getItem('Map.mapID') || '1'; // Default map ID

    if (!mapID) {
      console.error('No mapID found in sessionStorage.');
      return;
    }

    this.markerService.getMarkersByMapId(Number(mapID)).subscribe({
      next: (markers) => {
        this.addMarkersToMap(markers);
      },
      error: (err) => console.error('Error loading markers:', err)
    });
  }

  private refreshMarkers(): void {
    // Remove all markers from the map
    this.Lmarkers.forEach(marker => marker.remove());
    this.Lmarkers = [];
    // Reload markers
    this.loadMarkers();
  }

  onSearch(query: string): void {
    if (!query) return;

    console.log('Searching for:', query);

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.length > 0) {
          const place = data[0];
          const lat = parseFloat(place.lat);
          const lon = parseFloat(place.lon);

          // Zoom to location
          this.map.setView([lat, lon], 13);

          // Remove previous search marker
          if (this.searchMarker) {
            this.map.removeLayer(this.searchMarker);
          }

          // Add new marker
          this.searchMarker = L.marker([lat, lon], {
            icon: L.icon({
              iconUrl: 'http://localhost:5010/api/Image/search-marker.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41]
            })
          })
            .addTo(this.map)
            .bindPopup(place.display_name)
            .openPopup();
        } else {
          alert('Location not found.');
        }
      })
      .catch(err => {
        console.error('Search error:', err);
        alert('Search failed.');
      });
  }

  onLabelFilterChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const labelID = selectElement.value ? parseInt(selectElement.value, 10) : null;
    this.selectedLabelFilter = labelID;
    console.log('Filtering by label ID:', labelID);

    // Update marker visibility when labelFilter changes
    this.Lmarkers.forEach(marker => {
      if (labelID !== null && marker.markerData.IDLabel !== labelID) {
        marker.setOpacity(0); // Hide marker
      } else {
        marker.setOpacity(1); // Show marker
      }
    });
  }

  private loadLabels(): void {
    const mapID = sessionStorage.getItem('Map.mapID');

    if (!mapID) {
      console.error('No mapID found in sessionStorage.');
      return;
    }

    this.labelService.getLabelsByMapID(Number(mapID)).subscribe({
      next: (labels) => {
        this.labels = labels || []; // Ensure labels is always an array
        console.log('Labels loaded:', this.labels);
      },
      error: (err) => {
        console.error('Error loading labels:', err);
        this.labels = []; // Fallback to an empty array on error
      }
    });
  }

  openLabelModal(): void {
    // Reset the form
    this.newLabel = {
      labelID: 0,
      labelName: '',
      labelColor: '#3a5a40'
    };

    // Show the modal
    this.showLabelModal = true;
  }

  closeLabelModal(): void {
    this.showLabelModal = false;
  }

  saveNewLabel(): void {
    if (!this.newLabel.labelName.trim()) {
      alert('Label name is required');
      return;
    }

    const createLabelDto: CreateLabelDto = {
      name: this.newLabel.labelName,
      color: this.newLabel.labelColor
    };

    this.labelService.createLabel(createLabelDto).subscribe({
      next: () => {
        this.closeLabelModal();
        this.loadLabels(); // Reload all labels after creating a new label
      },
      error: (err) => {
        console.error('Error saving label:', err);
        alert('An error occurred while saving the label');
      }
    });
  }

  ngOnChanges(): void {
    // Update marker visibility when labelFilter changes
    this.Lmarkers.forEach(marker => {
      if (this.labelFilter !== null && marker.markerData.IDLabel !== this.labelFilter) {
        marker.setOpacity(0); // Hide marker
      } else {
        marker.setOpacity(1); // Show marker
      }
    });
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
    if (this.popupRef) {
      this.popupRef.destroy();
    }
    if (this.markerDetailsRef) {
      this.markerDetailsRef.destroy();
    }
  }
}
