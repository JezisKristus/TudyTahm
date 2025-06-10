import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
  IonItem, IonLabel, IonInput, IonSpinner, IonText
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, Subject, takeUntil } from 'rxjs';
import { AuthenticationService } from '../services/authentication.service'; // Adjust path if needed
import { NgIf } from '@angular/common';
import { SignInDTO } from '../models/sign-in-dto';


@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonButton, IonItem, IonLabel, IonInput,
    IonSpinner, IonText,
    CommonModule, FormsModule, IonicModule
  ],
})


export class HomePage {

  form: FormGroup;
  username = '';
  password = '';
  loading = false;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authentication: AuthenticationService
    ) {
      this.form = this.fb.group({
        username: ['', Validators.required],
        password: ['', Validators.required]
      });
  
      if (this.authentication.isAuthenticated()) {
        console.log('User already authenticated. Redirecting to map...');
        this.router.navigate(['/map']);
      }
    }

  login() {
    this.loading = true;
    this.errorMessage = '';

    const body = {
      username: this.username,
      password: this.password
    };

    this.http.post<{ token: string; user: any }>('http://localhost:5010/api/Authentication/Login', body).subscribe({
      next: (res) => {
        this.loading = false;

        console.log('Login successful:', res);

        this.router.navigate(['/map']);
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        if (err.status === 401) {
          this.errorMessage = 'Invalid username or password.';
        } else {
          this.errorMessage = 'Login failed. Please try again.';
        }
      }
    });
  }
}


// import { Component, OnDestroy } from '@angular/core';
// import { Router } from '@angular/router';
// import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
// import { catchError, Subject, takeUntil } from 'rxjs';
// import { AuthenticationService } from '../services/authentication.service'; // Adjust path if needed
// import { NgIf } from '@angular/common';
// import { SignInDTO } from '../models/sign-in-dto';

// @Component({
//   selector: 'app-home',
//   standalone: true,
//   imports: [
//     ReactiveFormsModule,
//     NgIf
//   ],
//   templateUrl: './home.page.html',
//   styleUrls: ['./home.page.scss']
// })
// export class HomePage implements OnDestroy {
//   form: FormGroup;
//   loading = false;
//   errorMessage = '';
//   private destroy$ = new Subject<void>();

//   constructor(
//     private fb: FormBuilder,
//     private router: Router,
//     private authentication: AuthenticationService
//   ) {
//     this.form = this.fb.group({
//       username: ['', Validators.required],
//       password: ['', Validators.required]
//     });

//     if (this.authentication.isAuthenticated()) {
//       console.log('User already authenticated. Redirecting to map...');
//       this.router.navigate(['/map']);
//     }
//   }

//   login(): void {
//     this.errorMessage = '';
//     if (this.form.invalid) {
//       this.errorMessage = 'Please fill in all fields.';
//       return;
//     }

//     this.loading = true;

//     const credentials: SignInDTO = {
//       username: this.form.value.username,
//       password: this.form.value.password
//     };

//     this.authentication.login(credentials).pipe(
//       takeUntil(this.destroy$),
//       catchError((error) => {
//         this.loading = false;
//         this.errorMessage = error?.message || 'Login failed. Please try again.';
//         console.error('Login error:', error);
//         throw error;
//       })
//     ).subscribe({
//       next: ({ token, user }) => {
//         this.loading = false;
//         console.log('Login successful:', token, user);
//         this.authentication.setUser(user); // optional if not already saved in service
//         this.router.navigate(['/map']);
//       },
//       error: () => {
//         this.loading = false;
//       }
//     });
//   }

//   ngOnDestroy(): void {
//     this.destroy$.next();
//     this.destroy$.complete();
//   }
// }
