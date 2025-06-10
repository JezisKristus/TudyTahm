import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, takeUntil } from 'rxjs';
import { LabelService } from './label.service';
import { Label } from '../models/label';
import { CreateLabelDto } from '../models/dtos/create-label.dto';

@Injectable({
  providedIn: 'root'
})
export class LabelManagerService {
  private labels$ = new BehaviorSubject<Label[]>([]);
  private destroy$ = new Subject<void>();

  constructor(private labelService: LabelService) {}

  getLabels(): Observable<Label[]> {
    return this.labels$.asObservable();
  }

  loadLabels(mapId: number): Observable<Label[]> {
    return new Observable(subscriber => {
      // Check cache first
      const cachedLabels = sessionStorage.getItem(`labels_${mapId}`);
      if (cachedLabels) {
        try {
          const labels = JSON.parse(cachedLabels);
          this.labels$.next(labels);
          subscriber.next(labels);
          subscriber.complete();
          return;
        } catch (e) {
          console.warn('Error parsing cached labels:', e);
          sessionStorage.removeItem(`labels_${mapId}`);
        }
      }

      // If no cache or invalid cache, load from API
      this.labelService.getLabelsByMapID(mapId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (labels) => {
            const processedLabels = labels.map(label => ({
              labelID: label.labelID,
              idMap: label.idMap,
              name: label.name,
              color: label.color
            }));

            sessionStorage.setItem(`labels_${mapId}`, JSON.stringify(processedLabels));
            this.labels$.next(processedLabels);
            subscriber.next(processedLabels);
            subscriber.complete();
          },
          error: (err) => subscriber.error(err)
        });
    });
  }

  createLabel(labelData: CreateLabelDto): Observable<Label> {
    return new Observable(subscriber => {
      this.labelService.createLabel(labelData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (newLabel) => {
            this.invalidateLabelsCache(labelData.idMap);
            this.loadLabels(labelData.idMap).subscribe();
            subscriber.next(newLabel);
            subscriber.complete();
          },
          error: (err) => subscriber.error(err)
        });
    });
  }

  updateLabel(labelData: Label): Observable<Label> {
    return new Observable(subscriber => {
      this.labelService.updateLabel(labelData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (updatedLabel) => {
            this.invalidateLabelsCache(labelData.idMap);
            this.loadLabels(labelData.idMap).subscribe();
            subscriber.next(updatedLabel);
            subscriber.complete();
          },
          error: (err) => subscriber.error(err)
        });
    });
  }

  deleteLabel(labelId: number, mapId: number): Observable<void> {
    return new Observable(subscriber => {
      this.labelService.deleteLabel(labelId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.invalidateLabelsCache(mapId);
            this.loadLabels(mapId).subscribe();
            subscriber.next();
            subscriber.complete();
          },
          error: (err) => subscriber.error(err)
        });
    });
  }

  private invalidateLabelsCache(mapId: number): void {
    sessionStorage.removeItem(`labels_${mapId}`);
    Object.keys(sessionStorage)
      .filter(key => key.startsWith('labels_'))
      .forEach(key => sessionStorage.removeItem(key));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
} 