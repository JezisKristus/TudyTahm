import {HttpHandlerFn, HttpRequest, HttpErrorResponse} from '@angular/common/http';
import {inject} from '@angular/core';
import {AuthenticationService} from './services/authentication.service';
import {catchError, switchMap, throwError} from 'rxjs';

export function authenticationInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) {
  const authService = inject(AuthenticationService);
  const token = authService.getToken();

  // If no token, just proceed with the request
  if (!token) {
    return next(req);
  }

  // Check if token needs refresh
  if (authService.shouldRefreshToken()) {
    return authService.refreshToken().pipe(
      switchMap(() => {
        // After successful refresh, retry the original request with new token
        const newToken = authService.getToken();
        const cloned = req.clone({
          headers: req.headers.set('Authorization', `Bearer ${newToken}`)
        });
        return next(cloned);
      }),
      catchError((error) => {
        // If refresh fails, let the error propagate
        return throwError(() => error);
      })
    );
  }

  // If token is still valid, proceed with the request
  const cloned = req.clone({
    headers: req.headers.set('Authorization', `Bearer ${token}`)
  });
  return next(cloned);
}
