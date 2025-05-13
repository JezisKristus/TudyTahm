import {Component, OnInit} from '@angular/core';
import {CommonModule, NgFor, NgIf} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Router, RouterLink, RouterLinkActive} from '@angular/router';
import {SidebarComponent} from '../../components/sidebar/sidebar.component';
import {JourneyService} from '../../services/journey.service';
import {Journey} from '../../models/journey';
import {finalize} from 'rxjs/operators';

@Component({
  selector: 'app-memories',
  standalone: true,
  imports: [
    CommonModule,
    NgFor,
    NgIf,
    FormsModule,
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
  showAddJourneyDialog = false;
  showDeleteDialog = false;
  journeyToDelete: Journey | null = null;
  deleteInProgress = false;
  newJourney: Partial<Journey> = {
    name: ''
  };

  constructor(
    private journeyService: JourneyService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadJourneys();
  }

  loadJourneys(): void {
    this.loading = true;
    const userID = Number(sessionStorage.getItem('userID'));

    if (!userID) {
      this.error = 'User not logged in. Please log in to view your memories.';
      this.loading = false;
      return;
    }

    this.journeyService.getJourneyByUserID(userID)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (journeys) => {
          this.journeys = journeys;
        },
        error: (err) => {
          console.error('Failed to fetch journeys:', err);
          this.error = 'Failed to load journeys. Please try again later.';
        }
      });
  }

  addNewJourney(): void {
    this.showAddJourneyDialog = true;
    this.newJourney = { name: '' }; // Reset the form
  }

  onDialogClose(): void {
    this.showAddJourneyDialog = false;
  }

  onCreateJourney(): void {
    if (!this.newJourney.name) {
      return;
    }

    const userID = Number(sessionStorage.getItem('userID'));
    if (!userID) {
      this.error = 'User not logged in. Please log in to create a journey.';
      return;
    }

    const journeyToCreate: Journey = {
      journeyID: 0, // Will be assigned by the server
      name: this.newJourney.name,
      description : this.newJourney.description || '',
      IDUser: userID,
      IDMap: 0, // TODO vážně chceme tahat z mapID? to jako z poslední otevřený mapy? nebylo by jednodušší přes to userID?
      imagePath: '' // Default empty or you could add a default image path
    };

    this.journeyService.createJourney(journeyToCreate).subscribe({
      next: () => {
        this.showAddJourneyDialog = false;
        this.loadJourneys(); // Reload all journeys after creating a new one
      },
      error: (err) => {
        console.error('Failed to create journey:', err);
        this.error = 'Failed to create journey. Please try again later.';
      }
    });
  }

  onJourneyClick(journey: Journey): void {
    sessionStorage.setItem('Journey', JSON.stringify(journey));
    sessionStorage.setItem('Journey.journeyID', journey.journeyID.toString());
    console.log('Storing journey data into sessionStorage:', journey);
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
