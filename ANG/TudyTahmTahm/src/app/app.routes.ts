import { Routes } from '@angular/router';
import {MapPageComponent} from './pages/map-page/map-page.component';
import {SignInPageComponent} from './pages/sign-in-page/sign-in-page.component';
import {RegisterPageComponent} from './pages/register-page/register-page.component';
import {MyMapsPageComponent} from './pages/my-maps-page/my-maps-page.component';

export const routes: Routes = [
  {path: '', component: MapPageComponent },
  {path: 'sign-in', component: SignInPageComponent},
  {path: 'register', component: RegisterPageComponent},
  {path: 'my-maps', component: MyMapsPageComponent}
];
