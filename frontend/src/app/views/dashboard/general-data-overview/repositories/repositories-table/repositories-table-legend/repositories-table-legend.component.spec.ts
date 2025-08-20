import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RepositoriesTableLegendComponent } from './repositories-table-legend.component';

describe('RepositoriesTableLegendComponent', () => {
  let component: RepositoriesTableLegendComponent;
  let fixture: ComponentFixture<RepositoriesTableLegendComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RepositoriesTableLegendComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RepositoriesTableLegendComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
