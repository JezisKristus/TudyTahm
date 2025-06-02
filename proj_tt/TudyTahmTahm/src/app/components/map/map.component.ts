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
  ViewChild,
  ViewContainerRef,
  ViewEncapsulation
} from '@angular/core';
import {CommonModule, NgForOf, NgIf} from '@angular/common';
import {FormsModule} from '@angular/forms';
import * as L from 'leaflet';
import 'leaflet-search';
import {AddMarkerPopupComponent} from './add-marker-popup/add-marker-popup.component';
import {MarkerDetailsComponent} from '../marker-details/marker-details.component';
import {SearchComponent} from '../search/search.component';
import {MarkerService} from '../../services/marker.service';
import {LabelService} from '../../services/label.service';
import {MapService} from '../../services/map.service';
import {AppMap, SharedUser} from '../../models/appMap';
import {AppMarker} from '../../models/appMarker';
import {Label} from '../../models/label';
import {CreateLabelDto} from '../../models/dtos/create-label.dto';
import {ColorMarkerComponent} from '../color-marker/color-marker.component';
import {ExtendedMarker} from '../../models/extended-marker';
import {MapDetailsPanelComponent} from '../map-details-panel/map-details-panel.component';
import {SharingService} from '../../services/sharing.service';
import {share} from 'rxjs';

class MapData {
  mapName?: string
  mapID?: number
}

/**
 * Main map component responsible for displaying and managing interactive map features
 * Handles markers, labels, and map interactions
 */
@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  standalone: true,
  imports: [CommonModule, NgIf, NgForOf, FormsModule, SearchComponent, MapDetailsPanelComponent],
  encapsulation: ViewEncapsulation.None
})
export class MapComponent implements OnInit, OnDestroy, AfterViewInit, OnChanges {
  /** Container reference for dynamic marker components */
  @ViewChild('markerHost', { read: ViewContainerRef }) private markerHost!: ViewContainerRef;

  /** Container reference for marker details component */
  @ViewChild('markerDetailsContainer', { read: ViewContainerRef, static: true })
  private markerDetailsContainer!: ViewContainerRef;

  /** References to color marker components */
  private colorMarkerRefs: ComponentRef<ColorMarkerComponent>[] = [];

  /** Interval ID for map change listener */
  private intervalId?: number;

  /** Main Leaflet map instance */
  map!: L.Map;
  mapName: string = '';
  private originalMapName: string = '';
  layer: any;
  mapID: number = Number(sessionStorage.getItem('Map.mapID')) || 1;
  private Lmarkers: ExtendedMarker[] = [];
  private markerDetailsRef?: ComponentRef<MarkerDetailsComponent>;
  private popupRef: ComponentRef<AddMarkerPopupComponent> | null = null;
  selectedMarker: ExtendedMarker | null = null;
  @Input() labelFilter: number | null = null;
  selectedLabelFilter: number | null = null;
  private isInitialLoad: boolean = true;

  showDetailsPanel: boolean = false;
  currentMap: AppMap | null = null;
  currentUserId: number = 1;

  labels: Label[] = [];
  showLabelModal: boolean = false;
  newLabel: CreateLabelDto = {
    idMap: this.mapID,
    name: '',
    color: '#3a5a40'
  };

  @Output() markerClicked = new EventEmitter<L.Marker<any>>();

  @Output() detailsPanelToggle = new EventEmitter<void>();

  constructor(
    private viewContainerRef: ViewContainerRef,
    private markerService: MarkerService,
    private labelService: LabelService,
    private mapService: MapService,
    private sharingService: SharingService
  ) {}

  /**
   * Initializes the component and loads initial data
   */
  ngOnInit(): void {
    const mapID = sessionStorage.getItem('Map.mapID');
    if (!mapID) {
      console.error('No mapID found in sessionStorage.');
      sessionStorage.setItem('Map.mapID', '1');
      console.log('Setting default mapID to 1.');
    } else {
      console.log('Retrieved mapID from sessionStorage:', mapID);
    }
    this.mapID = Number(mapID) || 1;
    this.labels = [];
    this.loadMapData();
  }

