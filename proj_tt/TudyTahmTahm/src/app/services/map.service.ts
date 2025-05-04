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

  getMapsByCurrentUser(): Observable<Map[]> {
    const userId = this.getCurrentUserId();
    return this.http.get<Map[]>(`${this.apiUrl}/Map/ByUserID/${userId}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  createMap(map: Partial<Map>): Observable<Map> {
    const userId = this.getCurrentUserId();
    const payload = { ...map, idUser: userId };
    return this.http.post<Map>(`${this.apiUrl}/Map`, payload)
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
