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
        this.loading = false;
        throw error;
      })
    ).subscribe({
      next: ({ token, user }) => {
        console.log('Login and user fetch successful:', token, user);
        this.loading = false;

        // User is already stored in getUserByID via tap, but you can store explicitly too:
        this.authentication.setUser(user); // Optional if already set in getUserByID

        this.router.navigate(['/my-maps']);
      },
      error: () => {
        this.loading = false;
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
