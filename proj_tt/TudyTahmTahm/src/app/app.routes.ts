import {Routes} from '@angular/router';
import {MapPageComponent} from './pages/map-page/map-page.component';
import {SignInPageComponent} from './pages/sign-in-page/sign-in-page.component';
import {RegisterPageComponent} from './pages/register-page/register-page.component';
import {MyMapsPageComponent} from './pages/my-maps-page/my-maps-page.component';
import {MemoriesPageComponent} from './pages/memories-page/memories-page.component';
import {SharedPageComponent} from './pages/shared-page/shared-page.component';
import {SettingsPageComponent} from './pages/settings-page/settings-page.component';
import {JourneyPageComponent} from './pages/journey-page/journey-page.component';
import {authGuard} from './auth.guard';

export const routes: Routes = [
  {path: 'sign-in', component: SignInPageComponent},
  {path: 'my-maps', component: MyMapsPageComponent, canActivate: [authGuard]},
  {path: 'journey/:id', component: JourneyPageComponent, canActivate: [authGuard]},
  {path: 'memories', component: MemoriesPageComponent, canActivate: [authGuard]},
  {path: '', redirectTo: '/my-maps', pathMatch: 'full'},
  {path: 'register', component: RegisterPageComponent},
  {path: 'shared', component: SharedPageComponent, canActivate: [authGuard]},
  {path: 'settings', component: SettingsPageComponent, canActivate: [authGuard]},
  {path: 'map/:mapId', component: MapPageComponent, canActivate: [authGuard]},
];
