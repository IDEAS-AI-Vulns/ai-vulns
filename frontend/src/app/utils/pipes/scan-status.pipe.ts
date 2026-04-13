import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'scanStatus',
  standalone: true
})
export class ScanStatusPipe implements PipeTransform {

  transform(value: string): string {
    console.log('scanStatus', value);
    switch (value) {
      case 'SUCCESS': return 'Low risk';
      case 'WARNING': return 'Medium risk';
      case 'DANGER': return 'High risk';
      case 'NOT_PERFORMED': return 'Not performed';
      case 'PROCESSING_ERROR': return 'Error during analysis';
      case 'RUNNING': return 'In progress';
      default: return value;
    }
  }

}
