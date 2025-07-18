import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FoldableContainerComponent } from './foldable-container.component';

describe('FoldableContainerComponent', () => {
  let component: FoldableContainerComponent;
  let fixture: ComponentFixture<FoldableContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FoldableContainerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FoldableContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
