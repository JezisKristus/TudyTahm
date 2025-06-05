import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {RouterLink, RouterLinkActive} from '@angular/router';
import {SidebarComponent} from '../../components/sidebar/sidebar.component';
import {AppMap, SharedUser} from '../../models/appMap';
import {SharingService} from '../../services/sharing.service';
import {MapService} from '../../services/map.service';
import {finalize} from 'rxjs/operators';
import {AuthenticationService} from '../../services/authentication.service';
import {MapDetailsComponent} from '../../components/map-details/map-details.component';
import {ShareMapDialogComponent} from '../../components/share-map-dialog/share-map-dialog.component';

@Component({
  selector: 'app-shared-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    RouterLinkActive,
    SidebarComponent,
    MapDetailsComponent,
    ShareMapDialogComponent
  ],
  templateUrl: './shared-page.component.html',
  styleUrls: ['./shared-page.component.scss']
})
export class SharedPageComponent implements OnInit {
  maps: AppMap[] = [];
  filteredMaps: AppMap[] = [];
  searchQuery: string = '';
  selectedOwner: string = 'all';
  selectedAccess: string = 'all';
  selectedCategory = 'all';
  uniqueOwners: SharedUser[] = [];
  currentUserId: number | null = null;
  showMapDetails: boolean = false;
  showShareDialog: boolean = false;
  selectedMap: AppMap | null = null;

  constructor(
    private sharingService: SharingService,
    private mapService: MapService,
    private authService: AuthenticationService
  ) {
  }

  ngOnInit(): void {
    this.currentUserId = this.authService.getCurrentUserID();
    this.loadSharedMaps();
  }

  loadSharedMaps(): void {
    this.mapService.getSharedMaps()
      .pipe()
      .subscribe({
        next: (maps) => {
          this.maps = maps;
          this.applyFilters();
        },
        error: (error) => {
          console.error('Error loading shared maps:', error);
        }
      });

    this.updateUniqueOwners();
  }

  updateUniqueOwners(): void {
    const owners = new Map<number, string>();
    this.sharingService.getSharedUsers().subscribe({
      next: (users) => {
        this.uniqueOwners = users;
      }
    });
  }

  selectCategory(category: string): void {
    this.selectedCategory = category;
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredMaps = this.maps.filter(map => {
      const matchesSearch = !this.searchQuery || 
        map.mapName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        map.description.toLowerCase().includes(this.searchQuery.toLowerCase());

      const matchesOwner = this.selectedOwner === 'all' || 
        (this.selectedOwner === 'me' && map.idUser === this.currentUserId) ||
        (this.selectedOwner === 'others' && map.idUser !== this.currentUserId);

      const matchesAccess = this.selectedAccess === 'all' || 
        (this.selectedAccess === 'read' && this.getAccessLevel(map) === 'read') ||
        (this.selectedAccess === 'write' && this.getAccessLevel(map) === 'write');

      return matchesSearch && matchesOwner && matchesAccess;
    });
  }

  onSearch(): void {
    this.applyFilters();
  }

  onOwnerFilterChange(): void {
    this.applyFilters();
  }

  onAccessFilterChange(): void {
    this.applyFilters();
  }

  getOwnerName(userId: number): string {
    const owner = this.uniqueOwners.find(o => o.userId === userId);
    if (owner) {
      return owner.userName;
    }
    
    // If owner not found in uniqueOwners, try to get current user's name
    if (userId === this.currentUserId) {
      const currentUser = this.authService.getUser();
      if (currentUser) {
        return currentUser.userName || currentUser.userEmail || `User ${userId}`;
      }
    }
    
    return `User ${userId}`;
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

  openMapDetails(map: AppMap): void {
    this.selectedMap = map;
    this.showMapDetails = true;
  }

  closeMapDetails(): void {
    this.showMapDetails = false;
    this.selectedMap = null;
  }

  openShareDialog(map: AppMap): void {
    this.selectedMap = map;
    this.showShareDialog = true;
  }

  closeShareDialog(): void {
    this.showShareDialog = false;
    this.selectedMap = null;
  }

  onShareSuccess(): void {
    this.loadSharedMaps();
    this.closeShareDialog();
  }

  refreshMaps(): void {
    this.loadSharedMaps();
  }

  openMap(map: AppMap): void {
    sessionStorage.setItem('Map', JSON.stringify(map));
    sessionStorage.setItem('Map.mapID', map.mapID.toString());
    console.log('Storing map data into sessionStorage:', map);
    console.log('Storing mapID into sessionStorage:', map.mapID);
  }

  isOwner(map: AppMap): boolean {
    return map.idUser === this.currentUserId;
  }

  canShare(map: AppMap): boolean {
    return this.isOwner(map) || map.sharedWith?.some(user => user.userId === this.currentUserId && user.permission === 'write');
  }
}
