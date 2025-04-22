import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyMapsPageComponent } from './my-maps-page.component';

describe('MyMapsPageComponent', () => {
  let component: MyMapsPageComponent;
  let fixture: ComponentFixture<MyMapsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyMapsPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyMapsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
