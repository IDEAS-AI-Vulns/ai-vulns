import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CloudSubscriptionsTableComponent } from './cloud-subscriptions-table.component';

describe('CloudSubscriptionsTableComponent', () => {
  let component: CloudSubscriptionsTableComponent;
  let fixture: ComponentFixture<CloudSubscriptionsTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CloudSubscriptionsTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CloudSubscriptionsTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
