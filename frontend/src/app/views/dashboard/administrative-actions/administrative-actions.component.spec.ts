import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdministrativeActionsComponent } from './administrative-actions.component';

describe('AdministrativeActionsComponent', () => {
  let component: AdministrativeActionsComponent;
  let fixture: ComponentFixture<AdministrativeActionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdministrativeActionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdministrativeActionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
