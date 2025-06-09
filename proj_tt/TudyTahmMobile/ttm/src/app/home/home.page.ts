// import { Component } from '@angular/core';
// import { IonHeader, IonToolbar, IonTitle, IonContent,IonButton } from '@ionic/angular/standalone';

// @Component({
//   selector: 'app-home',
//   templateUrl: 'home.page.html',
//   styleUrls: ['home.page.scss'],
//   imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton],
// })
// export class HomePage {
//   constructor() {}
// }



import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent,IonButton, IonItem, IonLabel, IonInput } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';


@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonItem, IonLabel, IonInput, CommonModule, FormsModule, IonicModule],
})
export class HomePage {
  username = '';
  password = '';

  constructor(private router: Router) {}

  login() {
    if (this.username === 'Beel' && this.password === 'hell666') {
      this.router.navigate(['/map']);
    } else {
      alert('Invalid credentials');
    }
  }
}