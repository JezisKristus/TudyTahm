import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JourneyPageComponent } from './journey-page.component';

describe('JourneyPageComponent', () => {
  let component: JourneyPageComponent;
  let fixture: ComponentFixture<JourneyPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JourneyPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JourneyPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
