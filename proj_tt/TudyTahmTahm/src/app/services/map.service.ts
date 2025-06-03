import {Injectable} from '@angular/core';
import {Observable, throwError} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';
import {catchError} from 'rxjs/operators';
import {AppMap} from '../models/appMap';

@Injectable({
  providedIn: 'root'
})
export class MapService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {
  }

  getMapById(id: number): Observable<AppMap> {
    return this.http.get<AppMap>(`${this.apiUrl}/Map/ByMapID/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  getMapsByCurrentUser(): Observable<AppMap[]> {
    const userId = this.getCurrentUserId();
    return this.http.get<AppMap[]>(`${this.apiUrl}/Map/ByUserID/${userId}`)
      .pipe(
        catchError(this.handleError),
      );
  }

  public getSharedMaps(): Observable<AppMap[]> {
    const userId = this.getCurrentUserId();
    return this.http.get<AppMap[]>(`${this.apiUrl}/Map/SharedMaps/${userId}`)
  }


  createMap(map: AppMap): Observable<AppMap> {
    console.log("creating map")
    map.idUser = this.getCurrentUserId()
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

  private getCurrentUserId(): number {
    const user = sessionStorage.getItem('user');
    if (!user) {
      console.warn('No user data found in sessionStorage. Redirecting to login...');
      // Optionally, redirect to login page here
      return 0; // Return 0 or handle as unauthenticated
    }

    try {
      const parsedUser = JSON.parse(user);
      if (!parsedUser.userID) {
        console.warn('User data is missing userID:', parsedUser);
        return 0; // Return 0 if userID is missing
      }
      return parsedUser.userID;
    } catch (error) {
      console.error('Error parsing user data from sessionStorage:', error);
      return 0; // Return 0 if parsing fails
    }
  }


  private handleError(error: any) {
    console.error('An error occurred:', error);
    return throwError(() => new Error('Something went wrong. Please try again later.'));
  }
}
