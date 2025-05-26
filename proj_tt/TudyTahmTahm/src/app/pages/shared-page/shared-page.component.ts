import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { AppMap, SharedUser } from '../../models/appMap';
import {AuthenticationService} from '../../services/authentication.service';
import {MapService} from '../../services/map.service';
import {SharingService} from '../../services/sharing.service';

@Component({
  selector: 'app-shared-page',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './shared-page.component.html',
  styleUrls: ['./shared-page.component.scss']
})

export class SharedPageComponent implements OnInit {
  maps: AppMap[] = [];
  filteredMaps: AppMap[] = [];
  sharedUsers: SharedUser[] = [];
  searchQuery = '';
  selectedOwner = '';
  selectedAccessLevel = '';
  selectedCategory = 'all';
  currentUserId:number | null = 1;

  constructor(
    private mapService: MapService,
    private authService: AuthenticationService,
    private shareService: SharingService
  ) {
    this.currentUserId = authService.getCurrentUserID();
  }


  ngOnInit(): void {
    this.loadSharedMaps();
  }

  loadSharedMaps(): void {
    this.mapService.getSharedMaps().subscribe((maps: AppMap[]) => {
      this.maps = maps;

      this.shareService.getSharedUsers().subscribe((users: SharedUser[]) => {
        this.sharedUsers = users;
        this.applyFilters();
      });
    });
  }


  selectCategory(category: string): void {
    this.selectedCategory = category;
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.maps];

    // Apply category filter
    switch (this.selectedCategory) {
      case 'owned':
        filtered = filtered.filter(map => map.idUser === this.currentUserId);
        break;
      case 'shared':
        filtered = filtered.filter(map =>
          map.idUser !== this.currentUserId &&
          map.sharedWith?.some(user => user.userId === this.currentUserId)
        );
        break;
      case 'recent':
        // TODO: Implement recent access tracking
        filtered = filtered.slice(0, 5);
        break;
    }

    // Apply search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(map =>
        map.mapName.toLowerCase().includes(query) ||
        (map.description && map.description.toLowerCase().includes(query)) ||
        this.getOwnerName(map.idUser).toLowerCase().includes(query)
      );
    }

    // Apply owner filter
    if (this.selectedOwner) {
      filtered = filtered.filter(map => map.idUser === Number(this.selectedOwner));
    }

    // Apply access level filter
    if (this.selectedAccessLevel) {
      filtered = filtered.filter(map => {
        if (map.idUser === this.currentUserId) {
          return this.selectedAccessLevel === 'owner';
        }
        const userAccess = map.sharedWith?.find(user => user.userId === this.currentUserId);
        return userAccess?.permission === this.selectedAccessLevel;
      });
    }

    this.filteredMaps = filtered;
  }

  getOwnerName(userId: number): string {
    const owner = this.sharedUsers.find(o => o.userId === userId);
    return owner ? owner.userName : `User ${userId}`;
  }

  getAccessLevel(map: AppMap): string {
    if (map.idUser === this.currentUserId) {
      return 'owner';
    }
    const userAccess = map.sharedWith?.find(user => user.userId === this.currentUserId);
    return userAccess?.permission || 'none';
  }

  getAccessLevelText(map: AppMap): string {
    const level = this.getAccessLevel(map);
    switch (level) {
      case 'owner': return 'Owner';
      case 'write': return 'Write Access';
      case 'read': return 'Read Only';
      default: return 'No Access';
    }
  }

  getMapThumbnail(map: AppMap): string {
    return map.mapPreviewPath ? `url(${map.mapPreviewPath})` : '';
  }

  openMap(map: AppMap): void {
    // TODO: Navigate to map page
    console.log('Opening map:', map);
  }

  openMapDetails(map: AppMap): void {
    // TODO: Open map details panel
    console.log('Opening map details:', map);
  }

  refreshMaps(): void {
    this.loadSharedMaps();
  }
}