  /**
   * Sets up the map after view initialization
   */
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
  /**
   * Initializes the Leaflet map with default settings
   */
  private initializeMap(): void {
    try {
      this.map = L.map('map').setView([49.8022514, 15.6252330], 8);
      this.layer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(this.map);

      this.map.on('contextmenu', (event: L.LeafletMouseEvent) => {
        this.showPopup(event.latlng);
      });
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }

  /**
   * Displays marker creation popup at specified coordinates
   * @param latlng Coordinates where the popup should appear
   */
  private showPopup(latlng: L.LatLng): void {
    if (this.popupRef) {
      this.popupRef.destroy();
      this.popupRef = null;
    }

    this.popupRef = this.viewContainerRef.createComponent(AddMarkerPopupComponent);
    this.popupRef.instance.latlng = latlng;
    this.popupRef.instance.addMarker.subscribe((coordinates: L.LatLng) => {
      this.addMarker(coordinates);
      if (this.popupRef) {
        this.popupRef.destroy();
        this.popupRef = null;
      }
    });

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

    const removePopup = () => {
      this.map.closePopup(popupOverlay);
      if (this.popupRef) {
        this.popupRef.destroy();
        this.popupRef = null;
      }
      this.map.off('click', removePopup);
    };

    this.map.on('click', removePopup);
  }

  /**
   * Creates and adds a new marker to the map
   * @param latlng Coordinates for the new marker
   */
  private addMarker(latlng: L.LatLng): void {
    const markerData: AppMarker = {
      markerID: 0,
      idMap: this.mapID,
      idLabel: 0,
      markerName: 'New Marker',
      markerDescription: '',
      longitude: latlng.lng,
      latitude: latlng.lat
    };

    this.markerService.createMarker(markerData).subscribe({
      next: (createdMarker) => {
        try {
          const compRef = this.markerHost.createComponent(ColorMarkerComponent);
          compRef.instance.map = this.map;
          compRef.instance.markerData = createdMarker;
          compRef.instance.labelColor = '#0000ff';

          // Správně: použijeme markerClick event z komponenty
          compRef.instance.markerClick.subscribe((clickedMarkerData: AppMarker) => {
            this.onColorMarkerClick(clickedMarkerData.markerID);
          });

          // Vytvoříme ExtendedMarker a přidáme ho do pole Lmarkers
          setTimeout(() => {
            if (compRef.instance.leafletMarker) {
              const extendedMarker = compRef.instance.leafletMarker as ExtendedMarker;
              extendedMarker.markerData = createdMarker;
              extendedMarker.markerID = createdMarker.markerID;
              extendedMarker.selected = true;
              this.Lmarkers.push(extendedMarker);
              this.selectedMarker = extendedMarker;
            }
          });

          this.colorMarkerRefs.push(compRef);

          if (this.markerDetailsRef) {
            this.markerDetailsRef.destroy();
          }

          this.markerDetailsRef = this.markerDetailsContainer.createComponent(MarkerDetailsComponent);
          this.markerDetailsRef.instance.marker = { ...createdMarker };
          this.markerDetailsRef.instance.labels = [...this.labels];

          this.markerDetailsRef.instance.cancel.subscribe(() => this.onCancel());
          this.markerDetailsRef.instance.save.subscribe((updatedMarker: AppMarker) => this.onSave(updatedMarker));
          this.markerDetailsRef.instance.deleteMarker.subscribe((marker: AppMarker) => this.onDeleteMarker(marker));

          this.markerDetailsRef.changeDetectorRef.detectChanges();

          const container = document.querySelector('.marker-details-container');
          if (container) {
            container.classList.add('visible');
          }

          if (this.selectedLabelFilter !== null && createdMarker.idLabel !== this.selectedLabelFilter) {
            compRef.instance.hide();
          }

        } catch (error) {
          console.error('Error creating marker component:', error);
          alert('Nepodařilo se přidat marker - chyba při vytváření komponenty.');
        }
      },
      error: (err) => {
        console.error('Chyba při přidávání markeru:', err);
        alert('Nepodařilo se přidat marker.');
      }
    });
  }

  /**
   * Adds multiple markers to the map
   * @param markers Array of marker data to be added
   */
  private addMarkersToMap(markers: AppMarker[]): void {
    if (!this.markerHost) {
      console.error('markerHost not initialized');
      return;
    }

    this.colorMarkerRefs.forEach(ref => ref.destroy());
    this.colorMarkerRefs = [];

    markers.forEach(markerData => {
      if (!this.isValidLatLng(markerData.latitude, markerData.longitude)) {
        console.warn('Skipping invalid marker coordinates:', markerData);
        return;
      }

      try {
        const compRef = this.markerHost.createComponent(ColorMarkerComponent);

        if (!compRef || !compRef.instance) {
          console.error('Failed to create ColorMarkerComponent instance');
          return;
        }

        const label = this.labels.find(l => l.labelID === markerData.idLabel);
        const color = label?.color ?? '#d4af37';

        compRef.instance.map = this.map;
        compRef.instance.markerData = markerData;
        compRef.instance.labelColor = color;

        // Subscribe to marker click events
        compRef.instance.markerClick.subscribe((clickedMarkerData: AppMarker) => {
          console.log('Marker clicked with data:', clickedMarkerData);
          this.onColorMarkerClick(clickedMarkerData.markerID);
        });

        if (this.selectedLabelFilter !== null && markerData.idLabel !== this.selectedLabelFilter) {
          compRef.instance.hide();
        }

        this.colorMarkerRefs.push(compRef);
      } catch (error) {
        console.error('Error creating marker component:', error);
      }
    });
  }

  /**
   * Handles marker click events
   * @param markerID ID of the clicked marker
   */
  private onColorMarkerClick(markerID: number): void {
    // Reset previous selection
    if (this.selectedMarker) {
      const previousRef = this.colorMarkerRefs.find(ref =>
          ref.instance.leafletMarker && ref.instance.leafletMarker.markerID === this.selectedMarker?.markerID
      );
      if (previousRef) {
        const label = this.labels.find(l => l.labelID === previousRef.instance.markerData.idLabel);
        previousRef.instance.labelColor = label?.color ?? '#d4af37';
      }
    }

    // Najdi správný marker podle markerID a nastav selectedMarker na jeho ExtendedMarker
    const ref = this.colorMarkerRefs.find(ref =>
      ref.instance.leafletMarker && ref.instance.leafletMarker.markerID === markerID
    );

    if (!ref || !ref.instance.leafletMarker) return;

    // Ulož skutečný ExtendedMarker do selectedMarker
    this.selectedMarker = ref.instance.leafletMarker;
    ref.instance.labelColor = '#0000ff';

    // Show marker details
    this.onMarkerClick(ref.instance.markerData);
  }

  onMarkerClick(markerData: AppMarker): void {
    try {
      if (this.markerDetailsRef) {
        this.markerDetailsRef.destroy();
      }

      this.markerDetailsRef = this.markerDetailsContainer.createComponent(MarkerDetailsComponent);

      if (!this.markerDetailsRef || !this.markerDetailsRef.instance) {
        throw new Error('Failed to create MarkerDetails component');
      }

      this.markerDetailsRef.instance.marker = { ...markerData };
      this.markerDetailsRef.instance.labels = [...this.labels];

      this.markerDetailsRef.instance.cancel.subscribe(() => this.onCancel());
      this.markerDetailsRef.instance.save.subscribe((updatedMarker: AppMarker) => this.onSave(updatedMarker));
      this.markerDetailsRef.instance.deleteMarker.subscribe((marker: AppMarker) => this.onDeleteMarker(marker));
      this.markerDetailsRef.instance.refreshMarkers.subscribe(() => this.refreshMarkers());

      this.markerDetailsRef.changeDetectorRef.detectChanges();

      const container = document.querySelector('.marker-details-container');
      if (container) {
        container.classList.add('visible');
      }
    } catch (error) {
      console.error('Error creating marker details:', error);
      this.clearSelectedMarker();
    }
  }

  /**
   * Updates marker visibility based on label filter
   * @param marker Marker to be filtered
   */
  private applyLabelFilter(marker: ExtendedMarker): void {
    const filterID = this.labelFilter !== null ? this.labelFilter : this.selectedLabelFilter;

    if (filterID !== null && marker.markerData && marker.markerData.idLabel !== filterID) {
      marker.setOpacity(0);
    } else {
      marker.setOpacity(1);
    }
  }

  /**
   * Validates coordinates
   * @param lat Latitude value
   * @param lng Longitude value
   * @returns boolean indicating if coordinates are valid
   */
  private isValidLatLng(lat: number, lng: number): boolean {
    return typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng);
  }

