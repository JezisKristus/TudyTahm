import { Component } from '@angular/core';
import {Router, RouterOutlet} from '@angular/router';
import { AuthenticationService } from './services/authentication.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  imports: [
    RouterOutlet
  ],
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'TudyTahmTahm';
  /*public constructor(private router: Router,
                     private authentication: AuthenticationService) {
  }*/
}
