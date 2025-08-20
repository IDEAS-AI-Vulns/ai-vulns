import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RepositoryProvidersComponent } from './repository-providers.component';

describe('RepositoryProvidersComponent', () => {
  let component: RepositoryProvidersComponent;
  let fixture: ComponentFixture<RepositoryProvidersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RepositoryProvidersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RepositoryProvidersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