  onCancel(): void {
    this.clearSelectedMarker();
  }

  onSave(markerData?: AppMarker): void {
    if (!this.selectedMarker || !markerData) {
      console.warn('No marker selected or no marker data provided');
      this.clearSelectedMarker();
      return;
    }

    this.markerService.updateMarker(markerData).subscribe({
      next: (response) => {
        const updatedMarker = response || markerData;
        const markerIndex = this.colorMarkerRefs.findIndex(ref =>
          ref.instance.markerData.markerID === updatedMarker.markerID
        );
        if (markerIndex !== -1) {
          this.colorMarkerRefs[markerIndex].instance.removeFromMap();
          this.colorMarkerRefs[markerIndex].destroy();
          this.colorMarkerRefs.splice(markerIndex, 1);
        }
        const compRef = this.markerHost.createComponent(ColorMarkerComponent);
        compRef.instance.map = this.map;
        compRef.instance.markerData = updatedMarker;
        const label = this.labels.find(l => l.labelID === updatedMarker.idLabel);
        compRef.instance.labelColor = label?.color ?? '#d4af37';
        // Správně: použijeme markerClick event z komponenty
        compRef.instance.markerClick.subscribe((clickedMarkerData: AppMarker) => {
          this.onColorMarkerClick(clickedMarkerData.markerID);
        });
        this.colorMarkerRefs.push(compRef);
        const extendedMarker = compRef.instance.leafletMarker as ExtendedMarker;
        if (extendedMarker) {
          extendedMarker.markerData = updatedMarker;
          extendedMarker.markerID = updatedMarker.markerID;
          extendedMarker.selected = false;
          this.Lmarkers.push(extendedMarker);
        }
        console.log('Marker successfully updated:', updatedMarker);
        this.clearSelectedMarker();
      },
      error: (err) => {
        console.error('Error updating marker:', err);
        this.clearSelectedMarker();
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

        const markerCompIndex = this.colorMarkerRefs.findIndex(ref =>
          ref.instance.markerData.markerID === markerId
        );

        if (markerCompIndex !== -1) {
          this.colorMarkerRefs[markerCompIndex].instance.removeFromMap();
          this.colorMarkerRefs[markerCompIndex].destroy();
          this.colorMarkerRefs.splice(markerCompIndex, 1);
        }

        this.clearSelectedMarker();
      },
      error: (err) => console.error('Error deleting marker:', err)
    });
  }

