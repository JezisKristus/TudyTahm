import { Component, OnInit } from '@angular/core';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { NgFor } from '@angular/common';
import {RouterLink, RouterLinkActive} from '@angular/router';

@Component({
  selector: 'app-memories',
  standalone: true,
  imports: [SidebarComponent, NgFor, RouterLink, RouterLinkActive],
  templateUrl: './memories-page.component.html',
  styleUrls: ['./memories-page.component.scss']
})
export class MemoriesPageComponent implements OnInit {
  journeys = [
    { id: 1, title: 'Journey' },
    { id: 2, title: 'Journey' },
    { id: 3, title: 'Journey' },
    { id: 4, title: 'Journey' }
  ];

  constructor() { }

  ngOnInit(): void {
  }

  addNewJourney(): void {
    // Logic to add a new journey
    console.log('Adding new journey');
  }
}
