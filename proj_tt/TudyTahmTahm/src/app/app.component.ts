import {Component} from '@angular/core';
import {RouterOutlet} from '@angular/router';

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
