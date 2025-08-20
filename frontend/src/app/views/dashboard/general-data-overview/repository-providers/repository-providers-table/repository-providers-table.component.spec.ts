import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RepositoryProvidersTableComponent } from './repository-providers-table.component';

describe('RepositoryProvidersTableComponent', () => {
  let component: RepositoryProvidersTableComponent;
  let fixture: ComponentFixture<RepositoryProvidersTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RepositoryProvidersTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RepositoryProvidersTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
