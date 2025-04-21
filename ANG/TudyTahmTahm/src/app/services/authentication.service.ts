import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, tap} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  public constructor(private http: HttpClient) {}

  public login(credentials: Credentials): Observable<TokenResult> {
    return this.http.post<TokenResult>('http://localhost:5131/api/Authentication', credentials).pipe(
      tap(result => this.setToken(result.token))
    );
  }

  public logout(): void {
    sessionStorage.removeItem('token');
  }

  public isAuthenticated(): boolean {
    return !!this.getToken();
  }


  public getToken(): string|null {
    return sessionStorage.getItem('token');
  }

  private setToken(token: string): void {
    sessionStorage.setItem('token', token);
  }
}


class Credentials {
  public username: string = '';
  public password: string = '';
}

class TokenResult {
  public token: string = '';
}

