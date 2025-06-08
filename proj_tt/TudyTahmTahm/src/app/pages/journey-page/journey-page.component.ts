import {Component, OnInit} from '@angular/core';
import * as L from 'leaflet';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {LeafletModule} from '@bluehalo/ngx-leaflet';
import { JourneyService } from '../../services/journey.service';
import { Journey } from '../../models/journey';
import { ActivatedRoute, Router } from '@angular/router';
import {SidebarComponent} from '../../components/sidebar/sidebar.component';
import { MapService } from '../../services/map.service';
import { AuthenticationService } from '../../services/authentication.service';
import { AppMap } from '../../models/appMap';

@Component({
  selector: 'app-journey-page',
  templateUrl: './journey-page.component.html',
  styleUrls: ['./journey-page.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LeafletModule,
    RouterLink,
    SidebarComponent,
  ]
})
export class JourneyPageComponent implements OnInit {
  journeyName = '';
  journeyDescription = '';
  distance = 0;
  journey: Journey | null = null;
  loading = true;
  error: string | null = null;
  successMessage: string | null = null;
  canEdit = false;
  currentMap: AppMap | null = null;

  mapOptions: L.MapOptions = {} as L.MapOptions;
  mapLayers: L.Layer[] = [];
  mapInstance: L.Map | null = null;

  points: { lat: number; lng: number; visible: boolean; pointID?: number }[] = [];

  // Dialog state
  showRemoveDialog = false;
  pointToRemove: { lat: number; lng: number; visible: boolean; pointID?: number } | null = null;
  removeIndex: number | null = null;
  removeConfirmed = false;
  dialogPosition: { x: number; y: number } | null = null;
  currentPopup: L.Popup | null = null;

