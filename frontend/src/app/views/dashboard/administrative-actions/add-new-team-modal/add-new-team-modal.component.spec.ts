import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddNewTeamModalComponent } from './add-new-team-modal.component';

describe('AddNewTeamModalComponent', () => {
  let component: AddNewTeamModalComponent;
  let fixture: ComponentFixture<AddNewTeamModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddNewTeamModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddNewTeamModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
