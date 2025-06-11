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
import { User } from '../models/user';
import { AuthenticationService } from '../services/authentication.service';
import { environment } from '../environments/environment.development';
import { AlertController } from '@ionic/angular';
import { Journey } from '../models/journey'; // make sure this exists
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
  currentUser: User | null = null;
  selectedJourneyID: number | null = null;

  getCurrentUser(): User | null {
    return this.authService.getUser();
  }

  userIconUrl: string = '';

  ngOnInit(): void {
    this.currentUser = this.getCurrentUser();
    this.userIconUrl = this.getProfilePictureUrl(this.currentUser?.userIconPath);
  }


  constructor(private http: HttpClient, private authService: AuthenticationService, private alertController: AlertController) {
    addIcons({ locateSharp });
  }

  ngAfterViewInit(): void {
    this.initMap();
    this.startTracking();
  }

  getProfilePictureUrl(path: string | undefined): string {
    if (!path) return '';
    const cleanPath = path.startsWith('L\\') ? path.substring(2) : path;
    return `${environment.apiUrl}/Image/${encodeURIComponent(cleanPath)}`;
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

          // Add new breadcrumb point to backend if journey selected
          if (this.selectedJourneyID) {
            this.authService.addPointToJourney(this.selectedJourneyID, {
              Latitude: latitude,
              Longitude: longitude
            }).subscribe({
              next: (pointID) => console.log(`Point ${pointID} added to journey ${this.selectedJourneyID}`),
              error: (error) => console.error('Failed to add point to journey:', error)
            });
          } else {
            console.warn('No journey selected - cannot add breadcrumb points');
          }
        }
      }
    });
  } catch (error) {
    console.error('Error starting tracking:', error);
  }
}

  public async toggleBreadcrumbs(): Promise<void> {
    this.breadcrumbEnabled = !this.breadcrumbEnabled;

    if (this.breadcrumbEnabled) {
      const selectedJourney = await this.selectJourney();
      if (selectedJourney) {
        console.log('Selected journey:', selectedJourney);
        // Optionally do something with the selected journey
        this.breadcrumbPath = []; // Reset path
      } else {
        this.breadcrumbEnabled = false;
      }
    } else {
      this.breadcrumbPath = [];
      this.breadcrumbPolyline.setLatLngs([]);
    }
  }



  private async selectJourney(): Promise<Journey | null> {
    console.log('selecthjdnfjsdfbjhsdf')
    const user = this.authService.getUser();
    if (!user) return null;

    const journeys = await this.authService.getJourneysByUserId(user.userID);
    const unwrapJourney = await firstValueFrom(journeys)
    if (!unwrapJourney.length) {
      alert('No journeys found for your account.');
      return null;
    }
    console.log('thing')
    const MyAlert = await this.alertController.create({
      header: 'Select a Journey',
      inputs: unwrapJourney.map((j, i) => ({
        name: `journey${i}`,
        type: 'radio',
        label: j.name || `Journey ${j.journeyID}`,
        value: j,
      })),
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Select',
          handler: (selected: Journey) => {
            return selected;
          },
        },
      ],
    });
    console.log('idk')
    await MyAlert.present();
    const result = await MyAlert.onDidDismiss();
    return result.role === 'cancel' ? null : result.data?.values;
  }
}
