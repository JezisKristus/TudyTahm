import {Injectable} from '@angular/core';
import {Observable, throwError} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';
import {catchError, map, tap} from 'rxjs/operators';
import {AppMap} from '../models/appMap';
import {AuthenticationService} from './authentication.service';

@Injectable({
  providedIn: 'root'
})
export class MapService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthenticationService
  ) {
  }

  // Debug method to check current user and permissions
  debugUserAndPermissions(): void {
    const userId = this.authService.getCurrentUserID();
    console.log('Current User ID:', userId);
    console.log('Current User:', this.authService.getUser());
    console.log('Is Authenticated:', this.authService.isAuthenticated());
  }

  getMapById(id: number): Observable<AppMap> {
    this.debugUserAndPermissions(); // Add debug logging
    return this.http.get<AppMap>(`${this.apiUrl}/Map/ByMapID/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  getMapsByCurrentUser(): Observable<AppMap[]> {
    const userId = this.authService.getCurrentUserID();
    if (!userId) {
      console.error('getMapsByCurrentUser: No user ID available');
      return throwError(() => new Error('User is not authenticated'));
    }

    const token = this.authService.getToken();
    if (!token) {
      console.error('getMapsByCurrentUser: No token available');
      return throwError(() => new Error('No authentication token available'));
    }

    console.log('Fetching maps for user:', userId);
    return this.http.get<AppMap[]>(`${this.apiUrl}/Map/ByUserID/${userId}`).pipe(
      tap(response => console.log('Received maps response:', response)),
      catchError(error => {
        console.error('Error fetching maps:', error);
        if (error.status === 401) {
          console.error('Authentication failed. Token might be invalid or expired.');
        }
        return throwError(() => new Error('Failed to fetch maps. Please try again later.'));
      })
    );
  }

  public getSharedMaps(): Observable<AppMap[]> {
    const userId = this.authService.getCurrentUserID();
    if (!userId) {
      return throwError(() => new Error('User is not authenticated'));
    }
    return this.http.get<any[]>(`${this.apiUrl}/Map/SharedMaps/${userId}`)
      .pipe(
        map(maps => maps.map(map => ({
          mapID: map.mapID,
          mapName: map.mapName,
          description: map.mapDescription,
          mapPreviewPath: map.mapPreviewPath,
          idUser: map.idUser,
          permission: map.permission,
          sharedWith: [] // This will be populated separately if needed
        })))
      );
  }

  createMap(map: AppMap): Observable<AppMap> {
    const userId = this.authService.getCurrentUserID();
    if (!userId) {
      return throwError(() => new Error('User is not authenticated'));
    }
    map.idUser = userId;
    return this.http.post<AppMap>(`${this.apiUrl}/Map`, map)
      .pipe(
        catchError(this.handleError)
      );
  }

  updateMap(id: number, map: Partial<AppMap>): Observable<AppMap> {
    const options = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const payload = JSON.stringify(map.mapName);

    return this.http.put<AppMap>(
      `${this.apiUrl}/Map/RenameMap/${id}`,
      payload,
      options
    ).pipe(
      catchError(this.handleError)
    );
  }

  deleteMap(id: number): Observable<void> {
    if (!id) {
      console.error('Invalid mapID provided for deletion:', id);
      return throwError(() => new Error('Invalid mapID.'));
    }
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
