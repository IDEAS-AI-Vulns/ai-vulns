import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CloudSubscriptionsComponent } from './cloud-subscriptions.component';

describe('CloudSubscriptionsComponent', () => {
  let component: CloudSubscriptionsComponent;
  let fixture: ComponentFixture<CloudSubscriptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CloudSubscriptionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CloudSubscriptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
