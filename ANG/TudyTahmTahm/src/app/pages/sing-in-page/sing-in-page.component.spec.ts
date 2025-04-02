import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SingInPageComponent } from './sing-in-page.component';

describe('SingInPageComponent', () => {
  let component: SingInPageComponent;
  let fixture: ComponentFixture<SingInPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SingInPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SingInPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
