import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-change-email-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  template: `
    <div class="dialog-overlay" *ngIf="isVisible" (click)="onOverlayClick($event)">
      <div class="dialog-container">
        <div class="dialog-header">
          <h2>Change Email</h2>
          <button class="close-btn" (click)="onCancel()">&times;</button>
        </div>
        <div class="dialog-content">
          <p>Current email: <strong>{{ currentEmail }}</strong></p>
          <div class="form-group">
            <label for="newEmail">New Email</label>
            <input
              id="newEmail"
              type="email"
              [(ngModel)]="newEmail"
              required
              #emailInput="ngModel"
              [class.invalid]="emailInput.invalid && (emailInput.dirty || emailInput.touched)"
            >
            <div class="error-message" *ngIf="emailInput.invalid && (emailInput.dirty || emailInput.touched)">
              Please enter a valid email address
            </div>
          </div>
        </div>
        <div class="dialog-actions">
          <button class="cancel-btn" (click)="onCancel()">Cancel</button>
          <button
            class="save-btn"
            [disabled]="!newEmail || emailInput.invalid"
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
export class ChangeEmailDialogComponent implements OnInit {
  @Input() isVisible: boolean = false;
  @Input() currentEmail: string = '';
  @Output() cancel = new EventEmitter<void>();
  @Output() save = new EventEmitter<string>();

  newEmail: string = '';

  ngOnInit(): void {
    // Initialize dialog
  }

  onCancel(): void {
    this.newEmail = '';
    this.cancel.emit();
  }

  onSave(): void {
    if (this.newEmail && this.isValidEmail(this.newEmail)) {
      this.save.emit(this.newEmail);
      this.newEmail = '';
    }
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).className === 'dialog-overlay') {
      this.onCancel();
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }
}
