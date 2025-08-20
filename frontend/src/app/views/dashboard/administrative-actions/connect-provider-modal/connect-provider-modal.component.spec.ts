import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConnectProviderModalComponent } from './connect-provider-modal.component';

describe('ConnectProviderModalComponent', () => {
  let component: ConnectProviderModalComponent;
  let fixture: ComponentFixture<ConnectProviderModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConnectProviderModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConnectProviderModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
