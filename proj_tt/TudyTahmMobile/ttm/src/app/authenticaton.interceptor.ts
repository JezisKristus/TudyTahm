import {HttpHandlerFn, HttpRequest} from '@angular/common/http';
import {inject} from '@angular/core';
import {AuthenticationService} from './services/authentication.service';

export function authenticationInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) {
  const authService = inject(AuthenticationService);
  const token = authService.getToken();

  if (token) {
    const cloned = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(cloned);
  }

  return next(req);
}
