import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppMap, SharedUser } from '../../models/appMap';
import { SharingService } from '../../services/sharing.service';
import { AuthenticationService } from '../../services/authentication.service';

@Component({
  selector: 'app-map-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './map-details.component.html',
  styleUrls: ['./map-details.component.scss']
})
export class MapDetailsComponent {
  @Input() map!: AppMap;
  @Output() close = new EventEmitter<void>();
  @Output() share = new EventEmitter<AppMap>();

  constructor(
    private sharingService: SharingService,
    private authService: AuthenticationService
  ) {}

  get canShare(): boolean {
    const currentUserId = this.authService.getCurrentUserID();
    if (!currentUserId) return false;

    // Owner can always share
    if (this.map.idUser === currentUserId) return true;

    // Check if user has write permission
    const userAccess = this.map.sharedWith?.find(user => user.userId === currentUserId);
    return userAccess?.permission === 'write';
  }

  getOwnerName(userId: number): string {
    const currentUser = this.authService.getUser();
    if (currentUser && currentUser.userID === userId) {
      return currentUser.userName || currentUser.userEmail || `User ${userId}`;
    }
    return `User ${userId}`;
  }

  openShareDialog(): void {
    this.share.emit(this.map);
  }

  closeDialog(): void {
    this.close.emit();
  }
} 