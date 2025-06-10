import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import {catchError, switchMap, tap} from 'rxjs/operators';
import {User} from '../models/user';
import {AuthenticationService} from './authentication.service';
import {environment} from '../../environments/environment.development';


export interface UserUpdateRequest {
  userID?: number;
  UserName?: string;
  UserEmail?: string;
  UserIconPath?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserSettingsService {
  private settingsKey = 'userSettings';



  constructor(
    private http: HttpClient,
    private authService: AuthenticationService
  ) { }


  // User profile update methods
  updateUsername(newUsername: string): Observable<User> {
    const userId = this.authService.getCurrentUserID();
    if (!userId) {
      return throwError(() => new Error('User is not authenticated'));
    }

    const updateRequest: UserUpdateRequest = {
      UserName: newUsername
    };

    return this.http.put<User>(`${environment.apiUrl}/Authentication/UpdateUser/${userId}`, updateRequest)
      .pipe(
        tap(updatedUser => {
          this.authService.setUser(updatedUser);
        }),
        catchError(error => {
          console.error('Failed to update username:', error);
          return throwError(() => new Error('Failed to update username. Please try again.'));
        })
      );
  }

  updateEmail(newEmail: string): Observable<User> {
    const userId = this.authService.getCurrentUserID();
    if (!userId) {
      return throwError(() => new Error('User is not authenticated'));
    }

    const updateRequest: UserUpdateRequest = {
      UserEmail: newEmail
    };

    return this.http.put<User>(`${environment.apiUrl}/Authentication/UpdateUser/${userId}`, updateRequest)
      .pipe(
        tap(updatedUser => {
          this.authService.setUser(updatedUser);
        }),
        catchError(error => {
          console.error('Failed to update email:', error);
          return throwError(() => new Error('Failed to update email. Please try again.'));
        })
      );
  }

  updatePassword(oldPassword: string, newPassword: string): Observable<User> {
    const userId = this.authService.getCurrentUserID();
    if (!userId) {
      return throwError(() => new Error('User is not authenticated'));
    }

    const updateRequest = {
      oldPassword,
      newPassword
    };

    return this.http.put<User>(`${environment.apiUrl}/Authentication/ChangePassword/${userId}`, updateRequest)
      .pipe(
        tap(updatedUser => {
          this.authService.setUser(updatedUser);
        }),
        catchError((error: HttpErrorResponse) => {
          let message = 'Failed to update password.';

          if (error.status === 400 && error.error?.code === 68) {
            message = 'The new password is already in use.';
          } else if (error.status === 400 && error.error?.code === 69) {
            message = 'The old password is incorrect.';
          } else if (error.status === 404) {
            message = 'User not found.';
          } else if (error.status === 0) {
            message = 'Could not reach the server.';
          }

          return throwError(() => new Error(message));
        })
      );
  }


  updateProfilePicture(imageFile: File): Observable<User> {
    const userId = this.authService.getCurrentUserID();
    if (!userId) {
      return throwError(() => new Error('User is not authenticated'));
    }

    const formData = new FormData();
    formData.append('image', imageFile);

    return this.http.put(`${environment.apiUrl}/Authentication/UploadPFP/${userId}`, formData)
      .pipe(
        // Po úspěšném uploadu znovu načteme uživatele, aby se aktualizovala cesta k obrázku
        switchMap(() => this.authService.getUserByID(userId)),
        tap(updatedUser => {
          this.authService.setUser(updatedUser);
        }),
        catchError(error => {
          console.error('Failed to update profile picture:', error);
          return throwError(() => new Error('Failed to update profile picture. Please try again.'));
        })
      );
  }
}
