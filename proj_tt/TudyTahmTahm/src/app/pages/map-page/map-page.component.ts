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
}
