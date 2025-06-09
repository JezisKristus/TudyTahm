import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, takeUntil } from 'rxjs';
import { MapService } from './map.service';
import { AppMap } from '../models/appMap';
import * as L from 'leaflet';

@Injectable({
  providedIn: 'root'
})
export class MapInitializationService {
  private map$ = new BehaviorSubject<L.Map | null>(null);
  private currentMap$ = new BehaviorSubject<AppMap | null>(null);
  private destroy$ = new Subject<void>();

  constructor(private mapService: MapService) {}

  getMap(): Observable<L.Map | null> {
    return this.map$.asObservable();
  }

  getCurrentMap(): Observable<AppMap | null> {
    return this.currentMap$.asObservable();
  }

  initializeMap(containerId: string): Observable<L.Map> {
    return new Observable(subscriber => {
      try {
        const map = L.map(containerId).setView([49.8022514, 15.6252330], 8);
        const layer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        this.map$.next(map);
        subscriber.next(map);
        subscriber.complete();
      } catch (error) {
        subscriber.error(error);
      }
    });
  }

  loadMapData(mapId: number): Observable<AppMap> {
    return new Observable(subscriber => {
      this.mapService.getMapById(mapId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (mapData: AppMap) => {
            if (mapData) {
              const processedMap = {
                mapID: mapData.mapID,
                idUser: mapData.idUser,
                mapName: mapData.mapName || 'Unnamed Map',
                mapPreviewPath: mapData.mapPreviewPath || '',
                description: mapData.description || '',
                sharedWith: mapData.sharedWith || []
              };
              this.currentMap$.next(processedMap);
              subscriber.next(processedMap);
              subscriber.complete();
            } else {
              const defaultMap: AppMap = {
                mapID: mapId,
                idUser: 1,
                mapName: 'Unnamed Map',
                mapPreviewPath: '',
                description: '',
                sharedWith: []
              };
              this.currentMap$.next(defaultMap);
              subscriber.next(defaultMap);
              subscriber.complete();
            }
          },
          error: (err) => subscriber.error(err)
        });
    });
  }

  updateMapView(map: L.Map, lat: number, lon: number, zoom: number = 13): void {
    map.setView([lat, lon], zoom);
  }

  addMapEventListener(map: L.Map, event: string, handler: (e: any) => void): void {
    map.on(event, handler);
  }

  removeMapEventListener(map: L.Map, event: string, handler: (e: any) => void): void {
    map.off(event, handler);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    const map = this.map$.getValue();
    if (map) {
      map.remove();
    }
  }
} 