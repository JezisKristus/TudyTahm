import {Injectable} from '@angular/core';
import {Observable, throwError} from 'rxjs';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {environment} from '../../environments/environment';
import {map, tap} from 'rxjs/operators';
import {SharedUser} from '../models/appMap';
import {AuthenticationService} from './authentication.service';

@Injectable({
  providedIn: 'root'
})
export class SharingService {
  constructor(
    private http: HttpClient,
    private authService: AuthenticationService
  ) {
  }

  public getSharedUsers(): Observable<SharedUser[]> {
    const userId = this.authService.getCurrentUserID();
    const token = this.authService.getToken();
    
    if (!userId || !token) {
      return throwError(() => new Error('User is not authenticated'));
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<any[]>(`${environment.apiUrl}/Map/SharedMaps/${userId}`, { headers });
  }

  public addUserToMap(sharedUser: SharedUser): Observable<SharedUser> {
    return this.http.post<SharedUser>(`${environment.apiUrl}/Share/AddUserToMap/${sharedUser.mapId}`, sharedUser);
  }

  public editUserPermission(sharedUser: SharedUser): Observable<SharedUser> {
    return this.http.put<SharedUser>(
      `${environment.apiUrl}/Share/EditUserPermissionOnMap/${sharedUser.mapId}`,
      sharedUser
    );
  }

  public removeUserFromMap(sharedUser: SharedUser): Observable<SharedUser> {
    return this.http.post<SharedUser>(`${environment.apiUrl}/Share/EditUserPermissionOnMap`, sharedUser);
  }
}
