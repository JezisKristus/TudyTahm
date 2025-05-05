import {Component} from '@angular/core';
import {Router, RouterLink, RouterLinkActive} from '@angular/router';
import {NgIf, NgOptimizedImage} from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  imports: [
    RouterLink,
    RouterLinkActive,
    NgOptimizedImage,
    NgIf
  ]
})
export class SidebarComponent {
  showSignOutPopup = false;

  constructor(private router: Router) {
  }

  toggleSignOutPopup(): void {
    this.showSignOutPopup = !this.showSignOutPopup;
  }

  signOut(): void {
    // Clear session storage and navigate to the sign-in page
    sessionStorage.clear();
    this.router.navigate(['/sign-in']);

  }
}
