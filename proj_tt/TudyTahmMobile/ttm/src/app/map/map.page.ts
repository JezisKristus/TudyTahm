import { Component, AfterViewInit, OnDestroy  } from '@angular/core';
import * as L from 'leaflet';
import { Geolocation } from '@capacitor/geolocation';
import { IonHeader, IonContent, IonFab, IonFabButton, IonToggle } from '@ionic/angular/standalone';
import { SearchBarComponent } from '../search-bar/search-bar.component';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { add, locateSharp, locationSharp } from 'ionicons/icons';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { User } from '../models/user';
import { AuthenticationService } from '../services/authentication.service';
import { environment } from '../environments/environment.development';

@Component({
  selector: 'app-map',
  templateUrl: './map.page.html',
  styleUrls: ['./map.page.scss'],
  standalone: true,
  imports: [IonHeader, IonContent, CommonModule, FormsModule, IonicModule, SearchBarComponent, IonFab, IonFabButton, IonToggle],
})
export class MapPage implements AfterViewInit, OnDestroy {
  public map!: L.Map;
  private userMarker!: L.Marker;
  private watchId: string | null = null;
  private breadcrumbEnabled = false;
  private breadcrumbPolyline!: L.Polyline;
  private breadcrumbPath: L.LatLng[] = [];
  currentUser: User | null = null;

  ngOnInit(): void {
    this.currentUser = this.getCurrentUser();
  }

  private userIconUrl: string = this.getProfilePictureUrl(this.currentUser?.userIconPath);

  constructor(private http: HttpClient, private authService: AuthenticationService) {
    addIcons({ locateSharp });
  }

  ngAfterViewInit(): void {
    this.initMap();
    this.startTracking();
  }

  getProfilePictureUrl(path: string | undefined): string {
    if (!path) return '';

    // Remove the 'L\' prefix if it exists and encode the path
    const cleanPath = path.startsWith('L\\') ? path.substring(2) : path;
    return `${environment.apiUrl}/Image/${encodeURIComponent(cleanPath)}`;
  }

  

  getCurrentUser(): User | null {
    return this.authService.getUser();
  }

  ngOnDestroy(): void {
    if (this.watchId) {
      Geolocation.clearWatch({ id: this.watchId });
    }
  }

  private initMap(): void {
    this.map = L.map('map', {
      center: [50.0755, 14.4378], // Prague
      zoom: 13
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    setTimeout(() => this.map.invalidateSize(), 0);

    this.breadcrumbPolyline = L.polyline([], {
      color: 'blue',
      weight: 4,
      opacity: 0.8,
      lineJoin: 'round',
      lineCap: 'round'
    }).addTo(this.map);
  }

  public async centerMapOnUser(): Promise<void> {
    try {
      const position = await Geolocation.getCurrentPosition();
      const { latitude, longitude } = position.coords;
      this.map.setView([latitude, longitude], 15);
    } catch (err) {
      console.error('Failed to get current location:', err);
    }
  }

  private async startTracking(): Promise<void> {

    try {
      this.watchId = await Geolocation.watchPosition({}, (position, err) => {
        if (err) {
          console.error('Error watching position:', err);
          return;
        }

        if (position) {
          const { latitude, longitude } = position.coords;
          const currentPosition = new L.LatLng(latitude, longitude);

          if (this.userMarker) {
            this.userMarker.setLatLng([latitude, longitude]);
          } else {
            this.userMarker = L.marker([latitude, longitude], {
              icon: L.icon({
                iconUrl: this.userIconUrl,
                iconSize: [32, 32],
                iconAnchor: [16, 32],
                popupAnchor: [0, -32]
              })
            }).addTo(this.map).bindPopup("You are here").openPopup();
          }

          if (this.breadcrumbEnabled) {
            this.breadcrumbPath.push(currentPosition);
            this.breadcrumbPolyline.setLatLngs(this.breadcrumbPath);
            console.log('Breadcrumbs toggled:', this.breadcrumbPath);
          }
        }
      });
    } catch (error) {
      console.error('Error starting tracking:', error);
    }
  }

  public toggleBreadcrumbs(): void {
    console.log('Breadcrumbs toggled:');
    this.breadcrumbEnabled = !this.breadcrumbEnabled;

    if (!this.breadcrumbEnabled) {
      this.breadcrumbPath = [];
      this.breadcrumbPolyline.setLatLngs([]);
    }
  }
}