  private loadMarkers(): void {
    this.Lmarkers.forEach(marker => marker.remove());
    this.Lmarkers = [];

    const mapID = sessionStorage.getItem('Map.mapID') || '1';

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
    this.Lmarkers.forEach(marker => marker.remove());
    this.Lmarkers = [];

    this.selectedMarker = null;

    this.loadMarkers();
  }

  /**
   * Handles the search functionality
   * @param query Search query string
   */
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

          this.map.setView([lat, lon], 13);

          this.colorMarkerRefs = this.colorMarkerRefs.filter(ref => {
            if (ref.instance.markerData && ref.instance.markerData.markerID === -9999) {
              ref.destroy();
              return false;
            }
            return true;
          });

          const markerData: AppMarker = {
            markerID: -9999,
            idMap: this.mapID,
            idLabel: 0,
            markerName: 'Search Result',
            markerDescription: place.display_name,
            longitude: lon,
            latitude: lat
          };
          const compRef = this.markerHost.createComponent(ColorMarkerComponent);
          compRef.instance.map = this.map;
          compRef.instance.markerData = markerData;
          compRef.instance.labelColor = '#e53935';

          // Správně: použijeme markerClick event z komponenty
          compRef.instance.markerClick.subscribe((clickedMarkerData: AppMarker) => {
            this.onColorMarkerClick(clickedMarkerData.markerID);
          });

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

  /**
   * Updates label filter based on selection
   * @param event Selection change event
   */
  onLabelFilterChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const labelID = selectElement.value ? parseInt(selectElement.value, 10) : null;

    if (this.selectedLabelFilter === labelID) {
      return;
    }

    this.selectedLabelFilter = labelID;
    console.log('Filtering by label ID:', labelID);

