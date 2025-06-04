import {Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, ViewChild, ElementRef, Renderer2, AfterViewInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {AppMap, SharedUser} from '../../models/appMap';
import {ShareConfig} from 'rxjs';
import {SharingService} from '../../services/sharing.service';

@Component({
  selector: 'app-map-details-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './map-details-panel.component.html',
  styleUrls: ['./map-details-panel.component.scss']
})
export class MapDetailsPanelComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() map: AppMap | null = null;
  @Input() isVisible: boolean = false;
  @Input() currentUserId: number = 0;

  @Output() closePanel = new EventEmitter<void>();
  @Output() shareMap = new EventEmitter<{email: string, permission: string}>();
  @Output() removeSharedUser = new EventEmitter<number>();
  @Output() updateMapDescription = new EventEmitter<string>();

  @ViewChild('panel') panel!: ElementRef;

  showShareModal: boolean = false;
  shareEmail: string = '';
  sharePermission: string = 'read';
  emailError: string = '';
  isEditingDescription: boolean = false;
  tempDescription: string = '';

  private panelInitialized = false;

  constructor(private renderer: Renderer2, private sharingService: SharingService) {}

  ngOnInit(): void {
    console.log('Map details panel initialized');
    console.log('Initial map data:', this.map);
    console.log('Initial visibility:', this.isVisible);
    if (this.map) {
      this.tempDescription = this.map.description || '';
    }
  }

  ngAfterViewInit(): void {
    console.log('Panel view initialized');
    this.panelInitialized = true;
    // Apply initial visibility state
    if (this.isVisible) {
      this.showPanel();
    } else {
      this.hidePanel();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('Map details panel changes:', changes);
    if (changes['isVisible'] && this.panelInitialized) {
      console.log('Visibility changed to:', this.isVisible);
      if (this.isVisible) {
        this.showPanel();
      } else {
        this.hidePanel();
      }
    }
    if (changes['map'] && changes['map'].currentValue) {
      this.tempDescription = this.map?.description || '';
    }
  }

  private showPanel(): void {
    if (!this.panelInitialized || !this.panel?.nativeElement) {
      console.log('Panel not ready for showing');
      return;
    }
    console.log('Showing panel');
    this.renderer.setStyle(this.panel.nativeElement, 'transform', 'translateX(0)');
    this.renderer.setStyle(this.panel.nativeElement, 'opacity', '1');
    this.renderer.setStyle(this.panel.nativeElement, 'visibility', 'visible');
    this.renderer.setStyle(this.panel.nativeElement, 'pointer-events', 'auto');
  }

  private hidePanel(): void {
    if (!this.panelInitialized || !this.panel?.nativeElement) {
      console.log('Panel not ready for hiding');
      return;
    }
    console.log('Hiding panel');
    this.renderer.setStyle(this.panel.nativeElement, 'transform', 'translateX(100%)');
    this.renderer.setStyle(this.panel.nativeElement, 'opacity', '0');
    this.renderer.setStyle(this.panel.nativeElement, 'visibility', 'hidden');
    this.renderer.setStyle(this.panel.nativeElement, 'pointer-events', 'none');
  }

  get mapName(): string {
    return this.map?.mapName || 'Unnamed Map';
  }

  get mapDescription(): string {
    return this.map?.description || 'No description available';
  }

  get mapPreviewPath(): string {
    return this.map?.mapPreviewPath || '';
  }

  get sharedWith(): SharedUser[] {
    return this.map?.sharedWith || [];
  }

  closeDetails(): void {
    this.closePanel.emit();
  }

  openShareModal(): void {
    this.showShareModal = true;
    this.shareEmail = '';
    this.sharePermission = 'read';
    this.emailError = '';
  }

  closeShareModal(): void {
    this.showShareModal = false;
  }

  onShareSubmit(): void {
    if (!this.shareEmail) {
      this.emailError = 'Email is required';
      return;
    }

    if (!this.validateEmail(this.shareEmail)) {
      this.emailError = 'Invalid email format';
      return;
    }

    this.shareMap.emit({
      email: this.shareEmail,
      permission: this.sharePermission
    });
    this.closeShareModal();
  }

  private validateEmail(email: string): boolean {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(email);
  }

  removeUser(userId: number): void {
    this.removeSharedUser.emit(userId);
  }

  canRemoveUser(user: SharedUser): boolean {
    return this.currentUserId === this.map?.idUser;
  }

  getPermissionIcon(permission: string): string {
    switch (permission.toLowerCase()) {
      case 'owner':
        return 'fas fa-crown';
      case 'write':
        return 'fas fa-edit';
      case 'read':
        return 'fas fa-eye';
      default:
        return 'fas fa-user';
    }
  }

  getPermissionBadgeClass(permission: string): string {
    switch (permission.toLowerCase()) {
      case 'owner':
        return 'badge-owner';
      case 'write':
        return 'badge-write';
      case 'read':
        return 'badge-read';
      default:
        return '';
    }
  }

  startEditingDescription(): void {
    this.isEditingDescription = true;
    this.tempDescription = this.map?.description || '';
  }

  saveDescription(): void {
    if (this.tempDescription !== this.map?.description) {
      this.updateMapDescription.emit(this.tempDescription);
    }
    this.isEditingDescription = false;
  }

  cancelEditDescription(): void {
    this.isEditingDescription = false;
    this.tempDescription = this.map?.description || '';
  }
}

