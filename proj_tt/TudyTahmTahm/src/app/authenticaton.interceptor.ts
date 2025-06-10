import {HttpHandlerFn, HttpRequest, HttpErrorResponse, HttpInterceptorFn} from '@angular/common/http';
import {inject} from '@angular/core';
import {AuthenticationService} from './services/authentication.service';
import {catchError, switchMap, throwError} from 'rxjs';

export const authenticationInterceptor: HttpInterceptorFn = (req, next) => {
  console.log('[Interceptor] Intercepting request:', req.url);

  const authService = inject(AuthenticationService);
  const token = authService.getToken();

  if (!token) {
    console.log('[Interceptor] No token, passing request without auth header.');
    return next(req);
  }

  // Log token details for debugging
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('[Interceptor] Token payload:', {
      userId: payload.userID,
      expires: new Date(payload.exp * 1000).toISOString(),
      currentTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Interceptor] Error parsing token:', error);
  }

  // Check if token is expired
  if (authService.isTokenExpired()) {
    console.log('[Interceptor] Token is expired, attempting refresh...');
    return authService.refreshToken().pipe(
      switchMap(() => {
        const newToken = authService.getToken();
        if (!newToken) {
          console.error('[Interceptor] Failed to get new token after refresh');
          return throwError(() => new Error('Authentication failed'));
        }
        const cloned = req.clone({
          headers: req.headers.set('Authorization', `Bearer ${newToken}`)
        });
        console.log('[Interceptor] Using new token after refresh');
        return next(cloned);
      }),
      catchError((error) => {
        console.error('[Interceptor] Token refresh failed:', error);
        authService.logout(); // Ensure user is logged out on refresh failure
        return throwError(() => error);
      })
    );
  }

  // Check if token should be refreshed
  if (authService.shouldRefreshToken()) {
    console.log('[Interceptor] Token needs refresh, refreshing...');
    return authService.refreshToken().pipe(
      switchMap(() => {
        const newToken = authService.getToken();
        if (!newToken) {
          console.error('[Interceptor] Failed to get new token after refresh');
          return throwError(() => new Error('Authentication failed'));
        }
        const cloned = req.clone({
          headers: req.headers.set('Authorization', `Bearer ${newToken}`)
        });
        console.log('[Interceptor] Using new token after proactive refresh');
        return next(cloned);
      }),
      catchError((error) => {
        console.error('[Interceptor] Token refresh failed:', error);
        authService.logout(); // Ensure user is logged out on refresh failure
        return throwError(() => error);
      })
    );
  }

  const cloned = req.clone({
    headers: req.headers.set('Authorization', `Bearer ${token}`)
  });
  console.log('[Interceptor] Added Authorization header with existing token');
  return next(cloned).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        console.log('[Interceptor] Received 401, attempting token refresh...');
        return authService.refreshToken().pipe(
          switchMap(() => {
            const newToken = authService.getToken();
            if (!newToken) {
              console.error('[Interceptor] Failed to get new token after refresh');
              return throwError(() => new Error('Authentication failed'));
            }
            const cloned = req.clone({
              headers: req.headers.set('Authorization', `Bearer ${newToken}`)
            });
            console.log('[Interceptor] Retrying request with new token');
            return next(cloned);
          }),
          catchError((refreshError) => {
            console.error('[Interceptor] Token refresh failed:', refreshError);
            authService.logout(); // Ensure user is logged out on refresh failure
            return throwError(() => refreshError);
          })
        );
      }
      return throwError(() => error);
    })
  );
};