    this.colorMarkerRefs.forEach(ref => {
      if (Number.isNaN(labelID) || labelID === null) {
        ref.instance.show();
      } else {
        if (ref.instance.markerData.idLabel === labelID) {
          ref.instance.show();
        } else {
          ref.instance.hide();
        }
      }
    });
  }

  /**
   * Loads and caches labels for current map
   */
  private loadLabels(): void {
    const mapID = Number(sessionStorage.getItem('Map.mapID'));

    // Při prvním načtení ignorujeme cache
    if (!this.isInitialLoad) {
      const cachedLabels = sessionStorage.getItem(`labels_${mapID}`);
      if (cachedLabels) {
        try {
          this.labels = JSON.parse(cachedLabels);
          console.log('Načtené štítky z cache:', this.labels);
          return;
        } catch (e) {
          console.warn('Chyba při parsování cache:', e);
          sessionStorage.removeItem(`labels_${mapID}`);
        }
      }
    }

    this.labelService.getLabelsByMapID(mapID).subscribe({
      next: (labels) => {
        this.labels = labels.map(label => ({
          labelID: label.labelID,
          idMap: label.idMap,
          name: label.name,
          color: label.color
        }));

        sessionStorage.setItem(`labels_${mapID}`, JSON.stringify(this.labels));
        console.log('Načtené štítky z API:', this.labels);
        this.isInitialLoad = false; // Nastavíme příznak na false po prvním načtení
      },
      error: (err) => {
        console.error('Chyba při načítání štítků:', err);
        this.labels = [];
        this.isInitialLoad = false;
      }
    });
  }

  /**
   * Deletes a label and refreshes related data
   * @param labelID ID of label to delete
   */
  deleteLabel(labelID: number): void {
    this.labelService.deleteLabel(labelID).subscribe({
      next: () => {
        console.log('Label deleted successfully');
        this.invalidateLabelsCache();
        this.loadLabels();
        this.refreshMarkers();
      },
      error: (err) => {
        console.error('Error deleting label:', err);
        alert('Failed to delete label');
      }
    });
  }

  ensureLabelsLoaded(): void {
    if (this.labels.length === 0) {
      this.loadLabels();
    }
  }

  private invalidateLabelsCache(): void {
    const mapID = sessionStorage.getItem('Map.mapID');
    if (mapID) {
      sessionStorage.removeItem(`labels_${mapID}`);
    }

    Object.keys(sessionStorage)
      .filter(key => key.startsWith('labels_'))
      .forEach(key => sessionStorage.removeItem(key));

    console.log('Labels cache invalidated');
  }

  openLabelModal(): void {
    this.newLabel = {
      idMap: this.mapID,
      name: '',
      color: '#3a5a40'
    };

    this.showLabelModal = true;
  }

  closeLabelModal(): void {
    this.showLabelModal = false;
  }

  updateLabel(labelData: Label): void {
    this.labelService.updateLabel(labelData).subscribe({
      next: (updatedLabel) => {
        console.log('Label updated successfully');
        this.invalidateLabelsCache();
        this.loadLabels();
        this.refreshMarkers();
      },
      error: (err) => {
        console.error('Error updating label:', err);
        alert('Failed to update label');
      }
    });
  }

  createLabel(): void {
    if (!this.newLabel.name.trim()) {
      alert('Label name is required');
      return;
    }

    const createLabelDto: CreateLabelDto = {
      idMap: this.mapID,
      name: this.newLabel.name,
      color: this.newLabel.color
    };

    this.labelService.createLabel(createLabelDto).subscribe({
      next: (newLabel) => {
        console.log('New label created:', newLabel);
        this.closeLabelModal();
        this.invalidateLabelsCache();
        this.loadLabels();
      },
      error: (err) => {
        console.error('Error saving label:', err);
        alert('An error occurred while saving the label');
      }
    });
  }

  private clearSelectedMarker(): void {
    if (this.selectedMarker) {
      const ref = this.colorMarkerRefs.find(ref =>
        ref.instance.leafletMarker && ref.instance.leafletMarker.markerID === this.selectedMarker?.markerID
      );
      if (ref) {
        const label = this.labels.find(l => l.labelID === ref.instance.markerData.idLabel);
        ref.instance.labelColor = label?.color ?? '#d4af37';
        ref.changeDetectorRef.detectChanges();
      }
    }

    this.selectedMarker = null;

    const container = document.querySelector('.marker-details-container');
    if (container) {
      container.classList.remove('visible');
    }

    if (this.markerDetailsRef) {
      this.markerDetailsRef.destroy();
      this.markerDetailsRef = undefined;
    }
  }

  onLocationSelected(location: {lat: number, lon: number, name: string}): void {
    this.map.setView([location.lat, location.lon], 13);

    this.colorMarkerRefs = this.colorMarkerRefs.filter(ref => {
      if (ref.instance.markerData && ref.instance.markerData.markerID === -9999) {
        ref.destroy();
        return false;
      }
      return true;
    });

    const markerData: AppMarker = {
      markerID: -9999,
      idMap: this.mapID,
      idLabel: 0,
      markerName: 'Search Result',
      markerDescription: location.name,
      longitude: location.lon,
      latitude: location.lat
    };

    const compRef = this.markerHost.createComponent(ColorMarkerComponent);
    compRef.instance.map = this.map;
    compRef.instance.markerData = markerData;
    compRef.instance.labelColor = '#e53935';
    this.colorMarkerRefs.push(compRef);
  };

  private loadMapData(): void {
    const mapID = sessionStorage.getItem('Map.mapID');
    if (!mapID) {
      console.error('No mapID found in sessionStorage.');
      return;
    }

    this.mapService.getMapById(Number(mapID)).subscribe({
      next: (mapData: MapData) => {
        if (mapData && mapData.mapName) {
          this.mapName = mapData.mapName.trim();
          this.originalMapName = this.mapName;
          this.updateInputValue(this.mapName);
        } else {
          console.warn('Received invalid map data');
          this.mapName = 'Unnamed Map';
          this.originalMapName = 'Unnamed Map';
        }
      },
      error: (err: Error) => {
        console.error('Error loading map data:', err);
        this.mapName = 'Unnamed Map';
        this.originalMapName = 'Unnamed Map';
      }
    });
  }

  private resetMapName(): void {
    this.mapName = this.originalMapName;
    this.updateInputValue(this.originalMapName);
  }

  private updateInputValue(value: string): void {
    console.log('Setting input value to:', value);
    setTimeout(() => {
      const inputElement = document.querySelector('.map-title-input') as HTMLInputElement;
      if (inputElement) {
        inputElement.value = value;
      } else {
        console.warn('Input element .map-title-input not found');
      }
    });
  }

  ngOnChanges(): void {
    this.Lmarkers.forEach(marker => {
      this.applyLabelFilter(marker);
    });
  }

  /**
   * Handles cleanup when component is destroyed
   */
  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    if (this.map) {
      this.map.remove();
    }

    if (this.popupRef) {
      this.popupRef.destroy();
      this.popupRef = null;
    }

    if (this.markerDetailsRef) {
      this.markerDetailsRef.destroy();
      this.markerDetailsRef = undefined;
    }

    this.Lmarkers.forEach(marker => {
      marker.remove();
      marker.off();
    });
    this.Lmarkers = [];
    this.colorMarkerRefs.forEach(ref => ref.destroy());
  }


  toggleDetailsPanel() {
    this.showDetailsPanel = !this.showDetailsPanel;
  }

  onShareMap(sharedUser: SharedUser) {
    console.log('Sharing map with:', sharedUser.userEmail);

    this.sharingService.addUserToMap(sharedUser).subscribe(
      response => {
        if (this.currentMap) {
          this.currentMap.sharedWith.push(response);
        } else {
          console.error('currentMap is null or undefined.');
        }
      }
    );
  }

  onRemoveSharedUser(userId: number) {
    // Call your service to remove shared user
    console.log('Removing user:', userId);
    // Example:
    // this.mapSharingService.removeSharedUser(this.currentMap.mapID, userId).subscribe(
    //   () => {
    //     // Remove user from the sharedWith array
    //     this.currentMap.sharedWith = this.currentMap.sharedWith.filter(user => user.userId !== userId);
    //   }
    // );
  }

  onUpdateMapDescription(description: string) {
    // Call your service to update map description
    console.log('Updating description:', description);
    if (this.currentMap) {
      this.currentMap.description = description;
    }
    // Example:
    // this.mapService.updateMapDescription(this.currentMap.mapID, description).subscribe();
  }

  onClosePanelDetails() {
    this.showDetailsPanel = false;
  }
}
