import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { catchError, tap, finalize, switchMap } from 'rxjs/operators';
import { User } from '../models/user';
import { AuthenticationService } from './authentication.service';
import { environment } from '../../environments/environment.development';

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  language: string;
  fontSize: 'small' | 'medium' | 'large';
  // Add other settings as needed
}

export interface UserUpdateRequest {
  userID?: number;
  userName?: string;
  userEmail?: string;
  userPassword?: string;
  newPassword?: string;
  userIconPath?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserSettingsService {
  private settingsKey = 'userSettings';
  private defaultSettings: UserSettings = {
    theme: 'system',
    notifications: true,
    language: 'en',
    fontSize: 'medium'
  };

  private settingsSubject = new BehaviorSubject<UserSettings>(this.loadSettings());
  public settings$ = this.settingsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthenticationService
  ) { }

  private loadSettings(): UserSettings {
    try {
      const storedSettings = localStorage.getItem(this.settingsKey);
      return storedSettings ? JSON.parse(storedSettings) : this.defaultSettings;
    } catch (error) {
      console.error('Error loading settings:', error);
      return this.defaultSettings;
    }
  }

  updateSettings(newSettings: Partial<UserSettings>): void {
    const currentSettings = this.settingsSubject.getValue();
    const updatedSettings = { ...currentSettings, ...newSettings };

    localStorage.setItem(this.settingsKey, JSON.stringify(updatedSettings));
    this.settingsSubject.next(updatedSettings);
  }

  resetSettings(): void {
    localStorage.removeItem(this.settingsKey);
    this.settingsSubject.next(this.defaultSettings);
  }

  // User profile update methods
  updateUsername(newUsername: string): Observable<User> {
    const userId = this.authService.getCurrentUserID();
    if (!userId) {
      return throwError(() => new Error('User is not authenticated'));
    }

    const updateRequest: UserUpdateRequest = {
      userName: newUsername
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
      userEmail: newEmail
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

    // API očekává pouze nové heslo, pokud je potřeba i staré, přidejte jej do těla
    const updateRequest: UserUpdateRequest = {
      userPassword: newPassword
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
