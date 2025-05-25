import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppMap, SharedUser } from '../../models/appMap';

@Component({
  selector: 'app-map-details-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './map-details-panel.component.html',
  styleUrls: ['./map-details-panel.component.scss']
})
export class MapDetailsPanelComponent implements OnChanges {
  @Input() map: AppMap | null = null;
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() share = new EventEmitter<{userId: string, accessLevel: string}>();
  @Output() removeUser = new EventEmitter<SharedUser>();
  @Output() updateMap = new EventEmitter<{name?: string, description?: string}>();

  @HostBinding('class.open') get isPanelOpen() {
    return this.isOpen;
  }

  newUserId = '';
  selectedAccessLevel = 'read';
  editedName = '';
  editedDescription = '';

  get isOwner(): boolean {
    return this.map?.idUser === /* current user id */ 1; // TODO: Replace with actual current user id
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['map'] && changes['map'].currentValue) {
      this.editedName = this.map?.mapName || '';
      this.editedDescription = this.map?.description || '';
    }
  }

  onClose(): void {
    this.close.emit();
  }

  onShare(): void {
    if (this.newUserId.trim()) {
      this.share.emit({
        userId: this.newUserId,
        accessLevel: this.selectedAccessLevel
      });
      this.newUserId = '';
      this.selectedAccessLevel = 'read';
    }
  }

  onRemoveUser(user: SharedUser): void {
    const confirmRemove = window.confirm(`Do you really want to remove "${user.userName}" from this map?`);
    
    if (confirmRemove) {
      this.removeUser.emit(user);
    }
  }

  onNameChange(): void {
    if (this.editedName.trim() !== this.map?.mapName) {
      this.updateMap.emit({ name: this.editedName.trim() });
    }
  }

  onDescriptionChange(): void {
    if (this.editedDescription !== this.map?.description) {
      this.updateMap.emit({ description: this.editedDescription });
    }
  }

  canRemoveUser(user: SharedUser): boolean {
    return this.isOwner && user.accessLevel !== 'owner';
  }
}