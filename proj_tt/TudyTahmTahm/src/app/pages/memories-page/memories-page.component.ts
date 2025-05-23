import {Component, OnInit} from '@angular/core';
import {CommonModule, NgFor, NgIf} from '@angular/common';
import {Router, RouterLink, RouterLinkActive} from '@angular/router';
import {SidebarComponent} from '../../components/sidebar/sidebar.component';
import {JourneyService} from '../../services/journey.service';
import {Journey} from '../../models/journey';
import {AuthenticationService} from '../../services/authentication.service';
import {finalize} from 'rxjs/operators';

@Component({
  selector: 'app-memories',
  standalone: true,
  imports: [
    CommonModule,
    NgFor,
    NgIf,
    SidebarComponent,
    RouterLinkActive,
    RouterLink
  ],
  templateUrl: './memories-page.component.html',
  styleUrls: ['./memories-page.component.scss']
})
export class MemoriesPageComponent implements OnInit {
  journeys: Journey[] = [];
  loading = true;
  error: string | null = null;
  showDeleteDialog = false;
  journeyToDelete: Journey | null = null;
  deleteInProgress = false;

  constructor(
    private journeyService: JourneyService,
    private router: Router,
    private authService: AuthenticationService // Inject AuthenticationService
  ) {}

  ngOnInit(): void {
    this.loadJourneys();
  }

  loadJourneys(): void {
    this.loading = true;
    this.error = null;

    const userID = this.authService.getCurrentUserID();

    if (!userID) {
      this.error = 'User not logged in. Please log in to view your memories.'; // Replace setError
      return;
    }

    this.journeyService.getJourneyByUserID(userID)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (journeys) => this.journeys = journeys,
        error: (err) => {
          console.error('Failed to fetch journeys:', err);
          this.error = 'Failed to load journeys. Please try again later.'; // Replace setError
        }
      });
  }

  onJourneyClick(journey: Journey): void {
    // Save the entire journey object to sessionStorage
    sessionStorage.setItem('Journey', JSON.stringify(journey));
    sessionStorage.setItem('Journey.journeyID', journey.journeyID.toString());
    console.log('Storing journey data into sessionStorage:', journey);
    // Redirect to journey page
    this.router.navigate(['/journey', journey.journeyID]);
  }

  // Delete journey functionality
  openDeleteConfirmation(journey: Journey): void {
    this.journeyToDelete = journey;
    this.showDeleteDialog = true;
  }

  closeDeleteConfirmation(): void {
    if (!this.deleteInProgress) {
      this.showDeleteDialog = false;
      this.journeyToDelete = null;
    }
  }

  confirmDelete(): void {
    if (this.journeyToDelete && this.journeyToDelete.journeyID && !this.deleteInProgress) {
      this.deleteInProgress = true;

      // Close the dialog immediately
      this.closeDeleteConfirmation();

      this.journeyService.deleteJourney(this.journeyToDelete.journeyID).subscribe({
        next: () => {
          // Remove the deleted journey from the array
          this.journeys = this.journeys.filter(journey => journey.journeyID !== this.journeyToDelete?.journeyID);
          this.deleteInProgress = false;
        },
        error: (err) => {
          console.error('Failed to delete journey:', err);
          this.error = 'Failed to delete journey. Please try again later.';
          this.deleteInProgress = false;
        }
      });
    } else {
      console.error('Invalid journeyID or delete operation already in progress.');
      this.error = 'Invalid journey selected for deletion.';
    }
  }
}
