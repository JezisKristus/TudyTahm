import { Component, OnInit } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { MapService } from '../../services/map.service';
import { Map } from '../../models/map';
import { finalize } from 'rxjs/operators';
import { AddMapDialogComponent } from '../../components/add-map-dialog/add-map-dialog.component';

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
  maps: Map[] = [];
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
    const userId = 6; // Replace with authenticated user ID
    this.loading = true;
    this.mapService.getMapsByUserId(userId)
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

  private createMap(mapData: Partial<Map>): void {
    const payload = {
      idUser: 6,
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
