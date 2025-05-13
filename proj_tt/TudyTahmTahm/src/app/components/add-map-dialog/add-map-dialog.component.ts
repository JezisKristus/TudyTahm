import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-add-map-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './add-map-dialog.component.html',
  styleUrls: ['./add-map-dialog.component.scss']
})
export class AddMapDialogComponent {
  @Output() closeDialog = new EventEmitter<void>();
  @Output() createMap = new EventEmitter<any>();

  mapForm: FormGroup;
  isSubmitting = false;
  previewImageUrl: string | null = null;

  constructor(private fb: FormBuilder) {
    this.mapForm = this.fb.group({
      mapName: ['', [Validators.required, Validators.maxLength(50)]],
      mapDescription: ['', Validators.maxLength(200)],
      isCustom: [false]
    });
  }

  onCancel(): void {
    this.closeDialog.emit(); // Emit event to close the dialog
  }

  onCreateMap(): void {
    if (this.mapForm.valid) {
      this.isSubmitting = true;

      const formValue = this.mapForm.value;
      const newMap = {
        mapName: formValue.mapName,
        mapDescription: formValue.mapDescription,
        mapPath: this.previewImageUrl || '',
        isCustom: formValue.isCustom
      };

      this.createMap.emit(newMap); // Emit event with map data
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length) {
      const file = input.files[0];

      if (file.type.match(/image\/(jpeg|png|gif|svg\+xml)$/)) {
        const reader = new FileReader();

        reader.onload = () => {
          this.previewImageUrl = reader.result as string;
        };

        reader.readAsDataURL(file);
      } else {
        alert('Please select a valid image file (JPEG, PNG, GIF, or SVG)');
      }
    }
  }

  triggerFileInput(): void {
    document.getElementById('map-file-input')?.click();
  }
}
