import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import {catchError, map, switchMap, tap} from 'rxjs/operators';
import {RegisterDTO} from '../models/register-dto';
import {SignInDTO} from '../models/sign-in-dto';
import {environment} from '../../environments/environment.development';
import {TokenResult, User} from '../models/user';

@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {
  constructor(private http: HttpClient) {
    // Check for corrupted storage data on service init
    this.sanitizeStorageData();
  }
  private sanitizeStorageData(): void {
    try {
      // Check if user data is valid JSON
      const userData = sessionStorage.getItem('user');
      if (userData) {
        JSON.parse(userData); // Will throw if invalid
      }
    } catch (error) {
      console.warn('Found corrupted user data in storage. Cleaning up...', error);
      sessionStorage.removeItem('user');
    }

    try {
      // Check if any userData key exists and is valid
      const userData = sessionStorage.getItem('userData');
      if (userData) {
        JSON.parse(userData); // Will throw if invalid
      }
    } catch (error) {
      console.warn('Found corrupted userData in storage. Cleaning up...', error);
      sessionStorage.removeItem('userData');
    }
  }

  public login(credentials: SignInDTO): Observable<{ token: TokenResult, user: User }> {
    this.logout();
  
    return this.http.post<{ token: string, refreshToken: string, user: User }>(`${environment.apiUrl}/Authentication/Login`, credentials).pipe(
      map((result) => {
        this.setToken(result.token);
        this.setRefreshToken(result.refreshToken);
        this.setUser(result.user);
        return { 
          token: { 
            token: result.token, 
            refreshToken: result.refreshToken,
            userID: result.user.userID,
            user: result.user
          }, 
          user: result.user 
        };
      }),
      catchError((error) => {
        return throwError(() => new Error('Login failed. Please check your credentials and try again.'));
      })
    );
  }
  

  public refreshToken(): Observable<{ token: string, refreshToken: string }> {
    const userId = this.getCurrentUserID();
    const refreshToken = this.getRefreshToken();

    if (!userId || !refreshToken) {
      console.error('Refresh token failed: Missing userId or refreshToken');
      this.logout(); // Clear invalid state
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<{ token: string, refreshToken: string }>(
      `${environment.apiUrl}/Authentication/RefreshToken`,
      { userID: userId, refreshToken }
    ).pipe(
      tap(result => {
        if (!result.token || !result.refreshToken) {
          throw new Error('Invalid token response');
        }
        this.setToken(result.token);
        this.setRefreshToken(result.refreshToken);
        console.log('Token refresh successful');
      }),
      catchError(error => {
        console.error('Token refresh failed:', error);
        this.logout(); // Log out user if refresh fails
        return throwError(() => new Error('Session expired. Please log in again.'));
      })
    );
  }

  public isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp * 1000; // Convert to milliseconds
      const isExpired = Date.now() >= expiry;
      if (isExpired) {
        console.log('Token is expired');
      }
      return isExpired;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  }

  public shouldRefreshToken(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp * 1000; // Convert to milliseconds
      const timeUntilExpiry = expiry - Date.now();
      // Refresh if token expires in less than 5 minutes
      const shouldRefresh = timeUntilExpiry < 5 * 60 * 1000;
      if (shouldRefresh) {
        console.log('Token should be refreshed, expires in:', Math.round(timeUntilExpiry / 1000), 'seconds');
      }
      return shouldRefresh;
    } catch (error) {
      console.error('Error checking if token should be refreshed:', error);
      return false;
    }
  }

  public getCurrentUserID(): number | null {
    const user = this.getUser();
    if (user && typeof user.userID === 'number') {
      return user.userID;
    }
    return null;
  }

  public getCurrentUser(): Observable<User> {
    const userId = this.getCurrentUserID();
    if (!userId) {
      return throwError(() => new Error('No user ID found'));
    }
    return this.getUserByID(userId);
  }

  setUser(user: User): void {
    if (!user) {
      console.warn('Attempted to store undefined user');
      return;
    }

    try {
      // Validate user object has required properties
      if (!user.userID) {
        console.warn('User object missing userID, storage may be incomplete', user);
      }

      console.log('Storing user data in sessionStorage:', user);
      const userString = JSON.stringify(user);

      // Verify the string is valid JSON before storing
      JSON.parse(userString); // This will throw if invalid

      sessionStorage.setItem('user', userString);
    } catch (error) {
      console.error('Error storing user data in sessionStorage:', error);
    }
  }

  public getUserByID(id: number): Observable<User> {
    return this.http.get<User>(`${environment.apiUrl}/Authentication/UserInfoByID/${id}`).pipe(
      tap((user) => {
        console.log('Fetched user data:', user);
        if (user) {
          this.setUser(user);
        } else {
          console.warn('API returned empty user object');
        }
      }),
      catchError((error) => {
        console.error('Failed to fetch user details:', error);
        return throwError(() => new Error('Failed to fetch user details.'));
      })
    );
  }

  public logout(): void {
    sessionStorage.clear();
    console.log('User logged out and session data cleared.');
  }


  public isAuthenticated(): boolean {
    return !!this.getToken();
  }

  public getToken(): string | null {
    return sessionStorage.getItem('token');
  }

  private setRefreshToken(refreshToken: string): void {
    sessionStorage.setItem('refreshToken', refreshToken);
  }

  public getRefreshToken(): string | null {
    return sessionStorage.getItem('refreshToken');
  }


  public getUser(): User | null {
    try {
      const user = sessionStorage.getItem('user');
      if (!user) {
        return null;
      }

      const parsedUser = JSON.parse(user);

      // Ensure parsed user is in the correct format
      if (typeof parsedUser !== 'object' || !parsedUser.userID) {
        console.warn('Invalid user data structure in sessionStorage:', parsedUser);
        return null;
      }

      return parsedUser;
    } catch (error) {
      console.error('Error parsing user data from sessionStorage:', error);
      sessionStorage.removeItem('user'); // Remove corrupted data
      return null;
    }
  }

  private setToken(token: string): void {
    if (!token) {
      console.warn('Attempted to store empty token');
      return;
    }
    sessionStorage.setItem('token', token);
  }

  public register(user: RegisterDTO): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/Authentication/Register`, user).pipe(
      catchError((error) => {
        console.error('Registration failed:', error);
        return throwError(() => new Error('Registration failed. Please try again.'));
      })
    );
  }

  // Debug helper to examine session storage contents
  public debugSessionStorage(): void {
    console.log('=== SESSION STORAGE DEBUG ===');
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key) {
        try {
          const value = sessionStorage.getItem(key);
          console.log(`Key: ${key}`);
          console.log(`Raw Value: ${value}`);
          if (value) {
            try {
              const parsed = JSON.parse(value);
              console.log(`Parsed Value:`, parsed);
            } catch (e) {
              console.log(`Not valid JSON: ${onmessage}`);
            }
          }
        } catch (e) {
          console.error(`Error accessing key ${key}:`, e);
        }
      }
    }
    console.log('=== END DEBUG ===');
  }
}
