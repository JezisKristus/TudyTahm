import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
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
import {AppMap, SharedUser} from '../../models/appMap';
import {AppMarker} from '../../models/appMarker';
import {Label} from '../../models/label';
import {CreateLabelDto} from '../../models/dtos/create-label.dto';
import {ColorMarkerComponent} from '../color-marker/color-marker.component';
import {ExtendedMarker} from '../../models/extended-marker';
import {MapDetailsPanelComponent} from '../map-details-panel/map-details-panel.component';
import {SharingService} from '../../services/sharing.service';
import {Subject, takeUntil} from 'rxjs';
import {ActivatedRoute} from '@angular/router';
import {MarkerManagerService} from '../../services/marker-manager.service';
import {LabelManagerService} from '../../services/label-manager.service';
import {MapInitializationService} from '../../services/map-initialization.service';

interface MapState {
  mapID: number;
  mapName: string;
  originalMapName: string;
  currentMap: AppMap | null;
  selectedMarker: ExtendedMarker | null;
  selectedLabelFilter: number | null;
  showDetailsPanel: boolean;
  showLabelModal: boolean;
}

interface MarkerState {
  markers: ExtendedMarker[];
  colorMarkerRefs: ComponentRef<ColorMarkerComponent>[];
  markerDetailsRef?: ComponentRef<MarkerDetailsComponent>;
  popupRef: ComponentRef<AddMarkerPopupComponent> | null;
}

interface LabelState {
  labels: Label[];
  newLabel: CreateLabelDto;
}

class MapData {
  mapName?: string
  mapID?: number
}

