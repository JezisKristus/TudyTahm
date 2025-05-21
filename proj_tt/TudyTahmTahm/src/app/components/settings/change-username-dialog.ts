import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-change-username-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  template: `
    <div class="dialog-overlay" *ngIf="isVisible" (click)="onOverlayClick($event)">
      <div class="dialog-container">
        <div class="dialog-header">
          <h2>Change Username</h2>
          <button class="close-btn" (click)="onCancel()">&times;</button>
        </div>
        <div class="dialog-content">
          <p>Current username: <strong>{{ currentUsername }}</strong></p>
          <div class="form-group">
            <label for="newUsername">New Username</label>
            <input
              id="newUsername"
              type="text"
              [(ngModel)]="newUsername"
              required
              minlength="3"
              #usernameInput="ngModel"
              [class.invalid]="usernameInput.invalid && (usernameInput.dirty || usernameInput.touched)"
            >
            <div class="error-message" *ngIf="usernameInput.invalid && (usernameInput.dirty || usernameInput.touched)">
              Username must be at least 3 characters long
            </div>
          </div>
        </div>
        <div class="dialog-actions">
          <button class="cancel-btn" (click)="onCancel()">Cancel</button>
          <button
            class="save-btn"
            [disabled]="!newUsername || newUsername.length < 3"
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
      width: 400px;
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

    .form-group {
      margin-bottom: 16px;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-weight: bold;
    }

    .form-group input {
      width: 100%;
      padding: 10px;
      border-radius: 4px;
      border: 1px solid var(--dark-green);
      background-color: rgba(255, 255, 255, 0.1);
      color: var(--white);
    }

    .form-group input:focus {
      outline: none;
      border-color: var(--gold);
    }

    .form-group input.invalid {
      border-color: #f44336;
    }

    .error-message {
      color: #f44336;
      font-size: 14px;
      margin-top: 4px;
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
export class ChangeUsernameDialogComponent implements OnInit {
  @Input() isVisible: boolean = false;
  @Input() currentUsername?: string;
  @Output() cancel = new EventEmitter<void>();
  @Output() save = new EventEmitter<string>();

  newUsername: string = '';

  ngOnInit(): void {
    // Initialize dialog
  }

  onCancel(): void {
    this.newUsername = '';
    this.cancel.emit();
  }

  onSave(): void {
    if (this.newUsername && this.newUsername.length >= 3) {
      this.save.emit(this.newUsername);
      this.newUsername = '';
    }
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).className === 'dialog-overlay') {
      this.onCancel();
    }
  }
}
