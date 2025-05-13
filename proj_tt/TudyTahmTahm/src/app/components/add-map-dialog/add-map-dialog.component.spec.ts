import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddMapDialogComponent } from './add-map-dialog.component';

describe('AddMapDialogComponent', () => {
  let component: AddMapDialogComponent;
  let fixture: ComponentFixture<AddMapDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddMapDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddMapDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
