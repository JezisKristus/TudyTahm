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
  username = '';
  password = '';
  loading = false;
  errorMessage: string = '';

  constructor(private router: Router, private http: HttpClient) {}

  login() {
    this.loading = true;
    this.errorMessage = '';

    const body = {
      username: this.username,
      password: this.password
    };

    this.http.post<{ token: string; user: any }>('http://localhost:5000/api/auth/login', body).subscribe({
      next: (res) => {
        this.loading = false;

        // TODO: Save token/user in storage or service if needed
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
