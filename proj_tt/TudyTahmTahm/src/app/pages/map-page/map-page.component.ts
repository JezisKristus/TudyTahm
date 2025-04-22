import { Component, ViewEncapsulation } from '@angular/core';
import { MapComponent } from '../../components/map/map.component';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { MarkerDetailsComponent } from '../../components/marker-details/marker-details.component';
import * as L from 'leaflet';
import {NgIf} from '@angular/common';

@Component({
  selector: 'app-map-page',
  standalone: true,
  imports: [MapComponent, SidebarComponent, MarkerDetailsComponent, NgIf],
  templateUrl: './map-page.component.html',
  styleUrl: './map-page.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class MapPageComponent {
  selectedMarker: L.Marker | null = null; // Store the selected marker

  onMarkerClicked(marker: L.Marker): void {
    this.selectedMarker = marker; // Update the selected marker
    console.log('Marker clicked:', marker);
  }
}
