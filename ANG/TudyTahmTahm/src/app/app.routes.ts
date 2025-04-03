import { Routes } from '@angular/router';
import {MapPageComponent} from './pages/map-page/map-page.component';
import {SignInPageComponent} from './pages/sign-in-page/sign-in-page.component';

export const routes: Routes = [
  {path: '', component: MapPageComponent },
  {path: 'sign-in', component: SignInPageComponent}
];
