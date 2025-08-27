import {Directive, effect, inject, Input, TemplateRef, ViewContainerRef} from '@angular/core';

@Directive({
  selector: '[appHasRole]',
  standalone: true
})
export class HasRoleDirective {
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);

  private roleExpression: string | string[] = [];

  @Input() set appHasRole(value: string | string[]) {
    console.log('appHasRole', value);
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

    const userRole = localStorage.getItem('userRole');
    if (Array.isArray(this.roleExpression) && userRole) {
      hasAccess = this.roleExpression.includes(userRole?.toUpperCase());
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
