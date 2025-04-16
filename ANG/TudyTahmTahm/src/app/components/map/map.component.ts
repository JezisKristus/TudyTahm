import {Component, OnInit, OnDestroy, ViewContainerRef, ComponentRef, ViewEncapsulation, Output, EventEmitter} from '@angular/core';
import * as L from 'leaflet';
import { AddMarkerPopupComponent } from './add-marker-popup/add-marker-popup.component';
import {MarkerDetailsComponent} from '../marker-details/marker-details.component';
import {NgIf} from '@angular/common';

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
export class MapComponent implements OnInit, OnDestroy {
  map: any;
  layer: any;
  private markers: L.Marker[] = [];
  private popupRef: ComponentRef<AddMarkerPopupComponent> | null = null;
  @Output() markerClicked = new EventEmitter<L.Marker>(); // EventEmitter for marker click
  selectedMarker: L.Marker | null = null; // Store the selected marker

  constructor(private viewContainerRef: ViewContainerRef) {}

  ngOnInit(): void {
    this.map = L.map('map').setView([49.8022514, 15.6252330], 8);
    this.layer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    this.map.on('contextmenu', (event: L.LeafletMouseEvent) => {
      this.showPopup(event.latlng);
    });
  }

  private showPopup(latlng: L.LatLng): void {
    // Zničíme existující popup, pokud existuje
    if (this.popupRef) {
      this.popupRef.destroy();
      this.popupRef = null;
    }
    L.DomUtil.create('div', 'custom-popup-container');
    this.popupRef = this.viewContainerRef.createComponent(AddMarkerPopupComponent);
    this.popupRef.instance.latlng = latlng; // Předání souřadnic do popupu
    this.popupRef.instance.addMarker.subscribe((coordinates: L.LatLng) => {
      this.addMarker(coordinates); // Přidání markeru do mapy
      this.popupRef?.destroy(); // Zavření popupu po přidání markeru
      this.popupRef = null;
    });

    // Připojení popupu k DOM
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

    // Přidáme logiku pro odstranění popupu při kliknutí na mapu
    const removePopup = () => {
      this.map.closePopup(popupOverlay);
      if (this.popupRef) {
        this.popupRef.destroy();
        this.popupRef = null;
      }
      this.map.off('click', removePopup); // Odstraníme listener
    };

    this.map.on('click', removePopup);
  }

  private addMarker(latlng: L.LatLng): void {
    const marker = L.marker(latlng).addTo(this.map);
    this.markers.push(marker);

    // Emit event when marker is clicked
    marker.on('click', () => {
      this.markerClicked.emit(marker); // Emit the clicked marker
      this.selectedMarker = marker; // Store the clicked marker
    });

    console.log('Marker přidán:', marker);
    console.log('Aktuální seznam markerů:', this.markers);
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
    if (this.popupRef) {
      this.popupRef.destroy();
    }
  }
}
