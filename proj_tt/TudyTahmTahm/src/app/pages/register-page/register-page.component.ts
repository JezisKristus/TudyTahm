import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthenticationService } from '../../services/authentication.service';
import { catchError } from 'rxjs';
import { RegisterDTO } from '../../models/register-dto';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    RouterLinkActive,
    NgIf
  ],
  templateUrl: './register-page.component.html',
  styleUrl: './register-page.component.scss'
})
export class RegisterPageComponent {
  form: FormGroup;
  errorMessage: string | null = null;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authentication: AuthenticationService
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      username: ['', Validators.required],
      password: ['', Validators.required],
      passwordRepeat: ['', Validators.required]
    });
  }

  public register(): void {
    this.errorMessage = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.form.value.password !== this.form.value.passwordRepeat) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    const user: RegisterDTO = {
      userName: this.form.value.username,
      userPassword: this.form.value.password,
      userEmail: this.form.value.email,
      userIconPath: ''
    };

    this.loading = true;

    this.authentication.register(user).pipe(
      catchError(error => {
        this.errorMessage = 'Registration failed. Please try again.';
        this.loading = false;
        throw error;
      })
    ).subscribe({
      next: () => this.router.navigate(['/sign-in']),
      error: () => this.loading = false
    });
  }
}
