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
import { forkJoin } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

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
  journeys: Journey[] = [];
  loading = true;
  error: string | null = null;
  successMessage: string | null = null;
  canEdit = false;
  currentMap: AppMap | null = null;
  isMultiView = false;
  selectedJourneys: Set<number> = new Set();

  mapOptions: L.MapOptions = {} as L.MapOptions;
  mapLayers: L.Layer[] = [];
  mapInstance: L.Map | null = null;

  points: { lat: number; lng: number; visible: boolean; pointID?: number }[] = [];
  journeyPoints: Map<number, { lat: number; lng: number; visible: boolean; pointID?: number }[]> = new Map();
  
  // Color mapping for different journeys
  private colorMap = new Map<number, string>();
  private readonly colors = [
    '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', 
    '#00FFFF', '#FFA500', '#800080', '#008000', '#800000'
  ];

  // Dialog state
  showRemoveDialog = false;
  pointToRemove: { lat: number; lng: number; visible: boolean; pointID?: number } | null = null;
  removeIndex: number | null = null;
  removeConfirmed = false;
  dialogPosition: { x: number; y: number } | null = null;
  currentPopup: L.Popup | null = null;

  showMergeDialog = false;
  newJourneyName = '';
  newJourneyDescription = '';
  orderedJourneys: Journey[] = [];

  constructor(
    private journeyService: JourneyService,
    private mapService: MapService,
    private authService: AuthenticationService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.error = null;

    // Check if we're in multi-view mode
    this.route.queryParams.subscribe(params => {
      this.isMultiView = params['multi'] === 'true';
      if (this.isMultiView) {
        this.loadAllJourneys();
      } else {
        this.loadSingleJourney();
      }
    });

    // Set map default
    this.mapOptions = {
      center: L.latLng(50.1192600, 14.4918975),
      zoom: 13,
      layers: [
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        })
      ]
    };
  }

  private loadSingleJourney(): void {
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
        this.loadMapAndCheckPermissions();
        if (this.journey.journeyID) {
          this.loadJourneyPoints(this.journey);
        } else {
          this.loading = false;
        }
      }
    } catch (e) {
      this.error = 'Failed to load journey data.';
      this.loading = false;
    }
  }

  private loadAllJourneys(): void {
    const userID = this.authService.getCurrentUserID();
    if (!userID) {
      this.error = 'User not logged in';
      this.loading = false;
      return;
    }

    this.journeyService.getJourneyByUserID(userID).subscribe({
      next: (journeys) => {
        this.journeys = journeys;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load journeys:', err);
        this.error = 'Failed to load journeys';
        this.loading = false;
      }
    });
  }

  toggleJourney(journey: Journey): void {
    if (this.selectedJourneys.has(journey.journeyID)) {
      this.selectedJourneys.delete(journey.journeyID);
      this.journeyPoints.delete(journey.journeyID);
    } else {
      this.selectedJourneys.add(journey.journeyID);
      this.loadJourneyPoints(journey);
    }
    this.updateMap();
  }

  private loadJourneyPoints(journey: Journey): void {
    if (!journey.journeyID) {
      this.loading = false;
      return;
    }

    this.journeyService.getPointsByJourneyID(journey.journeyID).subscribe({
      next: (points) => {
        const processedPoints = points.map((p: any) => ({
          lat: p.latitude || p.lat,
          lng: p.longitude || p.lng,
          visible: true,
          pointID: p.pointID
        })).filter((p: any) => p.lat && p.lng);

        if (this.isMultiView) {
          this.journeyPoints.set(journey.journeyID!, processedPoints);
        } else {
          this.points = processedPoints;
        }
        this.updateMap();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading points for journey:', err);
        this.error = `Failed to load points for journey ${journey.name}`;
        this.loading = false;
      }
    });
  }

  public getJourneyColor(journeyID: number): string {
    if (!this.colorMap.has(journeyID)) {
      const colorIndex = this.colorMap.size % this.colors.length;
      this.colorMap.set(journeyID, this.colors[colorIndex]);
    }
    return this.colorMap.get(journeyID)!;
  }

  private updateMap(): void {
    if (!this.mapInstance) return;

    // Clear existing layers
    this.mapLayers = [];

    if (this.isMultiView) {
      // Add layers for each selected journey
      this.selectedJourneys.forEach(journeyID => {
        const points = this.journeyPoints.get(journeyID);
        if (!points || points.length < 2) return;

        const color = this.getJourneyColor(journeyID);
        const latlngs = points.map(p => L.latLng(p.lat, p.lng));

        // Add polyline
        this.mapLayers.push(
          L.polyline(latlngs, { 
            color: color, 
            weight: 4,
            opacity: 0.7
          })
        );

        // Add markers
        points.forEach(p => {
          this.mapLayers.push(
            L.circleMarker([p.lat, p.lng], {
              radius: 5,
              color: color,
              fillColor: '#fff',
              fillOpacity: 1,
              weight: 2
            })
          );
        });
      });

      // Fit bounds to show all selected journeys
      const allPoints = Array.from(this.journeyPoints.values())
        .flat()
        .map(p => L.latLng(p.lat, p.lng));

      if (allPoints.length > 0) {
        const bounds = L.latLngBounds(allPoints);
        this.mapInstance.fitBounds(bounds, { padding: [30, 30] });
      }
    } else {
      // Single journey view
      if (this.points.length < 2) {
        this.distance = 0;
        return;
      }
      const latlngs = this.points.map(p => L.latLng(p.lat, p.lng));
      const markerLayers = this.points.map((p, idx) => {
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
  }

  private loadMapAndCheckPermissions() {
    if (!this.journey?.idMap) {
      this.loading = false;
      return;
    }

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
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading map permissions:', err);
        this.error = 'Failed to load map permissions';
        this.loading = false;
      }
    });
  }

  calculateDistance(points: L.LatLng[]): number {
    let dist = 0;
    for (let i = 1; i < points.length; i++) {
      dist += points[i - 1].distanceTo(points[i]);
    }
    return parseFloat((dist / 1000).toFixed(2)); // km
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
          this.updateMap();
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

  openMergeDialog(): void {
    if (this.selectedJourneys.size !== 2) return;
    this.showMergeDialog = true;
    this.newJourneyName = '';
    this.newJourneyDescription = '';
    this.orderedJourneys = this.getSelectedJourneys();
  }

  closeMergeDialog(): void {
    this.showMergeDialog = false;
    this.newJourneyName = '';
    this.newJourneyDescription = '';
  }

  getSelectedJourneys(): Journey[] {
    return this.journeys.filter(journey => this.selectedJourneys.has(journey.journeyID));
  }

  moveJourneyUp(index: number): void {
    if (index > 0) {
      const temp = this.orderedJourneys[index];
      this.orderedJourneys[index] = this.orderedJourneys[index - 1];
      this.orderedJourneys[index - 1] = temp;
    }
  }

  moveJourneyDown(index: number): void {
    if (index < this.orderedJourneys.length - 1) {
      const temp = this.orderedJourneys[index];
      this.orderedJourneys[index] = this.orderedJourneys[index + 1];
      this.orderedJourneys[index + 1] = temp;
    }
  }

  confirmMerge(): void {
    if (!this.newJourneyName || this.orderedJourneys.length !== 2) return;

    const userId = this.authService.getCurrentUserID();
    if (!userId) {
      this.error = 'User not logged in';
      return;
    }

    const mergeData = {
      name: this.newJourneyName,
      description: this.newJourneyDescription,
      idMap: this.orderedJourneys[0].idMap,
      journeyIDs: this.orderedJourneys.map(j => j.journeyID)
    };

    this.journeyService.mergeJourneys(mergeData).subscribe({
      next: (createdJourney) => {
        console.log('Journeys merged successfully:', createdJourney);
        this.successMessage = 'Journeys merged successfully!';
        this.closeMergeDialog();
        this.selectedJourneys.clear();
        this.journeyPoints.clear();
        this.updateMap();
        
        // Navigate to the new journey
        sessionStorage.setItem('Journey', JSON.stringify(createdJourney));
        sessionStorage.setItem('Journey.journeyID', createdJourney.journeyID.toString());
        this.router.navigate(['/journey', createdJourney.journeyID]);
      },
      error: (err) => {
        console.error('Error merging journeys:', err);
        this.error = 'Failed to merge journeys. Please try again.';
        this.closeMergeDialog();
      }
    });
  }
}
