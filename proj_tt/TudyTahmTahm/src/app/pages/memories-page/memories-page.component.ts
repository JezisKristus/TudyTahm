import {Component, OnInit} from '@angular/core';
import {SidebarComponent} from '../../components/sidebar/sidebar.component';
import {NgFor} from '@angular/common';
import {RouterLink, RouterLinkActive} from '@angular/router';
import {JourneyService} from '../../services/journey.service'; // Import JourneyService
import {Journey} from '../../models/journey'; // Import Journey model

@Component({
  selector: 'app-memories',
  standalone: true,
  imports: [SidebarComponent, NgFor, RouterLink, RouterLinkActive],
  templateUrl: './memories-page.component.html',
  styleUrls: ['./memories-page.component.scss']
})
export class MemoriesPageComponent implements OnInit {
  journeys: Journey[] = []; // Use Journey model for the array

  constructor(private journeyService: JourneyService) { } // Inject JourneyService

  ngOnInit(): void {
    this.loadJourneys(); // Fetch journeys on initialization
  }

  loadJourneys(): void {
    const userID = Number(sessionStorage.getItem('userID')); // Get userID from sessionStorage
    if (!userID) {
      console.error('User ID not found in sessionStorage');
      return;
    }

    this.journeyService.getJourneyByUserID(userID).subscribe({
      next: (data) => this.journeys = data,
      error: (err) => console.error('Failed to load journeys', err)
    });
  }

  addNewJourney(): void {
    // Logic to add a new journey
    console.log('Adding new journey');
  }
}
