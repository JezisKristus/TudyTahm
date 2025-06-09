import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppMap } from '../../models/appMap';
import { SharingService } from '../../services/sharing.service';

@Component({
  selector: 'app-share-map-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './share-map-dialog.component.html',
  styleUrls: ['./share-map-dialog.component.scss']
})
export class ShareMapDialogComponent {
  @Input() map!: AppMap;
  @Output() close = new EventEmitter<void>();
  @Output() shareSuccess = new EventEmitter<void>();

  userEmail: string = '';
  selectedPermission: 'read' | 'write' = 'read';
  errorMessage: string = '';

  constructor(private sharingService: SharingService) {}

  isValid(): boolean {
    return !!this.userEmail && !!this.selectedPermission;
  }

  shareMap(): void {
    if (!this.isValid()) return;

    const sharedUser = {
      userID: 0, // This will be set by the backend
      userName: '', // This will be set by the backend
      userEmail: this.userEmail,
      permission: this.selectedPermission
    };

    this.sharingService.addUserToMap(this.map.mapID, sharedUser).subscribe({
      next: () => {
        this.shareSuccess.emit();
        this.closeDialog();
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to share map. Please try again.';
      }
    });
  }

  closeDialog(): void {
    this.close.emit();
  }
} 