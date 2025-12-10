import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'percentRounded',
  standalone: true
})
export class PercentRoundedPipe implements PipeTransform {
  transform(value: number | null | undefined): string | null {
    if (value == null || isNaN(value)) return null;

    const percent = Math.round(value * 100);

    return percent + '%';
  }
}
