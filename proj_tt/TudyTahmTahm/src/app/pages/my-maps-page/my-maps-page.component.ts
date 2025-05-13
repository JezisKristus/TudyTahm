import {Component, OnInit} from '@angular/core';
import {CommonModule, NgFor, NgIf} from '@angular/common';
import {Router, RouterLink, RouterLinkActive} from '@angular/router';
import {SidebarComponent} from '../../components/sidebar/sidebar.component';
import {MapService} from '../../services/map.service';
import {AppMap} from '../../models/appMap';
import {finalize} from 'rxjs/operators';
import {AddMapDialogComponent} from '../../components/add-map-dialog/add-map-dialog.component';

@Component({
  selector: 'app-my-maps',
  standalone: true,
  imports: [
    CommonModule,
    NgFor,
    NgIf,
    SidebarComponent,
    RouterLinkActive,
    RouterLink,
    AddMapDialogComponent
  ],
  templateUrl: './my-maps-page.component.html',
  styleUrls: ['./my-maps-page.component.scss']
})
export class MyMapsPageComponent implements OnInit {
  maps: AppMap[] = [];
  loading = true;
  error: string | null = null;
  showAddMapDialog = false;

  constructor(
    private mapService: MapService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadMaps();
  }

  loadMaps(): void {
    this.loading = true;
    this.mapService.getMapsByCurrentUser()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (maps) => {
          this.maps = maps;
        },
        error: (err) => {
          console.error('Failed to fetch maps:', err);
          this.error = 'Failed to load maps. Please try again later.';
        }
      });
  }

  addNewMap(): void {
    this.showAddMapDialog = true; // Show the dialog
  }

  onDialogClose(): void {
    this.showAddMapDialog = false; // Hide the dialog
  }

  onCreateMap(mapData: any): void {
    this.showAddMapDialog = false; // Hide the dialog
    this.createMap(mapData);
  }

  onMapClick(map: any): void {
    sessionStorage.setItem('Map', JSON.stringify(map));
    sessionStorage.setItem('Map.mapID', map.mapID.toString()); // Store mapID separately
    console.log('Storing map data into sessionStorage:', map);
    console.log('Storing mapID into sessionStorage:', map.mapID); // Log mapID
  }

  private createMap(mapData: Partial<AppMap>): void {
    const payload = {
      isCustom: mapData.isCustom || false,
      mapName: mapData.mapName || '',
      mapPath: mapData.mapPath || ''
    };

    this.mapService.createMap(payload).subscribe({
      next: (newMap) => {
        this.maps.push(newMap);
      },
      error: (err) => {
        console.error('Failed to create map:', err);
      }
    });
  }
}
