import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment.development';

@Component({
  selector: 'app-change-profile-picture-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  template: `
    <div class="dialog-overlay" *ngIf="isVisible" (click)="onOverlayClick($event)">
      <div class="dialog-container">
        <div class="dialog-header">
          <h2>Change Profile Picture</h2>
          <button class="close-btn" (click)="onCancel()">&times;</button>
        </div>
        <div class="dialog-content">
          <div class="current-image-container" *ngIf="currentImagePath">
            <p>Current profile picture:</p>
            <div class="current-image" [style.background-image]="'url(' + getProfilePictureUrl(currentImagePath) + ')'"></div>
          </div>

          <div class="preview-container" *ngIf="imagePreviewUrl">
            <p>New profile picture preview:</p>
            <div class="image-preview" [style.background-image]="'url(' + imagePreviewUrl + ')'"></div>
          </div>

          <div class="file-upload">
            <label for="profilePicture" class="file-upload-label">
              <span>Select New Image</span>
            </label>
            <input
              type="file"
              id="profilePicture"
              (change)="onFileSelected($event)"
              accept="image/*"
            >
            <div class="selected-file" *ngIf="selectedFile">
              {{ selectedFile.name }}
            </div>
          </div>
        </div>
        <div class="dialog-actions">
          <button class="cancel-btn" (click)="onCancel()">Cancel</button>
          <button
            class="save-btn"
            [disabled]="!selectedFile"
            (click)="onSave()"
          >Save</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dialog-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .dialog-container {
      background-color: var(--primary-green);
      border-radius: 8px;
      width: 500px;
      max-width: 90%;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      overflow: hidden;
      border: 2px solid var(--gold);
    }

    .dialog-header {
      padding: 16px;
      background-color: var(--dark-green);
      color: var(--gold);
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--gold);
    }

    .dialog-header h2 {
      margin: 0;
      font-size: 20px;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      color: var(--gold);
      cursor: pointer;
    }

    .dialog-content {
      padding: 16px;
      color: var(--white);
    }

    .current-image-container,
    .preview-container {
      margin-bottom: 20px;
      text-align: center;
    }

    .current-image,
    .image-preview {
      width: 150px;
      height: 150px;
      border-radius: 50%;
      background-size: cover;
      background-position: center;
      margin: 0 auto;
      border: 2px solid var(--gold);
    }

    .file-upload {
      margin-top: 20px;
      text-align: center;
    }

    .file-upload input[type="file"] {
      display: none;
    }

    .file-upload-label {
      display: inline-block;
      padding: 10px 20px;
      background-color: var(--dark-green);
      color: var(--gold);
      border: 1px solid var(--gold);
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
      transition: background-color 0.3s;
    }

    .file-upload-label:hover {
      background-color: rgba(0, 0, 0, 0.3);
    }

    .selected-file {
      margin-top: 10px;
      font-size: 14px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .dialog-actions {
      padding: 16px;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      border-top: 1px solid var(--dark-green);
    }

    .cancel-btn, .save-btn {
      padding: 8px 16px;
      border-radius: 4px;
      border: none;
      cursor: pointer;
      font-weight: bold;
    }

    .cancel-btn {
      background-color: transparent;
      border: 1px solid var(--gold);
      color: var(--gold);
    }

    .save-btn {
      background-color: var(--gold);
      color: var(--dark-green);
    }

    .save-btn:disabled {
      background-color: #cccccc;
      color: #666666;
      cursor: not-allowed;
    }
  `]
})
export class ChangeProfilePictureDialogComponent implements OnInit {
  @Input() isVisible: boolean = false;
  @Input() currentImagePath: string = '';
  @Output() cancel = new EventEmitter<void>();
  @Output() save = new EventEmitter<File>();

  selectedFile: File | null = null;
  imagePreviewUrl: string | null = null;

  ngOnInit(): void {
    // Initialize dialog
  }

  getProfilePictureUrl(path: string): string {
    if (!path) return '';
    // Handle local file path format (L\pfp\...)
    if (path.startsWith('L\\')) {
      return `${environment.apiUrl}/Image/${encodeURIComponent(path)}`;
    }
    // Handle regular path format
    return `${environment.apiUrl}/Image/${encodeURIComponent(path)}`;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];

      // Create preview URL
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreviewUrl = reader.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  onCancel(): void {
    this.selectedFile = null;
    this.imagePreviewUrl = null;
    this.cancel.emit();
  }

  onSave(): void {
    if (this.selectedFile) {
      this.save.emit(this.selectedFile);
      this.selectedFile = null;
      this.imagePreviewUrl = null;
    }
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).className === 'dialog-overlay') {
      this.onCancel();
    }
  }
}
