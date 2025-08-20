import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {CreateTeamDTO} from "../../../../service/team/create-team-dto";

@Component({
  selector: 'app-add-new-team-modal',
  templateUrl: './add-new-team-modal.component.html',
  styleUrl: './add-new-team-modal.component.scss'
})
export class AddNewTeamModalComponent implements OnInit {

  @Input() visible: boolean = false;

  @Output() onFormSubmit = new EventEmitter<CreateTeamDTO>();

  protected newTeamForm!: FormGroup;

  constructor(private fb: FormBuilder) {
  }

  ngOnInit(): void {
    this.newTeamForm = this.fb.group({
      name: ['', Validators.required],
      remoteIdentifier: ['']
    });
  }

  protected visibleChange(event: boolean = false) {
    this.visible = event;
  }

  protected onSubmit() {
    if (this.newTeamForm.valid) {
      const createTeam: CreateTeamDTO = {
        name: this.newTeamForm.value.name,
        remoteIdentifier: this.newTeamForm.value.remoteIdentifier,
        users: []
      }
      this.onFormSubmit.emit(createTeam);
    }
  }
}
