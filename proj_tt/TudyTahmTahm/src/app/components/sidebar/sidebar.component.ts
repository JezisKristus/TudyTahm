import {Component, OnInit} from '@angular/core';
import {Router, RouterLink, RouterLinkActive} from '@angular/router';
import {AuthenticationService} from '../../services/authentication.service';
import {NgIf, NgOptimizedImage} from '@angular/common';
import { User } from '../../models/user';
import { environment } from '../../../environments/environment.development';

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
export class SidebarComponent implements OnInit {
  showSignOutPopup = false;
  currentUser: User | null = null;

  constructor(private router: Router, private authService: AuthenticationService) {
  }

  ngOnInit(): void {
    this.currentUser = this.getCurrentUser();
  }

  getProfilePictureUrl(path: string | undefined): string {
    if (!path) return '';

    // Remove the 'L\' prefix if it exists and encode the path
    const cleanPath = path.startsWith('L\\') ? path.substring(2) : path;
    return `${environment.apiUrl}/Image/${encodeURIComponent(cleanPath)}`;
  }

  get userBackgroundImage(): string {
    const path = this.currentUser?.userIconPath;
    return path ? `url(${this.getProfilePictureUrl(path)})` : 'none';
  }

  toggleSignOutPopup(): void {
    this.showSignOutPopup = !this.showSignOutPopup;
  }

  signOut(): void {
    // Clear session storage and navigate to the sign-in page
    sessionStorage.clear();
    this.router.navigate(['/sign-in']);
  }

  getCurrentUser(): User | null {
    return this.authService.getUser();
  }
}
