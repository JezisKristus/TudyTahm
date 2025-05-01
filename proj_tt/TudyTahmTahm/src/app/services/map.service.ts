import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AppMarker } from '../models/appMarker';
import { environment } from '../../environments/environment';
import { tap, map, catchError } from 'rxjs/operators';
import { Map } from '../models/map';

@Injectable({
  providedIn: 'root'
})
export class MapService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getMapById(id: number): Observable<Map> {
    return this.http.get<Map>(`${this.apiUrl}/Map/ByMapID/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  getMapsByUserId(id: number): Observable<Map[]> {
    return this.http.get<Map[]>(`${this.apiUrl}/Map/ByUserID/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Renamed from the original getMapByUserId for backward compatibility
  getMapByUserId(id: number): Observable<Map[]> {
    return this.getMapsByUserId(id);
  }

  createMap(map: Partial<Map>): Observable<Map> {
    return this.http.post<Map>(`${this.apiUrl}/Map`, map)
      .pipe(
        catchError(this.handleError)
      );
  }

  updateMap(id: number, map: Partial<Map>): Observable<Map> {
    return this.http.put<Map>(`${this.apiUrl}/Map/${id}`, map)
      .pipe(
        catchError(this.handleError)
      );
  }

  deleteMap(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/Map/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  private handleError(error: any) {
    console.error('An error occurred:', error);
    return throwError(() => new Error('Something went wrong. Please try again later.'));
  }
}
