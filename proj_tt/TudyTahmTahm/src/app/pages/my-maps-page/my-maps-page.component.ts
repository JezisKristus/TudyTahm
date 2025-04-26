// my-maps-page.component.ts
import {Component, OnInit} from '@angular/core';
import {SidebarComponent} from '../../components/sidebar/sidebar.component';
import {NgFor} from '@angular/common';
import {RouterLink, RouterLinkActive} from '@angular/router';

@Component({
  selector: 'app-my-maps',
  standalone: true,
  imports: [SidebarComponent, NgFor, RouterLinkActive, RouterLink],
  templateUrl: './my-maps-page.component.html',
  styleUrls: ['./my-maps-page.component.scss']
})
export class MyMapsPageComponent implements OnInit {
  maps = [
    { id: 0, name: 'Real world (boring)'},
    { id: 1, name: 'Map name' },
    { id: 2, name: 'Map name' },
    { id: 3, name: 'Map name' }
  ];

  constructor() { }

  ngOnInit(): void {
  }

  addNewMap(): void {
    // Logic to add a new map
    console.log('Adding new map');
  }
}
