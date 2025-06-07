import {Component, ViewEncapsulation} from '@angular/core';
import {MapComponent} from '../../components/map/map.component';
import {SidebarComponent} from '../../components/sidebar/sidebar.component';
import {MapDetailsPanelComponent} from '../../components/map-details-panel/map-details-panel.component';
import {AppMap, SharedUser} from '../../models/appMap';
import * as L from 'leaflet';
import {CommonModule} from '@angular/common';
import {Label} from '../../models/label'; // Import the label model
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'app-map-page',
  standalone: true,
  imports: [MapComponent, SidebarComponent, CommonModule, MapDetailsPanelComponent],
  templateUrl: './map-page.component.html',
  styleUrls: ['./map-page.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class MapPageComponent {
  isDetailsPanelOpen = false;
  currentMap: AppMap | null = null;
  mapID: number = 1;

  constructor(private route: ActivatedRoute) {
    this.route.params.subscribe(params => {
      const routeMapId = Number(params['mapId']);
      if (routeMapId) {
        this.mapID = routeMapId;
      }
    });
  }
}
