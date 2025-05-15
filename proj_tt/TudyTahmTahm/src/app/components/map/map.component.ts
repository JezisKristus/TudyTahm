import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ComponentRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output, ViewChild,
  ViewContainerRef,
  ViewEncapsulation
} from '@angular/core';
import { CommonModule, NgForOf, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import 'leaflet-search';

import { AddMarkerPopupComponent } from './add-marker-popup/add-marker-popup.component';
import { MarkerDetailsComponent } from '../marker-details/marker-details.component';
import { SearchComponent } from '../search/search.component';
import { MarkerService } from '../../services/marker.service';
import { LabelService } from '../../services/label.service';
import { AppMarker } from '../../models/appMarker';
import { Label } from '../../models/label';
import { CreateLabelDto } from '../../models/dtos/create-label.dto';
import { ColorMarkerComponent} from '../color-marker/color-marker.component';

// Interface for extended marker with AppMarker properties
interface ExtendedMarker extends L.Marker {
  selected: boolean;
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
    MarkerDetailsComponent,
    ColorMarkerComponent,
  ],
  encapsulation: ViewEncapsulation.None
})
export class MapComponent implements OnInit, OnDestroy, AfterViewInit, OnChanges {
  // ViewChild for dynamic component creation
  @ViewChild('markerHost', { read: ViewContainerRef })
  private markerHost!: ViewContainerRef;
  private colorMarkerRefs: ComponentRef<ColorMarkerComponent>[] = [];

  @ViewChild('markerDetailsContainer', { read: ViewContainerRef, static: true })
  private markerDetailsContainer!: ViewContainerRef;

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

  showMarkerList: boolean = false;
  markersWithoutLabel: ExtendedMarker[] = [];

  // API base URL
  private apiBaseUrl: string = 'http://localhost:5010/api';

  constructor(
    private viewContainerRef: ViewContainerRef,
    private markerService: MarkerService,
    private labelService: LabelService,
    private changeDetectorRef: ChangeDetectorRef
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
    try {
      this.map = L.map('map').setView([49.8022514, 15.6252330], 8); // Initialize the map
      this.layer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(this.map);

      // Add context menu handler for right-click
      this.map.on('contextmenu', (event: L.LeafletMouseEvent) => {
        this.showPopup(event.latlng);
      });
    } catch (error) {
      console.error('Error initializing map:', error);
    }
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
      if (this.popupRef) {
        this.popupRef.destroy(); // Close popup after adding marker
        this.popupRef = null;
      }
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

  // For new marker - uloží do backendu a obnoví markery (všechny jako color-marker)
  private addMarker(latlng: L.LatLng): void {
    const markerData: AppMarker = {
      markerID: 0,
      IDPoint: 0,
      IDMap: this.mapID,
      IDLabel: 0,
      markerName: 'New Marker',
      markerDescription: '',
      longitude: latlng.lng,
      latitude: latlng.lat
    };

    this.markerService.createMarker(markerData).subscribe({
      next: () => {
        this.refreshMarkers(); // Po úspěchu načti znovu všechny markery
      },
      error: (err) => {
        console.error('Chyba při přidávání markeru:', err);
        alert('Nepodařilo se přidat marker.');
      }
    });
  }


  private addMarkersToMap(markers: AppMarker[]): void {
    if (!this.markerHost) {
      console.error('markerHost not initialized');
      return;
    }

    // Clear old components
    this.colorMarkerRefs.forEach(ref => ref.destroy());
    this.colorMarkerRefs = [];

    markers.forEach(markerData => {
      // Skip invalid markers
      if (!this.isValidLatLng(markerData.latitude, markerData.longitude)) {
        console.warn('Skipping invalid marker coordinates:', markerData);
        return;
      }

      // Get color from label
      const label = this.labels.find(l => l.labelID === markerData.IDLabel);
      const color = label?.labelColor ?? '#d4af37';

      try {
        // Create and insert ColorMarkerComponent
        const compRef = this.markerHost.createComponent(ColorMarkerComponent);

        // Make sure the component instance exists
        if (!compRef || !compRef.instance) {
          console.error('Failed to create ColorMarkerComponent instance');
          return;
        }

        // Set input properties
        compRef.instance.map = this.map;
        compRef.instance.markerData = markerData;
        compRef.instance.labelColor = color;

        // Add click handler for marker selection
        if (compRef.instance.leafletMarker) {
          compRef.instance.leafletMarker.on('click', () => {
            this.onColorMarkerClick(markerData.markerID);
          });
        } else {
          // We need to wait for the marker to be created
          setTimeout(() => {
            if (compRef.instance.leafletMarker) {
              compRef.instance.leafletMarker.on('click', () => {
                this.onColorMarkerClick(markerData.markerID);
              });
            }
          }, 100);
        }

        this.colorMarkerRefs.push(compRef);
      } catch (error) {
        console.error('Error creating marker component:', error);
      }
    });
  }

  private onColorMarkerClick(markerID: number): void {
    const ref = this.colorMarkerRefs.find(ref => ref.instance.markerData.markerID === markerID);
    if (!ref) return;
    this.onMarkerClick(ref.instance.markerData);
  }

  onMarkerClick(markerData: AppMarker): void {
    // Nastavení selectedMarker pro správnou funkci onCancel
    const selectedColorMarker = this.colorMarkerRefs.find(ref =>
      ref.instance.markerData.markerID === markerData.markerID
    );
    if (selectedColorMarker) {
      this.selectedMarker = {
        selected: true,
        markerData: markerData,
        markerID: markerData.markerID
      } as ExtendedMarker;
    }

    // Změna barev markerů
    this.colorMarkerRefs.forEach(ref => {
      if (ref.instance.markerData.markerID === markerData.markerID) {
        ref.instance.labelColor = '#4287f5';
        ref.changeDetectorRef.detectChanges();
      } else {
        const label = this.labels.find(l => l.labelID === ref.instance.markerData.IDLabel);
        ref.instance.labelColor = label?.labelColor ?? '#d4af37';
        ref.changeDetectorRef.detectChanges();
      }
    });

    // Zrušení existujícího detailu
    if (this.markerDetailsRef) {
      this.markerDetailsRef.destroy();
    }

    /// Vytvoření nového detailu
    this.markerDetailsRef = this.markerDetailsContainer.createComponent(MarkerDetailsComponent);
    this.markerDetailsRef.instance.marker = markerData;
    this.markerDetailsRef.instance.labels = this.labels;

    // Vynutit detekci změn po nastavení dat
    this.markerDetailsRef.changeDetectorRef.detectChanges();

    // Přidání třídy visible pro zobrazení containeru
    const container = document.querySelector('.marker-details-container');
    if (container) {
      container.classList.add('visible');
    }

    // Správné napojení eventů
    this.markerDetailsRef.instance.cancel.subscribe(() => this.onCancel());
    this.markerDetailsRef.instance.save.subscribe((updatedMarker: AppMarker) => this.onSave(updatedMarker));
    this.markerDetailsRef.instance.deleteMarker.subscribe((marker: AppMarker) => this.onDeleteMarker(marker));
  };

  private applyLabelFilter(marker: ExtendedMarker): void {
    const filterID = this.labelFilter !== null ? this.labelFilter : this.selectedLabelFilter;

    if (filterID !== null && marker.markerData && marker.markerData.IDLabel !== filterID) {
      marker.setOpacity(0); // Hide marker
    } else {
      marker.setOpacity(1); // Show marker
    }
  }

  private isValidLatLng(lat: number, lng: number): boolean {
    return typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng);
  }

