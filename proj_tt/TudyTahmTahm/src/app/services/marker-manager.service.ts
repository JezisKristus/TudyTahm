import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, takeUntil } from 'rxjs';
import { MarkerService } from './marker.service';
import { AppMarker } from '../models/appMarker';
import { ExtendedMarker } from '../models/extended-marker';
import { ColorMarkerComponent } from '../components/color-marker/color-marker.component';
import { ComponentRef, ViewContainerRef } from '@angular/core';
import { MarkerDetailsComponent } from '../components/marker-details/marker-details.component';
import { AddMarkerPopupComponent } from '../components/map/add-marker-popup/add-marker-popup.component';
import * as L from 'leaflet';

@Injectable({
  providedIn: 'root'
})
export class MarkerManagerService {
  private markers$ = new BehaviorSubject<ExtendedMarker[]>([]);
  private colorMarkerRefs: ComponentRef<ColorMarkerComponent>[] = [];
  private markerDetailsRef?: ComponentRef<MarkerDetailsComponent>;
  private popupRef: ComponentRef<AddMarkerPopupComponent> | null = null;
  private destroy$ = new Subject<void>();

  constructor(private markerService: MarkerService) {}

  getMarkers(): Observable<ExtendedMarker[]> {
    return this.markers$.asObservable();
  }

  loadMarkers(mapId: number): Observable<AppMarker[]> {
    return this.markerService.getMarkersByMapId(mapId);
  }

  createMarker(markerData: AppMarker, map: L.Map, viewContainerRef: ViewContainerRef): Observable<AppMarker> {
    return new Observable(subscriber => {
      this.markerService.createMarker(markerData).subscribe({
        next: (createdMarker) => {
          try {
            const compRef = viewContainerRef.createComponent(ColorMarkerComponent);
            compRef.instance.map = map;
            compRef.instance.markerData = createdMarker;
            compRef.instance.labelColor = '#0000ff';

            this.colorMarkerRefs.push(compRef);
            subscriber.next(createdMarker);
            subscriber.complete();
          } catch (error) {
            subscriber.error(error);
          }
        },
        error: (err) => subscriber.error(err)
      });
    });
  }

  updateMarker(markerData: AppMarker): Observable<AppMarker> {
    return this.markerService.updateMarker(markerData);
  }

  deleteMarker(marker: AppMarker): Observable<void> {
    return this.markerService.deleteMarker(marker);
  }

  showMarkerDetails(markerData: AppMarker, viewContainerRef: ViewContainerRef, labels: any[]): void {
    if (this.markerDetailsRef) {
      this.markerDetailsRef.destroy();
    }

    this.markerDetailsRef = viewContainerRef.createComponent(MarkerDetailsComponent);
    this.markerDetailsRef.instance.marker = { ...markerData };
    this.markerDetailsRef.instance.labels = [...labels];
    this.markerDetailsRef.changeDetectorRef.detectChanges();
  }

  showPopup(latlng: L.LatLng, viewContainerRef: ViewContainerRef, map: L.Map): void {
    if (this.popupRef) {
      this.popupRef.destroy();
      this.popupRef = null;
    }

    this.popupRef = viewContainerRef.createComponent(AddMarkerPopupComponent);
    this.popupRef.instance.latlng = latlng;

    document.body.appendChild(this.popupRef.location.nativeElement);

    const popupOverlay = L.popup({
      closeButton: false,
      closeOnClick: false,
      autoClose: false,
      className: 'custom-popup-container',
    })
      .setLatLng(latlng)
      .setContent(this.popupRef.location.nativeElement)
      .openOn(map);

    const removePopup = () => {
      map.closePopup(popupOverlay);
      if (this.popupRef) {
        this.popupRef.destroy();
        this.popupRef = null;
      }
      map.off('click', removePopup);
    };

    map.on('click', removePopup);
  }

  clearSelectedMarker(): void {
    if (this.markerDetailsRef) {
      this.markerDetailsRef.destroy();
      this.markerDetailsRef = undefined;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.colorMarkerRefs.forEach(ref => ref.destroy());
    if (this.popupRef) {
      this.popupRef.destroy();
    }
    if (this.markerDetailsRef) {
      this.markerDetailsRef.destroy();
    }
  }
} 