import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RepositoriesTableComponent } from './repositories-table.component';

describe('RepositoriesTableComponent', () => {
  let component: RepositoriesTableComponent;
  let fixture: ComponentFixture<RepositoriesTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RepositoriesTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RepositoriesTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
