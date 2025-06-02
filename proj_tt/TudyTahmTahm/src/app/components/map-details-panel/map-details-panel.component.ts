import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface AppMap {
  mapID: number;
  idUser: number;
  isCustom: boolean;
  mapName: string;
  mapPath: string;
  mapPreviewPath: string;
  description: string;
  sharedWith: SharedUser[];
}

export interface SharedUser {
  userId: number;
  mapId: number;
  userName: string;
  permission: 'read' | 'write' | 'owner';
}

@Component({
  selector: 'app-map-details-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './map-details-panel.component.html',
  styleUrls: ['./map-details-panel.component.css']
})
export class MapDetailsPanelComponent implements OnInit {
  @Input() map: AppMap | null = null;
  @Input() isVisible: boolean = false;
  @Input() currentUserId: number = 0;

  @Output() closePanel = new EventEmitter<void>();
  @Output() shareMap = new EventEmitter<string>();
  @Output() removeSharedUser = new EventEmitter<number>();
  @Output() updateMapDescription = new EventEmitter<string>();

  showShareModal: boolean = false;
  shareEmail: string = '';
  emailError: string = '';
  isEditingDescription: boolean = false;
  tempDescription: string = '';

  ngOnInit() {
    if (this.map) {
      this.tempDescription = this.map.description || '';
    }
  }

  ngOnChanges() {
    if (this.map) {
      this.tempDescription = this.map.description || '';
    }
  }

  closeDetails() {
    this.closePanel.emit();
  }

  openShareModal() {
    this.showShareModal = true;
    this.shareEmail = '';
    this.emailError = '';
  }

  closeShareModal() {
    this.showShareModal = false;
    this.shareEmail = '';
    this.emailError = '';
  }

  onShareSubmit() {
    if (!this.shareEmail.trim()) {
      this.emailError = 'Email is required';
      return;
    }

    if (!this.isValidEmail(this.shareEmail)) {
      this.emailError = 'Please enter a valid email address';
      return;
    }

    // Check if user is already shared with
    if (this.map?.sharedWith.some(user => user.userName.toLowerCase() === this.shareEmail.toLowerCase())) {
      this.emailError = 'Map is already shared with this user';
      return;
    }

    this.shareMap.emit(this.shareEmail);
    this.closeShareModal();
  }

  removeUser(userId: number) {
    if (confirm('Are you sure you want to remove this user\'s access?')) {
      this.removeSharedUser.emit(userId);
    }
  }

  startEditingDescription() {
    this.isEditingDescription = true;
    this.tempDescription = this.map?.description || '';
  }

  saveDescription() {
    this.isEditingDescription = false;
    if (this.tempDescription.trim() !== this.map?.description) {
      this.updateMapDescription.emit(this.tempDescription.trim());
    }
  }

  cancelEditDescription() {
    this.isEditingDescription = false;
    this.tempDescription = this.map?.description || '';
  }

  getPermissionBadgeClass(permission: string): string {
    switch (permission) {
      case 'owner':
        return 'badge-owner';
      case 'write':
        return 'badge-write';
      case 'read':
        return 'badge-read';
      default:
        return 'badge-read';
    }
  }

  getPermissionIcon(permission: string): string {
    switch (permission) {
      case 'owner':
        return 'fas fa-crown';
      case 'write':
        return 'fas fa-edit';
      case 'read':
        return 'fas fa-eye';
      default:
        return 'fas fa-eye';
    }
  }

  canRemoveUser(user: SharedUser): boolean {
    return user.permission !== 'owner' && user.userId !== this.currentUserId;
  }

  private isValidEmail(email: string): boolean {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  }
}
