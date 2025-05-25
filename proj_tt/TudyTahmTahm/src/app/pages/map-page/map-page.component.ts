import {Component, ViewEncapsulation} from '@angular/core';
import {MapComponent} from '../../components/map/map.component';
import {SidebarComponent} from '../../components/sidebar/sidebar.component';
import {MapDetailsPanelComponent} from '../../components/map-details-panel/map-details-panel.component';
import {AppMap, SharedUser} from '../../models/appMap';
import * as L from 'leaflet';
import {NgForOf} from '@angular/common';
import {Label} from '../../models/label'; // Import the label model

@Component({
  selector: 'app-map-page',
  standalone: true,
  imports: [MapComponent, SidebarComponent, NgForOf, MapDetailsPanelComponent],
  templateUrl: './map-page.component.html',
  styleUrls: ['./map-page.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class MapPageComponent {
  isDetailsPanelOpen = false;
  currentMap: AppMap | null = null;

  constructor() {
    // TODO: Replace with actual map data from service
    this.currentMap = {
      mapID: 1,
      idUser: 1,
      isCustom: true,
      mapName: 'My Map',
      mapPath: '/maps/my-map',
      mapPreviewPath: '/assets/previews/my-map.png',
      description: 'A beautiful map of my journey',
      sharedWith: [
        { userId: 2, userName: 'John Doe', accessLevel: 'read' }
      ]
    };
  }

  toggleDetailsPanel() {
    this.isDetailsPanelOpen = !this.isDetailsPanelOpen;
  }

  closeDetailsPanel() {
    this.isDetailsPanelOpen = false;
  }

  onShare(data: { userId: string; accessLevel: string }) {
    // TODO: Implement sharing functionality
    console.log('Sharing map with:', data);
  }

  onRemoveUser(user: SharedUser) {
    // TODO: Implement remove user functionality
    console.log('Removing user:', user);
  }

  onUpdateMap(updates: { name?: string; description?: string }) {
    if (!this.currentMap) return;

    if (updates.name) {
      this.currentMap.mapName = updates.name;
    }
    if (updates.description) {
      this.currentMap.description = updates.description;
    }

    // TODO: Call API to update map
    console.log('Updating map:', this.currentMap);
  }
}
