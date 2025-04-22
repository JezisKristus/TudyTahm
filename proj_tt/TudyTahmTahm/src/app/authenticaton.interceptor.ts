import {HttpHandlerFn, HttpRequest} from '@angular/common/http';
import {inject} from '@angular/core';
import {AuthenticationService} from './services/authentication.service';

export function authenticationInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  const token = inject(AuthenticationService).getToken();

  const newReq = req.clone({
    headers: req.headers.append('Authorization', 'Bearer ' + token),
  });

  return next(newReq);
}

