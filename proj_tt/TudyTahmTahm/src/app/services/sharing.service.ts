import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {HttpClient} from '@angular/common/http';
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

  public addUserToMap(sharedUser: SharedUser): Observable<SharedUser> {
    return this.http.post<SharedUser>(`${environment.apiUrl}/Share/AddUserToMap`, sharedUser)
      .pipe(
        map(user => {
          console.log("Sharing ", user);
          return user;
        })
      );
  }

  public getSharedUsers(): Observable<SharedUser[]> {
    const userId = this.authService.getCurrentUserID();
    return this.http.get<SharedUser[]>(`${environment.apiUrl}/Map/SharedUsers/${userId}`)
  }

  public editUserPermission(sharedUser: SharedUser): Observable<SharedUser> {
    return this.http.post<SharedUser>(`${environment.apiUrl}/Share/EditUserPermissionOnMap`, sharedUser)
      .pipe(
        map(user => {
          console.log("Editing share ", user);
          return user;
        })
      );
  }


  public removeUserFromMap(sharedUser: SharedUser): Observable<SharedUser> {
    return this.http.post<SharedUser>(`${environment.apiUrl}/Share/EditUserPermissionOnMap`, sharedUser)
      .pipe(
        tap(user => console.log("Removed user from map", user))
      );
  }

}
