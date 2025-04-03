import { Component } from '@angular/core';
import {SidebarComponent} from '../../components/sidebar/sidebar.component';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-my-maps-page',
  imports: [SidebarComponent, SidebarComponent, RouterLink],
  templateUrl: './my-maps-page.component.html',
  styleUrl: './my-maps-page.component.scss'
})
export class MyMapsPageComponent {

}
