import {Component} from '@angular/core';
import {AuthenticationService} from './services/authentication.service';
import {Router, RouterOutlet} from '@angular/router';
import {NgIf} from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  imports: [
    RouterOutlet, NgIf
  ],
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'TudyTahmTahm';
  public constructor(private router: Router,
                     private authentication: AuthenticationService) {
  }

  public get authenticated(): boolean {
    return this.authentication.isAuthenticated();
  }

  public logout(): void {
    this.authentication.logout();
    this.router.navigate([ '/sign-in' ]);
  }
}
