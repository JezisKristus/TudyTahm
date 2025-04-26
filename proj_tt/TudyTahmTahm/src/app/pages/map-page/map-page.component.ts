import {Component, ViewEncapsulation} from '@angular/core';
import {MapComponent} from '../../components/map/map.component';
import {SidebarComponent} from '../../components/sidebar/sidebar.component';
import * as L from 'leaflet';

@Component({
  selector: 'app-map-page',
  standalone: true,
  imports: [MapComponent, SidebarComponent],
  templateUrl: './map-page.component.html',
  styleUrl: './map-page.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class MapPageComponent {
  selectedMarker: L.Marker | null = null; // Store the selected marker

  onMarkerClicked(marker: L.Marker<any>): void {
    this.selectedMarker = marker;
    console.log('Marker clicked:', marker);
  }
}
