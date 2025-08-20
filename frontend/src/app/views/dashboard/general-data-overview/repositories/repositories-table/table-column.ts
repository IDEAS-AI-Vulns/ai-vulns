import {TemplateRef} from "@angular/core";

export interface TableColumn {
    name: string;
    cellTemplate?: TemplateRef<any>;
    prop?: string;
}