  onCancel(): void {
    this.clearSelectedMarker();
  }

  onSave(markerData?: AppMarker): void {
    if (!this.selectedMarker || !markerData) {
      console.warn('No marker selected or no marker data provided');
      this.clearSelectedMarker(); // Zavřeme panel i při chybě
      return;
    }

    // Refresh only the saved marker
    this.markerService.getMarkerByMarkerID(markerData.markerID).subscribe({
      next: (updatedMarker) => {
        if (updatedMarker) {  // Přidaná kontrola null
          if (this.selectedMarker) {
            this.selectedMarker.markerData = updatedMarker;
            console.log(`Marker with ID ${markerData.markerID} refreshed.`);
          }
        } else {
          console.warn('Server returned null for marker update');
          // Použijeme původní data markeru
          if (this.selectedMarker) {
            this.selectedMarker.markerData = markerData;
          }
        }
        this.clearSelectedMarker(); // Vždy zavřeme panel
      },
      error: (err) => {
        console.error('Error refreshing marker:', err);
        this.clearSelectedMarker(); // Zavřeme panel i při chybě
      }
    });
  }

  onDeleteMarker(marker: AppMarker | null): void {
    if (!marker) {
      console.warn('No marker provided for deletion');
      return;
    }

    const markerId = marker.markerID;

    if (!markerId && markerId !== 0) {
      console.warn('Cannot delete marker without a valid markerId.');
      return;
    }

    this.markerService.deleteMarker({...marker, markerID: markerId}).subscribe({
      next: () => {
        console.log(`Marker with ID ${markerId} deleted successfully.`);

        // Find and remove the marker from the map
        const markerToRemove = this.Lmarkers.find(m => m.markerID === markerId);
        if (markerToRemove) {
          this.removeMarkerFromMap(markerToRemove);
        }

        this.clearSelectedMarker();
      },
      error: (err) => console.error('Error deleting marker:', err)
    });
  }

  private removeMarkerFromMap(marker: ExtendedMarker): void {
    if (!marker) return;

    // Remove from map
    marker.remove();
    // Remove from our array
    this.Lmarkers = this.Lmarkers.filter(m => m !== marker);

    // Reset selected marker if it's the one being removed
    if (this.selectedMarker === marker) {
      this.selectedMarker = null;
    }
  }

  private loadMarkers(): void {
    // Clear existing markers first to prevent duplicates
    this.Lmarkers.forEach(marker => marker.remove());
    this.Lmarkers = [];

    const mapID = sessionStorage.getItem('Map.mapID') || '1'; // Default map ID

    if (!mapID) {
      console.error('No mapID found in sessionStorage.');
      return;
    }

    this.markerService.getMarkersByMapId(Number(mapID)).subscribe({
      next: (markers) => {
        if (Array.isArray(markers)) {
          console.log('Markers loaded:', markers);
          this.addMarkersToMap(markers);
        } else {
          console.error('Invalid marker data format:', markers);
        }
      },
      error: (err) => console.error('Error loading markers:', err)
    });
  }

