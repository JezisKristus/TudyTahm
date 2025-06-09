import { Routes } from '@angular/router';
import { HomePage } from './home/home.page';
import { MapPage } from './map/map.page';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    component: HomePage
  },
  {
    path: 'map',
    component: MapPage
  }
];