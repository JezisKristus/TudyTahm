import {Component} from '@angular/core';
import {Router, RouterLink, RouterLinkActive} from '@angular/router';
import {FormBuilder, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {AuthenticationService} from '../../services/authentication.service';
import {catchError} from 'rxjs';
import {RegisterDTO} from '../../models/register-dto';
import {NgIf} from '@angular/common';

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

  public constructor(private fb: FormBuilder, private router: Router, private authentication: AuthenticationService) {
    this.form = this.fb.group({
      email: '',
      username: '',
      password: '',
      passwordRepeat: ''
    });
  }

  public register(): void {
    this.errorMessage = null;

    if (this.form.value.password !== this.form.value.passwordRepeat) {
      this.errorMessage = 'Passwords do not match.';
      console.warn(this.errorMessage);
      return;
    }

    const user: RegisterDTO = {
      userName: this.form.value.username,
      userPassword: this.form.value.password,
      userEmail: this.form.value.email,
      userIconPath: '' // Default or placeholder value
    };

    console.log('Attempting to register user:', user);

    this.authentication.register(user).pipe(
      catchError(error => {
        console.error('Registration failed:', error);
        this.errorMessage = 'Registration failed. Please try again.';
        throw error;
      })
    ).subscribe({
      next: () => {
        console.log('User successfully registered. Redirecting to sign-in page...');
        this.router.navigate(['/sign-in']);
      },
      error: () => {
        console.error('An error occurred during registration.');
        this.errorMessage = 'Registration failed. Please try again.';
      }
    });
  }
}