  private refreshMarkers(): void {
    // Remove all markers from the map
    this.Lmarkers.forEach(marker => marker.remove());
    this.Lmarkers = [];

    // Reset selected marker
    this.selectedMarker = null;

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
        if (data && Array.isArray(data) && data.length > 0) {
          const place = data[0];
          const lat = parseFloat(place.lat);
          const lon = parseFloat(place.lon);

          if (isNaN(lat) || isNaN(lon)) {
            console.error('Invalid coordinates from search:', place);
            alert('Invalid location coordinates received.');
            return;
          }

          // Zoom to location
          this.map.setView([lat, lon], 13);

          // Odstraň starý search marker (pokud existuje)
          this.colorMarkerRefs = this.colorMarkerRefs.filter(ref => {
            if (ref.instance.markerData && ref.instance.markerData.markerID === -9999) {
              ref.destroy();
              return false;
            }
            return true;
          });

          // Přidej nový search marker s červenou barvou
          const markerData: AppMarker = {
            markerID: -9999, // Speciální ID pro vyhledávací marker
            IDPoint: -1,
            IDMap: this.mapID,
            IDLabel: 0,
            markerName: 'Search Result',
            markerDescription: place.display_name,
            longitude: lon,
            latitude: lat
          };
          const compRef = this.markerHost.createComponent(ColorMarkerComponent);
          compRef.instance.map = this.map;
          compRef.instance.markerData = markerData;
          compRef.instance.labelColor = '#e53935'; // červená pro vyhledávání
          this.colorMarkerRefs.push(compRef);
        } else {
          alert('Location not found.');
        }
      })
      .catch(err => {
        console.error('Search error:', err);
        alert('Search failed. Please check your connection and try again.');
      });
  }

  onLabelFilterChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const labelID = selectElement.value ? parseInt(selectElement.value, 10) : null;
    this.selectedLabelFilter = labelID;
    console.log('Filtering by label ID:', labelID);

    // Update marker visibility when labelFilter changes
    this.Lmarkers.forEach(marker => {
      if (labelID !== null && marker.markerData && marker.markerData.IDLabel !== labelID) {
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
      next: (newLabel) => {
        console.log('New label created:', newLabel);
        this.closeLabelModal();
        this.loadLabels(); // Reload all labels after creating a new label

        // Only show markers without label if we actually have a label to assign
        if (newLabel && newLabel.labelID) {
          this.newLabel = newLabel;
          this.showMarkersWithoutLabel();
        }
      },
      error: (err) => {
        console.error('Error saving label:', err);
        alert('An error occurred while saving the label');
      }
    });
  }

  private showMarkersWithoutLabel(): void {
    // Filter markers without labels
    this.markersWithoutLabel = this.Lmarkers
      .filter(marker => marker.markerData && marker.markerData.IDLabel === 0);

    // Reset selected state for all markers
    this.markersWithoutLabel.forEach(marker => {
      marker.selected = false;
    });

    // Only show the dialog if we actually have markers without labels
    if (this.markersWithoutLabel.length > 0) {
      this.showMarkerList = true;
    } else {
      console.log('No markers without labels found');
    }
  }
  private clearSelectedMarker(): void {
    // Změna barvy posledního vybraného markeru
    if (this.selectedMarker) {
      const ref = this.colorMarkerRefs.find(ref =>
        ref.instance.markerData.markerID === this.selectedMarker?.markerData.markerID
      );
      if (ref) {
        const label = this.labels.find(l => l.labelID === ref.instance.markerData.IDLabel);
        ref.instance.labelColor = label?.labelColor ?? '#d4af37'; // Výchozí barva pokud není label
        ref.changeDetectorRef.detectChanges();
      }
    }

    // Reset selected marker
    this.selectedMarker = null;

    // Skrytí detailů
    const container = document.querySelector('.marker-details-container');
    if (container) {
      container.classList.remove('visible');
    }

    // Zrušení reference na marker-details komponentu
    if (this.markerDetailsRef) {
      this.markerDetailsRef.destroy();
      this.markerDetailsRef = undefined;
    }
  }
  ngOnChanges(): void {
    // Update marker visibility when labelFilter changes
    this.Lmarkers.forEach(marker => {
      this.applyLabelFilter(marker);
    });
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }

    // Clean up component references to prevent memory leaks
    if (this.popupRef) {
      this.popupRef.destroy();
      this.popupRef = null;
    }

    if (this.markerDetailsRef) {
      this.markerDetailsRef.destroy();
      this.markerDetailsRef = undefined;
    }

    // Remove all event listeners from markers
    this.Lmarkers.forEach(marker => {
      marker.remove();
      marker.off();
    });
    this.Lmarkers = [];
    this.colorMarkerRefs.forEach(ref => ref.destroy());
  }
}
