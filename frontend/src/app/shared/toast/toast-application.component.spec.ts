import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ToastApplicationComponent} from './toast-application.component';

describe('ToastComponent', () => {
  let component: ToastApplicationComponent;
  let fixture: ComponentFixture<ToastApplicationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastApplicationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ToastApplicationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
