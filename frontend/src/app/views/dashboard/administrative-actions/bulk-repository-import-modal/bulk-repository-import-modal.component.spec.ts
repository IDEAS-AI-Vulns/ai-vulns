import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BulkRepositoryImportModalComponent } from './bulk-repository-import-modal.component';

describe('BulkRepositoryImportModalComponent', () => {
  let component: BulkRepositoryImportModalComponent;
  let fixture: ComponentFixture<BulkRepositoryImportModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BulkRepositoryImportModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BulkRepositoryImportModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