  constructor(
    private journeyService: JourneyService,
    private mapService: MapService,
    private authService: AuthenticationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.error = null;
    // Load journey from sessionStorage
    const journeyStr = sessionStorage.getItem('Journey');
    if (!journeyStr) {
      this.error = 'No journey selected.';
      this.loading = false;
      return;
    }
    try {
      this.journey = JSON.parse(journeyStr);
      if (this.journey) {
        this.journeyName = this.journey.name;
        this.journeyDescription = this.journey.description || '';
        
        // Load map information and check permissions
        this.loadMapAndCheckPermissions();
      }
    } catch (e) {
      this.error = 'Failed to load journey data.';
      this.loading = false;
      return;
    }
    // Set map default
    this.mapOptions = {
      center: L.latLng(50.1192600, 14.4918975),
      zoom: 17,
      layers: [
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        })
      ]
    };
    // Load points for this journey
    if (this.journey && this.journey.journeyID) {
      this.loadJourneyPoints();
    } else {
      console.error('Invalid journey data:', this.journey);
      this.error = 'Invalid journey data: missing journeyID';
      this.loading = false;
    }
  }

  private loadMapAndCheckPermissions() {
    if (!this.journey?.idMap) return;

    this.mapService.getSharedMaps().subscribe({
      next: (maps) => {
        const map = maps.find(m => m.mapID === this.journey?.idMap);
        if (map) {
          this.currentMap = map;
          const currentUserId = this.authService.getCurrentUserID();
          
          // Check if user is owner or has write permission
          this.canEdit = map.idUser === currentUserId || 
                        map.permission === 'write' || 
                        map.permission === 'owner';
        }
      },
      error: (err) => {
        console.error('Error loading map permissions:', err);
        this.error = 'Failed to load map permissions';
      }
    });
  }

  private loadJourneyPoints() {
    console.log('Loading points for journey ID:', this.journey?.journeyID);
    this.journeyService.getPointsByJourneyID(this.journey!.journeyID).subscribe({
      next: (points) => {
        console.log('Received points from API:', points);
        if (!Array.isArray(points)) {
          console.error('Invalid points data received:', points);
          this.error = 'Invalid points data received from server.';
          this.loading = false;
          return;
        }

        // Expecting points to have lat/lng
        this.points = points.map((p: any) => {
          const lat = p.latitude || p.lat;
          const lng = p.longitude || p.lng;
          if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
            console.warn('Invalid coordinates for point:', p);
            return null;
          }
          return {
            lat: lat,
            lng: lng,
            visible: true,
            pointID: p.pointID
          };
        }).filter(p => p !== null);

        console.log('Processed points:', this.points);

        // Center and zoom map to fit all points
        if (this.points.length > 0) {
          const latlngs = this.points.map(p => L.latLng(p.lat, p.lng));
          const bounds = L.latLngBounds(latlngs);
          if (this.mapInstance) {
            this.mapInstance.fitBounds(bounds, {padding: [30, 30]});
          } else {
            this.mapOptions = {
              ...this.mapOptions,
              center: bounds.getCenter(),
              zoom: this.getBoundsZoom(bounds),
            };
          }
        }

        this.updatePath();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading journey points:', err);
        this.error = `Failed to load journey points: ${err.message || 'Unknown error'}`;
        this.loading = false;
      }
    });
  }

  updatePath() {
    const visiblePoints = this.points.filter(p => p.visible);
    if (visiblePoints.length < 2) {
      this.mapLayers = [];
      this.distance = 0;
      return;
    }
    const latlngs = visiblePoints.map(p => L.latLng(p.lat, p.lng));
    // Vytvoř markery s click eventem
    const markerLayers = visiblePoints.map((p, idx) => {
      const marker = L.circleMarker([p.lat, p.lng], { radius: 5, color: 'red', fillColor: '#fff', fillOpacity: 1, weight: 2 });
      marker.on('click', (e: any) => this.openRemoveDialog(p, idx, e));
      return marker;
    });
    this.mapLayers = [
      L.polyline(latlngs, { color: 'red', weight: 4 }),
      ...markerLayers
    ];
    this.distance = this.calculateDistance(latlngs);
  }

  calculateDistance(points: L.LatLng[]): number {
    let dist = 0;
    for (let i = 1; i < points.length; i++) {
      dist += points[i - 1].distanceTo(points[i]);
    }
    return parseFloat((dist / 1000).toFixed(2)); // km
  }

  // Add helper to get zoom to fit bounds
  getBoundsZoom(bounds: L.LatLngBounds): number {
    // Default Leaflet zoom levels: 0 (whole world) to 18+ (street)
    // We'll use a map size of 800x600 for calculation, but leaflet will auto-adjust
    const mapSize = {width: 800, height: 600};
    // Use Leaflet's built-in getBoundsZoom if available, otherwise fallback
    // @ts-ignore
    if (L.CRS.EPSG3857.getBoundsZoom) {
      // @ts-ignore
      return L.CRS.EPSG3857.getBoundsZoom(bounds, false, mapSize);
    }
    // Fallback: use zoom 13 for city, 10 for region, 7 for country
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    const latDiff = Math.abs(ne.lat - sw.lat);
    const lngDiff = Math.abs(ne.lng - sw.lng);
    if (latDiff < 0.01 && lngDiff < 0.01) return 16;
    if (latDiff < 0.1 && lngDiff < 0.1) return 13;
    if (latDiff < 1 && lngDiff < 1) return 10;
    return 7;
  }

  onMapReady(map: L.Map) {
    this.mapInstance = map;
    // Pokud už jsou body načtené, fitni bounds
    if (this.points.length > 0) {
      const latlngs = this.points.map(p => L.latLng(p.lat, p.lng));
      const bounds = L.latLngBounds(latlngs);
      map.fitBounds(bounds, {padding: [30, 30]});
    }
  }

  openRemoveDialog(point: { lat: number; lng: number; visible: boolean; pointID?: number }, idx: number, event?: any) {
    if (!this.canEdit) {
      this.error = 'You do not have permission to edit this journey';
      return;
    }
    // Close any existing popup first
    this.closeRemoveDialog();
    
    this.pointToRemove = point;
    this.removeIndex = idx;
    this.removeConfirmed = false;

    // Create a temporary container for our popup content
    const popupContent = document.createElement('div');
    popupContent.className = 'remove-dialog-popup';
    
    // Create the popup content HTML
    popupContent.innerHTML = `
      <div class="dialog-title">
        <i class="fas fa-exclamation-triangle"></i>
        Remove point?
      </div>
      <div class="dialog-body">
        <p>Do you really want to remove this point from your journey?</p>
        <div class="coords">
          <i class="fas fa-map-marker-alt"></i>
          ${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}
        </div>
      </div>
      <div class="dialog-actions">
        <button class="cancel">
          <i class="fas fa-times"></i> Cancel
        </button>
        <button class="confirm">
          <i class="fas fa-trash-alt"></i> Remove
        </button>
      </div>
    `;

    // Add event listeners to the buttons
    const cancelBtn = popupContent.querySelector('.cancel');
    const confirmBtn = popupContent.querySelector('.confirm');

    if (cancelBtn) {
      cancelBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeRemoveDialog();
      });
    }

    if (confirmBtn) {
      confirmBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.confirmRemovePoint();
      });
    }

    // Create and show the Leaflet popup
    if (this.mapInstance) {
      const popup = L.popup({
        closeButton: false,
        closeOnClick: false,
        autoClose: false,
        className: 'custom-popup-container'
      })
        .setLatLng([point.lat, point.lng])
        .setContent(popupContent)
        .openOn(this.mapInstance);

      // Store the popup reference
      this.currentPopup = popup;

      // Add click outside handler with a small delay to prevent immediate closing
      setTimeout(() => {
        if (this.mapInstance) {
          const clickHandler = (e: L.LeafletMouseEvent) => {
            // Check if the click was outside the popup
            const popupElement = document.querySelector('.leaflet-popup');
            if (popupElement && !popupElement.contains(e.originalEvent.target as Node)) {
              this.closeRemoveDialog();
              this.mapInstance?.off('click', clickHandler);
            }
          };
          this.mapInstance.on('click', clickHandler);
        }
      }, 100);
    }
  }

  closeRemoveDialog() {
    if (this.currentPopup && this.mapInstance) {
      this.mapInstance.closePopup(this.currentPopup);
    }
    this.pointToRemove = null;
    this.removeIndex = null;
    this.removeConfirmed = false;
    this.currentPopup = null;
  }

  confirmRemovePoint() {
    if (!this.journey?.journeyID || !this.pointToRemove?.pointID) {
      this.error = 'Invalid journey or point data';
      this.closeRemoveDialog();
      return;
    }

    this.journeyService.removePointFromJourney(this.journey.journeyID, this.pointToRemove.pointID)
      .subscribe({
        next: () => {
          // Remove the point from the local array
          this.points = this.points.filter((p, idx) => idx !== this.removeIndex);
          this.updatePath();
          this.removeConfirmed = true;
          
          // Show success message
          if (this.currentPopup && this.mapInstance) {
            const successContent = document.createElement('div');
            successContent.className = 'remove-dialog-popup';
            successContent.innerHTML = `
              <div class="dialog-title success">
                <i class="fas fa-check-circle"></i>
                Point removed
              </div>
            `;
            this.currentPopup.setContent(successContent);
            
            // Close after delay
            setTimeout(() => {
              this.closeRemoveDialog();
            }, 1000);
          }
        },
        error: (err) => {
          this.error = 'Failed to remove point from journey';
          console.error('Error removing point:', err);
          this.closeRemoveDialog();
        }
      });
  }

  saveJourney() {
    if (!this.canEdit) {
      this.error = 'You do not have permission to edit this journey';
      return;
    }
    if (!this.journey?.journeyID) {
      this.error = 'Invalid journey data';
      return;
    }

    const updatedJourney: Partial<Journey> = {
      name: this.journeyName,
      description: this.journeyDescription
    };

    this.journeyService.updateJourney(this.journey.journeyID, updatedJourney)
      .subscribe({
        next: (updatedJourney) => {
          // Update the journey in session storage
          this.journey = { ...this.journey!, ...updatedJourney };
          sessionStorage.setItem('Journey', JSON.stringify(this.journey));
          
          // Show success message
          this.error = null;
          this.successMessage = 'Journey saved successfully!';
          
          // Clear success message after 3 seconds
          setTimeout(() => {
            this.successMessage = null;
          }, 3000);
        },
        error: (err) => {
          this.error = 'Failed to save journey changes';
          console.error('Error saving journey:', err);
        }
      });
  }

  discardChanges() {
    // Navigate back to the journey list
    this.router.navigate(['/memories']);
  }
}
