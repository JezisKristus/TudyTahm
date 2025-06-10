import {Injectable} from '@angular/core';
import {Observable, throwError} from 'rxjs';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {environment} from '../../environments/environment';
import {map} from 'rxjs/operators';
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
    return this.http.get<any[]>(`${environment.apiUrl}/Authentication/SharedUsers/${userId}`, { headers })
      .pipe(
        map(users => users.map(user => ({
          userID: user.userID,
          userName: user.userName,
          userEmail: user.userEmail,
          permission: user.permission
        })))
      );
  }

  public addUserToMap(mapId: number, sharedUser: SharedUser): Observable<SharedUser> {
    const payload = {
      email: sharedUser.userEmail,
      permission: sharedUser.permission,
      mapID: mapId
    };

    return this.http.post<SharedUser>(
      `${environment.apiUrl}/Share/AddUserToMap/${mapId}`,
      payload
    );
  }


  public editUserPermission(mapId: number, sharedUser: SharedUser): Observable<SharedUser> {
    return this.http.put<SharedUser>(
      `${environment.apiUrl}/Share/EditUserPermissionOnMap/${mapId}`,
      sharedUser
    );
  }

  public removeUserFromMap(mapId: number, sharedUser: SharedUser): Observable<SharedUser> {
    return this.http.post<SharedUser>(`${environment.apiUrl}/Share/EditUserPermissionOnMap`, sharedUser);
  }
}
