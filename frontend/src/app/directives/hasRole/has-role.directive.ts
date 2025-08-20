import {Directive, effect, inject, Input, TemplateRef, ViewContainerRef} from '@angular/core';
import {AuthService} from "../../service/AuthService";

@Directive({
  selector: '[appHasRole]',
  standalone: true
})
export class HasRoleDirective {
  private authService = inject(AuthService);
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);

  private roleExpression: string | string[] = [];

  @Input() set appHasRole(value: string | string[]) {
    this.roleExpression = value;
    this.updateView();
  }

  constructor() {
    effect(() => {
      this.updateView();
    });
  }

  private updateView() {
    let hasAccess = false;

    if (Array.isArray(this.roleExpression)) {
      hasAccess = this.roleExpression.some(role => this.authService.hasRole(role));
    } else {
      hasAccess = this.authService.checkRoleExpression(this.roleExpression);
    }

    if (hasAccess) {
      if (this.viewContainer.length === 0) {
        this.viewContainer.createEmbeddedView(this.templateRef);
      }
    } else {
      this.viewContainer.clear();
    }
  }
}
