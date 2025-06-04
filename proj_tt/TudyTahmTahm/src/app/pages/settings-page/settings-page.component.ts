/* settings-page.component.ts */
import {Component, OnInit} from '@angular/core';
import {SidebarComponent} from '../../components/sidebar/sidebar.component';
import {UserSettingsService} from '../../services/user-settings.service';
import {AuthenticationService} from '../../services/authentication.service';
import {User} from '../../models/user';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ChangeUsernameDialogComponent} from '../../components/settings/change-username-dialog';
import {ChangeEmailDialogComponent} from '../../components/settings/change-email-dialog';
import {ChangePasswordDialogComponent} from '../../components/settings/change-password-dialog';
import {ChangeProfilePictureDialogComponent} from '../../components/settings/change-profile-picture-dialog';
import {Router} from '@angular/router';
import {environment} from '../../../environments/environment.development';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [
    SidebarComponent,
    CommonModule,
    FormsModule,
    ChangeUsernameDialogComponent,
    ChangeEmailDialogComponent,
    ChangePasswordDialogComponent,
    ChangeProfilePictureDialogComponent
  ],
  templateUrl: './settings-page.component.html',
  styleUrls: ['./settings-page.component.scss']
})
export class SettingsPageComponent implements OnInit {
  currentUser: User | null = null;

  // flags for dialog visibility
  isUsernameDialogVisible = false;
  isEmailDialogVisible = false;
  isPasswordDialogVisible = false;
  isProfilePictureDialogVisible = false;

  // success message
  showSuccessMessage = false;
  successMessage = '';

  showErrorMessage = false;
  errorMessage = '';

  constructor(
    private userSettingsService: UserSettingsService,
    private authService: AuthenticationService,
    private router: Router
  ) {
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getUser();
    if (!this.currentUser) {
      console.warn('No authenticated user found');
      this.router.navigate(['/sign-in']);
      return;
    }
  }

  /* ===== Save handlers ===== */
  onUsernameSave(newUsername: string): void {
    this.userSettingsService.updateUsername(newUsername)
      .subscribe({
        next: updatedUser => {
          this.currentUser = updatedUser;
          this.showSuccess('Username successfully updated');
        },
        error: err => {
          console.error('Error updating username:', err);
          this.showError(err.message || 'Failed to update username.');
        }
      });
    this.isUsernameDialogVisible = false;
  }

  onPasswordSave(payload: { currentPassword: string; newPassword: string }): void {
    this.userSettingsService.updatePassword(payload.currentPassword, payload.newPassword)
      .subscribe({
        next: () => this.showSuccess('Password successfully updated'),
        error: err => {
          console.error('Error updating password:', err);
          this.showError(err.message || 'Failed to update password.');
        }
      });
    this.isPasswordDialogVisible = false;
  }

  getProfilePictureUrl(path: string | undefined): string {
    if (!path) return '';
    return `${environment.apiUrl}/Image/${encodeURIComponent(path)}`;
  }

  /* ===== Open dialog methods ===== */
  openChangeUsernameDialog(): void {
    this.isUsernameDialogVisible = true;
  }

  openChangeEmailDialog(): void {
    this.isEmailDialogVisible = true;
  }

  openChangePasswordDialog(): void {
    this.isPasswordDialogVisible = true;
  }

  openChangeProfilePictureDialog(): void {
    this.isProfilePictureDialogVisible = true;
  }

  private showError(message: string): void {
    this.errorMessage = message;
    this.showErrorMessage = true;
    setTimeout(() => this.showErrorMessage = false, 5000);
  }


  onEmailSave(newEmail: string): void {
    this.userSettingsService.updateEmail(newEmail)
      .subscribe({
        next: updatedUser => {
          this.currentUser = updatedUser;
          this.showSuccess('Email successfully updated');
        },
        error: err => console.error('Error updating email:', err)
      });
    this.isEmailDialogVisible = false;
  }

  private showSuccess(message: string): void {
    this.errorMessage = '';
    this.successMessage = message;
    this.showSuccessMessage = true;
    setTimeout(() => this.showSuccessMessage = false, 3000);
  }


  onProfilePictureSave(file: File): void {
    this.userSettingsService.updateProfilePicture(file)
      .subscribe({
        next: updatedUser => {
          this.currentUser = updatedUser;
          this.showSuccess('Profile picture successfully updated');
        },
        error: err => console.error('Error updating profile picture:', err)
      });
    this.isProfilePictureDialogVisible = false;
  }
}
