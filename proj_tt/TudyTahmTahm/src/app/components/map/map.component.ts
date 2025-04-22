import {Component, OnInit, OnDestroy, ViewContainerRef, ComponentRef, ViewEncapsulation, Output, EventEmitter, AfterViewInit} from '@angular/core';
import * as L from 'leaflet';
import { AddMarkerPopupComponent } from './add-marker-popup/add-marker-popup.component';
import {MarkerDetailsComponent} from '../marker-details/marker-details.component';
import {Marker} from '../../models/marker';
import {MarkerService} from '../../services/marker.service';

@Component({
  selector: 'app-map',
  standalone: true,
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  imports: [
    MarkerDetailsComponent
  ],
  encapsulation: ViewEncapsulation.None
})


export class MapComponent implements OnInit, OnDestroy, AfterViewInit {
  map: any;
  layer: any;
  private markerDetailsRef?: ComponentRef<MarkerDetailsComponent>;

  private lMarkers: L.Marker[] = []; // Leaflet markers
  private myMarkers: Marker[] = []; // Our custom markers

  private popupRef: ComponentRef<AddMarkerPopupComponent> | null = null;
  @Output() markerClicked = new EventEmitter<L.Marker>(); // EventEmitter for marker click
  selectedMarker: L.Marker | null = null; // Store the selected marker

  constructor(private viewContainerRef: ViewContainerRef, private markerService: MarkerService) {}

  ngOnInit(): void {
    // Přesun inicializace mapy do ngAfterViewInit
  }

  ngAfterViewInit(): void {
    this.initializeMap(); // Inicializace mapy po vykreslení DOM

    this.markerService.findByMapId(this.map.id).subscribe(result => this.myMarkers = result);
    const lMarkers = this.convertMarkersToLeafletMarkers(this.myMarkers);

  }

  private initializeMap(): void {
    this.map = L.map('map').setView([49.8022514, 15.6252330], 8);
    this.layer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    this.map.on('contextmenu', (event: L.LeafletMouseEvent) => {
      this.showPopup(event.latlng);
    });
  }

  private convertMarkersToLeafletMarkers(markers: Marker[]): L.Marker[] {
    return markers.map(marker => {
      const leafletMarker: L.Marker = L.marker([marker.latitude, marker.longitude]);
      return leafletMarker;
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
    this.lMarkers.push(marker);

    marker.on('click', () => {
      this.onMarkerClick(marker); // Přesměrování na novou metodu
    });

    console.log('Marker přidán:', marker);
    console.log('Aktuální seznam markerů:', this.lMarkers);
  }

  onMarkerClick(marker: L.Marker): void {
    this.selectedMarker = marker;

    if (!this.markerDetailsRef) {
      // Pokud ještě komponentu nemáš, vytvoř ji
      this.viewContainerRef.clear();
      this.markerDetailsRef = this.viewContainerRef.createComponent(MarkerDetailsComponent);
    }

    // Nastavení markeru
    this.markerDetailsRef.instance.marker = marker;

    // Zajištění viditelnosti
    this.markerDetailsRef.instance.show();
  }


  onCancel(): void {
    this.selectedMarker = null; // Reset vybraného markeru
  }

  onSave(): void {
    this.selectedMarker = null; // Reset vybraného markeru
  }

  onDeleteMarker(): void {
    this.onCancel(); // Reuse cancel logic to delete marker
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
