import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { catchError, tap, finalize, switchMap } from 'rxjs/operators';
import { User } from '../models/user';
import { AuthenticationService } from './authentication.service';
import { environment } from '../../environments/environment.development';


export interface UserUpdateRequest {
  userID?: number;
  UserName?: string;
  UserEmail?: string;
  UserPassword?: string;
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

  updatePassword(currentPassword: string, newPassword: string): Observable<User> {
    const userId = this.authService.getCurrentUserID();
    if (!userId) {
      return throwError(() => new Error('User is not authenticated'));
    }

    const updateRequest: UserUpdateRequest = {
      UserPassword: newPassword
    };

    return this.http.put<User>(`${environment.apiUrl}/Authentication/UpdateUser/${userId}`, updateRequest)
      .pipe(
        tap(updatedUser => {
          this.authService.setUser(updatedUser);
        }),
        catchError(error => {
          console.error('Failed to update password:', error);
          return throwError(() => new Error('Failed to update password. Please check your current password and try again.'));
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

  getCurrentUser(): User | null {
    return this.authService.getUser();
  }
}
