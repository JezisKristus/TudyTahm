// my-maps.component.ts
import { Component, OnInit } from '@angular/core';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';

@Component({
  selector: 'app-my-maps',
  //imports: [SidebarComponent],
  templateUrl: './my-maps-page.component.ts',
  styleUrls: ['./my-maps-page.component.scss']
})
export class MyMapsPageComponent implements OnInit {
  maps = [
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
