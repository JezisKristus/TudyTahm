import {Component, OnInit, OnDestroy, ViewContainerRef, ComponentRef, ViewEncapsulation, Output, EventEmitter, AfterViewInit} from '@angular/core';
import * as L from 'leaflet';
import 'leaflet-search';
import { AddMarkerPopupComponent } from './add-marker-popup/add-marker-popup.component';
import {MarkerDetailsComponent} from '../marker-details/marker-details.component';
import {AppMarker} from '../../models/appMarker';
import {MarkerService} from '../../services/marker.service';
import {GPSPoint} from '../../models/gps-point';
import {NgIf} from '@angular/common';

// Rozšíření ExtendedMarker o vlastnosti AppMarker
interface ExtendedMarker extends L.Marker, AppMarker {
  markerData: AppMarker;
  markerID: number;
}

@Component({
  selector: 'app-map',
  standalone: true,
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  imports: [
    MarkerDetailsComponent,
    NgIf
  ],
  encapsulation: ViewEncapsulation.None
})

export class MapComponent implements OnInit, OnDestroy, AfterViewInit {
  map!: L.Map; // Použijte "!" k inicializaci později
  layer: any;
  private markerDetailsRef?: ComponentRef<MarkerDetailsComponent>;

  private Lmarkers: ExtendedMarker[] = []; // Unified marker array
  private myMarkers: AppMarker[] = [];
  private gpsPoints: GPSPoint[] = [];

  private popupRef: ComponentRef<AddMarkerPopupComponent> | null = null;

  @Output() markerClicked = new EventEmitter<L.Marker<any>>();  selectedMarker: ExtendedMarker | null = null ; // Store the selected marker

  constructor(private viewContainerRef: ViewContainerRef, private markerService: MarkerService) {}

  ngOnInit(): void {
    // Přesunuto do ngAfterViewInit
  }

  ngAfterViewInit(): void {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
      console.error('Map container not found!');
      return;
    }

    this.initializeMap(); // Inicializace mapy po vykreslení DOM
    this.loadMarkers(); // Přesun logiky načítání markerů do samostatné metody
  }

  private initializeMap(): void {
    this.map = L.map('map').setView([49.8022514, 15.6252330], 8); // Inicializace mapy
    this.layer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);


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
      IDUser: 6,  // Default user ID
      IDPoint: 0,
      markerName: '',
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
  private addMarkersToMap(markers: AppMarker[]): void {
    markers.forEach(markerData => {
      if (this.isValidLatLng(markerData.latitude, markerData.longitude)) {
        // Use default icon if markerIconPath is empty
        const markerIcon = L.icon({
          iconUrl: markerData.markerIconPath || 'http://localhost:5010/api/Image/default-icon.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41]
        });

        // Vytvoření Leaflet markeru
        const leafletMarker = L.marker(
          [markerData.latitude, markerData.longitude],
          { icon: markerIcon }
        ).addTo(this.map) as ExtendedMarker;

        // Nastavení markerData a ID
        leafletMarker.markerData = markerData;
        leafletMarker.markerID = markerData.markerID;

        this.Lmarkers.push(leafletMarker);

        leafletMarker.on('click', () => {
          this.onMarkerClick(leafletMarker);
        });
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
      this.refreshMarkers(); // Přidání odběru na refreshMarkers
    });

    // Pass the markerData (including id) to the MarkerDetailsComponent
    console.log('Passing marker data to MarkerDetailsComponent:', marker.markerData);
    this.markerDetailsRef.instance.marker = marker.markerData; // Ensure markerData contains the id
    this.markerDetailsRef.instance.show();

  }

  onCancel(): void {
    this.selectedMarker = null; // Reset selected marker
  }

  onSave(markerData?: AppMarker): void {
    if (this.selectedMarker && markerData) {
      // Update icon if needed
      if (markerData.markerIconPath) {
        const icon = L.icon({
          iconUrl: markerData.markerIconPath,
          iconSize: [25, 41],
          iconAnchor: [12, 41]
        });
        this.selectedMarker.setIcon(icon);
      }
    }
    this.selectedMarker = null;
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
    this.markerService.getMarkers().subscribe({
      next: (markers) => {
        this.addMarkersToMap(markers);
      },
      error: (err) => console.error('Error loading markers:', err)
    });
  }

  private refreshMarkers(): void {
    // Odstranění všech markerů z mapy
    this.Lmarkers.forEach(marker => marker.remove());
    this.Lmarkers = [];
    // Znovunačtení markerů
    this.loadMarkers();
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
