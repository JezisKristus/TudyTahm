import { Component, AfterViewInit, OnDestroy  } from '@angular/core';
import * as L from 'leaflet';
import { Geolocation } from '@capacitor/geolocation';
import { IonHeader, IonContent, IonFab, IonFabButton, IonToggle } from '@ionic/angular/standalone';
import { SearchBarComponent } from '../search-bar/search-bar.component';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { add, locateSharp, locationSharp } from 'ionicons/icons'

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
  constructor() {
    addIcons({ locateSharp })
  }
  ngAfterViewInit(): void {
    this.initMap();
    this.startTracking();
  }

  ngOnDestroy(): void {
    // Stop GPS
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

    //breadcrumbs polyline
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

          // Map update
          //this.map.setView([latitude, longitude], 15);

          // Move user
          if (this.userMarker) {
            this.userMarker.setLatLng([latitude, longitude]);
          } else {
            this.userMarker = L.marker([latitude, longitude], {
              icon: L.icon({
                iconUrl: 'assets/user_location.png',
                iconSize: [32, 32],
                iconAnchor: [16, 32],
                popupAnchor: [0, -32]
              })
            }).addTo(this.map).bindPopup("You are here").openPopup();
          }

          // create trail (breadcrumb)
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
      // Clear trail
      this.breadcrumbPath = [];
      this.breadcrumbPolyline.setLatLngs([]);
    }
  }
}