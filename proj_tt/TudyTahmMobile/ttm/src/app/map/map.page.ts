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
  private userIconUrl: string = 'assets/default_user.png'; // fallback or default icon

  constructor(private http: HttpClient) {
    addIcons({ locateSharp });
  }

  ngAfterViewInit(): void {
    this.initMap();
    this.startTracking();
  }

  ngOnDestroy(): void {
    if (this.watchId) {
      Geolocation.clearWatch({ id: this.watchId });
    }
  }

  private async fetchProfilePictureUrl(userId: string): Promise<string> {
    try {
      const response = await firstValueFrom(
        this.http.get(`http://localhost:5010/api/Authentication/pfpPath/${userId}`, {
          responseType: 'text'
        })
      );

      const cleanPath = response.startsWith('L\\') ? response.substring(2) : response;
      return `http://localhost:5010/api/Image/${encodeURIComponent(cleanPath)}`;
    } catch (error) {
      console.error('Error fetching profile picture path:', error);
      return 'assets/default_user.png'; // fallback
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
    // Replace this with your actual user ID fetching logic
    const userId = 'YOUR_USER_ID';

    // Fetch user icon URL once before tracking begins
    this.userIconUrl = await this.fetchProfilePictureUrl(userId);

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
