import {Injectable} from '@angular/core';
import {Observable, share, throwError} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';
import {catchError, map, tap} from 'rxjs/operators';
import {AppMap, SharedUser} from '../models/appMap';
import {User} from '../models/user';
import {AuthenticationService} from './authentication.service';

@Injectable({
  providedIn: 'root'
})
export class SharingService{
  constructor(private http:HttpClient, private authService: AuthenticationService) {
  }
  public addUserToMap(sharedUser: SharedUser): Observable<SharedUser> {
    return this.http.post<SharedUser>(`${environment.apiUrl}/Share/AddUserToMap/`, sharedUser)
      .pipe(
        map(user => {
          console.log("Sharing ", user);
          return user;
        })
      );
  }
  getSharedUsers(): Observable<SharedUser[]>{
    const userId = this.authService.getCurrentUserID();
    return this.http.get<SharedUser[]>(`${environment.apiUrl}/Map/SharedUsers/${userId}`)
  }
  public editUserPermission(sharedUser: SharedUser): Observable<SharedUser>{
    return this.http.post<SharedUser>(`${environment.apiUrl}/Share/EditUserPermissionOnMap/`, sharedUser)
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
