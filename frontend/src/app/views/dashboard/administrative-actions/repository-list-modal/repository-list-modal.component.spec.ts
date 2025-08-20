import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RepositoryListModalComponent } from './repository-list-modal.component';

describe('RepositoryListModalComponent', () => {
  let component: RepositoryListModalComponent;
  let fixture: ComponentFixture<RepositoryListModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RepositoryListModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RepositoryListModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
