import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SingleRepositoryImportModalComponent } from './single-repository-import-modal.component';

describe('SingleRepositoryImportModalComponent', () => {
  let component: SingleRepositoryImportModalComponent;
  let fixture: ComponentFixture<SingleRepositoryImportModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SingleRepositoryImportModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SingleRepositoryImportModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
