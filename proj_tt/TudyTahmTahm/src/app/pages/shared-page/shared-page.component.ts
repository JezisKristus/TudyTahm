import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { AppMap, SharedUser } from '../../models/appMap';

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
  searchQuery = '';
  selectedOwner = '';
  selectedAccessLevel = '';
  selectedCategory = 'all';
  uniqueOwners: { id: number; name: string }[] = [];
  currentUserId = 1; // TODO: Replace with actual current user id

  ngOnInit(): void {
    this.loadSharedMaps();
  }

  loadSharedMaps(): void {
    // TODO: Replace with actual API call
    this.maps = [
      {
        mapID: 1,
        idUser: 2,
        isCustom: true,
        mapName: 'Journey to the marketplace',
        mapPath: '/maps/marketplace',
        mapPreviewPath: '/assets/previews/marketplace.png',
        description: 'Exploring the world with Filip Nprune and discovering hidden treasures along the way.',
        sharedWith: [
          { userId: 1, userName: 'Current User', permission: 'write' },
          { userId: 3, userName: 'John Doe', permission: 'read' }
        ]
      },
      {
        mapID: 2,
        idUser: 3,
        isCustom: true,
        mapName: 'Journey to Trosky',
        mapPath: '/maps/trosky',
        mapPreviewPath: '/assets/previews/trosky.png',
        description: 'A beautiful journey to Trosky castle through scenic routes.',
        sharedWith: [
          { userId: 1, userName: 'Current User', permission: 'read' }
        ]
      },
      {
        mapID: 3,
        idUser: 1,
        isCustom: true,
        mapName: 'City Walking Tour',
        mapPath: '/maps/city-tour',
        mapPreviewPath: '/assets/previews/city-tour.png',
        description: 'A comprehensive walking tour of the historic city center.',
        sharedWith: [
          { userId: 2, userName: 'Petr Svab', permission: 'write' },
          { userId: 3, userName: 'Jan Novak', permission: 'read' },
          { userId: 4, userName: 'Marie Svoboda', permission: 'read' }
        ]
      }
    ];

    this.updateUniqueOwners();
    this.applyFilters();
  }

  updateUniqueOwners(): void {
    const owners = new Map<number, string>();
    this.maps.forEach(map => {
      if (!owners.has(map.idUser)) {
        // TODO: Replace with actual user names from API
        const userName = map.idUser === 1 ? 'You' :
                        map.idUser === 2 ? 'Petr Svab' :
                        map.idUser === 3 ? 'Jan Novak' : `User ${map.idUser}`;
        owners.set(map.idUser, userName);
      }
    });
    this.uniqueOwners = Array.from(owners.entries()).map(([id, name]) => ({ id, name }));
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
    const owner = this.uniqueOwners.find(o => o.id === userId);
    return owner ? owner.name : `User ${userId}`;
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

  shareMap(map: AppMap): void {
    // TODO: Open share dialog
    console.log('Sharing map:', map);
  }

  openShareDialog(): void {
    // TODO: Open dialog to share new map
    console.log('Opening share dialog');
  }

  refreshMaps(): void {
    this.loadSharedMaps();
  }
}
