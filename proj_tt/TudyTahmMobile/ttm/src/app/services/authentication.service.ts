import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import {catchError, map, switchMap, tap} from 'rxjs/operators';
import {SignInDTO} from '../models/sign-in-dto';
import {environment} from '../environments/environment.development';
import {TokenResult, User} from '../models/user';
import { Journey } from '../models/journey';
import { PointDTO } from '../models/point-dto';

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

    console.log('Sending login requests')

    return this.http.post<TokenResult>(`${environment.apiUrl}/Authentication/Login`, credentials).pipe(
      tap({
      next: () => console.log('Request sent with', credentials),
      error: err => console.error('Login request error:', err)
      }),
      switchMap((result: TokenResult) => {
        this.setToken(result.token);
        this.setRefreshToken(result.refreshToken);

        if (!result.userID) {
          console.warn('Login response missing userID. Cannot fetch user.');
          return throwError(() => new Error('User ID missing from login response.'));
        }

        // Fetch user and combine with token
        return this.getUserByID(result.userID).pipe(
          map((user: User) => {
            return { token: result, user };
          })
        );
      }),
      catchError((error) => {
        console.error('Login failed:', error);
        return throwError(() => new Error('Login failed. Please check your credentials and try again.'));
      })
    );
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

  public addPointToJourney(jourID: number, point: PointDTO): Observable<number> {
    return this.http.put<number>(
      `${environment.apiUrl}/AddPointToJourney/${jourID}`,
      point
    );
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


  public getJourneysByUserId(userId: number): Observable<Journey[]> {
  const url = `${environment.apiUrl}/ByUserID/${userId}`;
  return this.http.get<Journey[]>(url);
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