class MapError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'MapError';
  }
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
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapComponent implements OnInit, OnDestroy, AfterViewInit, OnChanges {
  /** Container reference for dynamic marker components */
  @ViewChild('markerHost', { read: ViewContainerRef }) private markerHost!: ViewContainerRef;

  /** Container reference for marker details component */
  @ViewChild('markerDetailsContainer', { read: ViewContainerRef, static: true })
  private markerDetailsContainer!: ViewContainerRef;

  /** Container reference for map details component */
  @ViewChild('mapDetailsContainer', { read: ViewContainerRef, static: true })
  private mapDetailsContainer!: ViewContainerRef;

  /** References to color marker components */
  private colorMarkerRefs: ComponentRef<ColorMarkerComponent>[] = [];

  /** Interval ID for map change listener */
  private intervalId?: number;

  /** Main Leaflet map instance */
  map!: L.Map;
  mapName: string = '';
  private originalMapName: string = '';
  layer: any;
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

  private mapDetailsRef?: ComponentRef<MapDetailsPanelComponent>;

  private _mapID: number = 1;
  @Input()
  get mapID(): number {
    return this._mapID;
  }

  set mapID(value: number) {
    this._mapID = value;
  }

  private mapState: MapState = {
    mapID: 1,
    mapName: '',
    originalMapName: '',
    currentMap: null,
    selectedMarker: null,
    selectedLabelFilter: null,
    showDetailsPanel: false,
    showLabelModal: false
  };

  private markerState: MarkerState = {
    markers: [],
    colorMarkerRefs: [],
    markerDetailsRef: undefined,
    popupRef: null
  };

  private labelState: LabelState = {
    labels: [],
    newLabel: {
      idMap: this.mapID,
      name: '',
      color: '#3a5a40'
    }
  };

  private destroy$ = new Subject<void>();

  constructor(
    private viewContainerRef: ViewContainerRef,
    private markerManager: MarkerManagerService,
    private labelManager: LabelManagerService,
    private mapInitialization: MapInitializationService,
    private sharingService: SharingService,
    private route: ActivatedRoute
  ) {}

  /**
   * Initializes the component and loads initial data
   */
  ngOnInit(): void {
    if (!this._mapID) {
      this.route.params
        .pipe(takeUntil(this.destroy$))
        .subscribe(params => {
          const routeMapId = Number(params['mapId']);
          if (routeMapId) {
            this._mapID = routeMapId;
            this.loadMapData();
          }
        });
    } else {
      this.loadMapData();
    }
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

  createLabel(): void {
    if (!this.newLabel.name.trim()) {
      alert('Label name is required');
      return;
    }

    this.labelManager.createLabel(this.newLabel)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.closeLabelModal();
        },
        error: (err) => {
          console.error('Error saving label:', err);
          alert('An error occurred while saving the label');
        }
      });
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

    this.markerManager.createMarker(markerData, this.map, this.markerHost)
      .pipe(takeUntil(this.destroy$))
      .subscribe();
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

    this.markerManager.updateMarker(markerData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
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

    this.markerManager.deleteMarker({...marker, markerID: markerId})
      .pipe(takeUntil(this.destroy$))
      .subscribe({
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

    this.markerManager.loadMarkers(this._mapID)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
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

          this.mapInitialization.updateMapView(this.map, lat, lon);

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
    this.labelManager.loadLabels(this._mapID)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (labels) => {
          if (Array.isArray(labels)) {
            this.labels = labels;
            console.log('Labels loaded:', this.labels); // Debugging log
          } else {
            console.error('Invalid label data format:', labels);
          }
        },
        error: (error) => {
          console.error('Error loading labels:', error);
          alert('Failed to load labels. Please try again.');
        }
      });
  }

  /**
   * Deletes a label and refreshes related data
   * @param labelID ID of label to delete
   */
  deleteLabel(labelID: number): void {
    this.labelManager.deleteLabel(labelID, this._mapID)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('Label deleted successfully');
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
    this.labelManager.updateLabel(labelData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedLabel) => {
          console.log('Label updated successfully');
          this.loadLabels();
          this.refreshMarkers();
        },
        error: (err) => {
          console.error('Error updating label:', err);
          alert('Failed to update label');
        }
      });
  }

  /**
   * Initializes the Leaflet map with default settings
   */
  private initializeMap(): void {
    this.mapInitialization.initializeMap('map')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (map) => {
          this.map = map;
          this.map.on('contextmenu', (event: L.LeafletMouseEvent) => {
            this.markerManager.showPopup(event.latlng, this.viewContainerRef, this.map);
          });
        },
        error: (error) => console.error('Error initializing map:', error)
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
    this.mapInitialization.updateMapView(this.map, location.lat, location.lon);

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

  private handleError(error: unknown, context: string): void {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error(`Error in ${context}:`, error);

    if (error instanceof MapError) {
      // Handle specific map errors
      switch (error.code) {
        case 'MAP_NOT_FOUND':
          this.handleMapNotFound();
          break;
        case 'MARKER_CREATION_FAILED':
          this.handleMarkerCreationFailed();
          break;
        default:
          this.handleGenericError(errorMessage);
      }
    } else {
      this.handleGenericError(errorMessage);
    }
  }

  private handleMapNotFound(): void {
    this.mapName = 'Unnamed Map';
    this.originalMapName = 'Unnamed Map';
    this.currentMap = {
      mapID: this._mapID,
      idUser: this.currentUserId,
      mapName: 'Unnamed Map',
      mapPreviewPath: '',
      description: '',
      sharedWith: []
    };
  }

  private handleMarkerCreationFailed(): void {
    alert('Failed to create marker. Please try again.');
  }

  private handleGenericError(message: string): void {
    alert(`An error occurred: ${message}`);
  }

  private loadMapData(): void {
    this.mapInitialization.loadMapData(this._mapID)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (mapData) => {
          this.currentMap = mapData;
          this.mapName = mapData.mapName.trim();
          this.originalMapName = this.mapName;
        },
        error: (error) => console.error('Error loading map data:', error)
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mapID'] && !changes['mapID'].firstChange) {
      this.loadMapData();
      this.loadMarkers();
      this.loadLabels();
    }

    this.Lmarkers.forEach(marker => {
      this.applyLabelFilter(marker);
    });
  }

  /**
   * Handles cleanup when component is destroyed
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

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
    this.detailsPanelToggle.emit();
    console.log('Details panel visibility toggled:', this.showDetailsPanel);

    if (this.showDetailsPanel) {
      this.showMapDetails();
    } else {
      this.clearMapDetails();
    }
  }

  onShareMap(shareData: {email: string, permission: string}): void {
    const permission = (shareData.permission === 'write' || shareData.permission === 'owner')
      ? shareData.permission
      : 'read';

    const sharedUser: SharedUser = {
      userID: 0,
      userName: shareData.email.split('@')[0],
      userEmail: shareData.email,
      permission: permission
    };

    this.sharingService.addUserToMap(this.currentMap?.mapID || 0, sharedUser)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (this.currentMap) {
            this.currentMap.sharedWith.push(response);
          }
        },
        error: (err) => console.error('Error sharing map:', err)
      });
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

  toggleMapDetails(): void {
    if (this.mapDetailsRef) {
      this.clearMapDetails();
    } else {
      this.showMapDetails();
    }
  }

  private showMapDetails(): void {
    if (!this.currentMap) {
      console.error('No map data available');
      return;
    }

    try {
      console.log('Creating map details panel with map:', JSON.stringify(this.currentMap, null, 2));
      console.log('Shared users in current map:', JSON.stringify(this.currentMap.sharedWith, null, 2));

      this.mapDetailsRef = this.mapDetailsContainer.createComponent(MapDetailsPanelComponent);
      // Create a deep copy of the map data to ensure sharedWith array is preserved
      const mapCopy = JSON.parse(JSON.stringify(this.currentMap));
      this.mapDetailsRef.instance.map = mapCopy;
      console.log('Map data passed to details panel:', JSON.stringify(this.mapDetailsRef.instance.map, null, 2));
      console.log('Shared users in details panel:', JSON.stringify(this.mapDetailsRef.instance.map?.sharedWith, null, 2));

      this.mapDetailsRef.instance.isVisible = true;

      this.mapDetailsRef.instance.closePanel.subscribe(() => this.clearMapDetails());
      this.mapDetailsRef.instance.shareMap.subscribe((data) => this.onShareMap(data));
      this.mapDetailsRef.instance.removeSharedUser.subscribe((userId) => this.onRemoveSharedUser(userId));
      this.mapDetailsRef.instance.updateMapDescription.subscribe((description) => this.onUpdateMapDescription(description));

      this.mapDetailsRef.changeDetectorRef.detectChanges();

      const container = document.querySelector('.map-details-container');
      if (container) {
        container.classList.add('visible');
      }
    } catch (error) {
      console.error('Error creating map details:', error);
      this.clearMapDetails();
    }
  }

  private clearMapDetails(): void {
    const container = document.querySelector('.map-details-container');
    if (container) {
      container.classList.remove('visible');
    }

    if (this.mapDetailsRef) {
      this.mapDetailsRef.destroy();
      this.mapDetailsRef = undefined;
    }
  }
}
