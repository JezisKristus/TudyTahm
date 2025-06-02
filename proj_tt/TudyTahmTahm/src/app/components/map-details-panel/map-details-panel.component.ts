import {Component, Input, Output, EventEmitter, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {SharedUser} from '../../models/appMap';
import {ShareConfig} from 'rxjs';

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

@Component({
  selector: 'app-map-details-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './map-details-panel.component.html',
  styleUrls: ['./map-details-panel.component.scss']
})
export class MapDetailsPanelComponent implements OnInit {
  @Input() map: AppMap | null = null;
  @Input() isVisible: boolean = false;
  @Input() currentUserId: number = 0;

  @Output() closePanel = new EventEmitter<void>();
  @Output() shareMap = new EventEmitter<SharedUser>();
  @Output() removeSharedUser = new EventEmitter<number>();
  @Output() updateMapDescription = new EventEmitter<string>();

  showShareModal: boolean = false;
  shareEmail: string = '';
  emailError: string = '';
  isEditingDescription: boolean = false;
  tempDescription: string = '';
  sharePermission: 'read' | 'write' = 'read';

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
    this.sharePermission = 'read';  // reset permission when modal opens
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

    if (this.map?.sharedWith.some(user => user.userEmail.toLowerCase() === this.shareEmail.toLowerCase())) {
      this.emailError = 'Map is already shared with this user';
      return;
    }

    const newSharedUser: SharedUser = {
      userEmail: this.shareEmail,
      userId: 0,  // or assign appropriately
      userName: '',
      mapId: this.map!.mapID,
      permission: this.sharePermission  // assign selected permission here
    };

    this.shareMap.emit(newSharedUser);
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
