import { Component, OnDestroy } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from "@angular/router";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, Subject, takeUntil } from 'rxjs';
import { AuthenticationService } from '../../services/authentication.service';
import { NgIf } from '@angular/common';
import { SignInDTO } from '../../models/sign-in-dto';
import { TokenResult } from '../../models/user';

@Component({
  selector: 'app-sign-in-page',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    ReactiveFormsModule,
    NgIf
  ],
  templateUrl: './sign-in-page.component.html',
  styleUrl: './sign-in-page.component.scss'
})
export class SignInPageComponent implements OnDestroy {
  form: FormGroup;
  message: boolean = false;
  loading: boolean = false;

  // For unsubscribing from observables when component is destroyed
  private destroy$ = new Subject<void>();

  public constructor(
    private fb: FormBuilder,
    private router: Router,
    private authentication: AuthenticationService
  ) {
    this.form = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });

    // Check for existing login to avoid session storage issues
    if (this.authentication.isAuthenticated()) {
      console.log('User already authenticated. Redirecting to home...');
      this.router.navigate(['/']);
    }
  }

  public save(): void {
    this.message = false;
    this.loading = true; // Show loading spinner

    const credentials: SignInDTO = {
      username: this.form.value.username,
      password: this.form.value.password
    };

    this.authentication.login(credentials).pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        console.error('Login failed:', error);
        this.message = true;
        this.loading = false; // Hide loading spinner on error
        throw error;
      })
    ).subscribe({
      next: (result: TokenResult) => {
        console.log('User successfully logged in. Redirecting...');
        this.loading = false; // Hide loading spinner on success

        // Ensure we have consistent storage - debug any issues that might occur
        try {
          // Check what was stored by the service
          const storedUser = this.authentication.getUser();
          console.log('User from authentication service:', storedUser);

          if (!storedUser || !storedUser.userID) {
            console.warn('User data is missing or incomplete. Attempting to fix...');
            // Fallback: If the service didn't store the data correctly, store it here
            if (result && result.userID) {
              this.authentication.getUserByID(result.userID).subscribe({
                next: (user) => {
                  console.log('Successfully retrieved user details:', user);
                  // Navigate after ensuring user data is stored
                  this.router.navigate(['/']);
                },
                error: (err) => {
                  console.error('Failed to retrieve user details:', err);
                  // Navigate anyway, but there might be issues
                  this.router.navigate(['/']);
                }
              });
            } else {
              console.error('Token result missing userID. Cannot fetch user details.');
              this.router.navigate(['/']);
            }
          } else {
            // User data exists, proceed with navigation
            this.router.navigate(['/']);
          }
        } catch (error) {
          console.error('Error handling login response:', error);
          // Navigate anyway
          this.router.navigate(['/']);
        }
      },
      error: () => {
        this.loading = false; // Extra safety to ensure the spinner is hidden
        console.error('An error occurred during login.');
      }
    });
  }

  ngOnDestroy(): void {
    // Unsubscribe from all observables
    this.destroy$.next();
    this.destroy$.complete();
  }
}
