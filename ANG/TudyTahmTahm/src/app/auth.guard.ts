import {CanActivateFn, Router} from '@angular/router';
import {inject} from '@angular/core';
import {AuthenticationService} from './services/authentication.service';

export const authGuard: CanActivateFn = (route, state) => {
  const service = inject(AuthenticationService);
  const router = inject(Router);

  if (!service.isAuthenticated()) {
    router.navigate([ '/login' ]);
    return false;
  }

  return true;
};
