import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeneralDataOverviewComponent } from './general-data-overview.component';

describe('GeneralDataOverviewComponent', () => {
  let component: GeneralDataOverviewComponent;
  let fixture: ComponentFixture<GeneralDataOverviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GeneralDataOverviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GeneralDataOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
