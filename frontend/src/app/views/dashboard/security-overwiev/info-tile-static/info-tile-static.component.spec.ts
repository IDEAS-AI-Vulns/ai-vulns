import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfoTileStaticComponent } from './info-tile-static.component';

describe('InfoTileStaticComponent', () => {
  let component: InfoTileStaticComponent;
  let fixture: ComponentFixture<InfoTileStaticComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InfoTileStaticComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InfoTileStaticComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
