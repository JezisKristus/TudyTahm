import {Component, ViewEncapsulation} from '@angular/core';
import {MapComponent} from '../../components/map/map.component';
import {SidebarComponent} from '../../components/sidebar/sidebar.component';
import * as L from 'leaflet';
import {NgForOf} from '@angular/common';
import {Label} from '../../models/label'; // Import the label model

@Component({
  selector: 'app-map-page',
  standalone: true,
  imports: [MapComponent, SidebarComponent, NgForOf],
  templateUrl: './map-page.component.html',
  styleUrl: './map-page.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class MapPageComponent {
  selectedMarker: L.Marker | null = null; // Store the selected marker
  selectedLabelFilter: number | null = null; // Store the selected label filter
  labels!: Label[];

  onMarkerClicked(marker: L.Marker<any>): void {
    this.selectedMarker = marker;
    console.log('Marker clicked:', marker);
  }

  onLabelFilterChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement; // Cast EventTarget to HTMLSelectElement
    const labelID = selectElement.value ? parseInt(selectElement.value, 10) : null;
    this.selectedLabelFilter = labelID;
    console.log('Label filter changed:', labelID);
  }

}
