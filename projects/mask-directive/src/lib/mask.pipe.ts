import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'libPipe',
  standalone: true
})
export class MaskPipe implements PipeTransform {
  private regexMap: {
    [key: string]: RegExp
  } = {
      '0': /\d/,
      'A': /[a-zA-Z]/,
      '*': /[a-zA-Z0-9]/,
    };

  transform(value: string, masks: string): string {
    if (!value || !masks) {
      return value || '';
    }

    const inputValue = value.replace(/[^a-zA-Z0-9]/g, '');

    const maskArray = masks.split('||');
    let selectedMask = maskArray[0];

    for (const mask of maskArray) {
      const maskLength = mask.replace(/[^0A*]/g, '').length;
      if (inputValue.length <= maskLength) {
        selectedMask = mask;
        break;
      }
    }

    return this.applyMask(inputValue, selectedMask);
  }

  private applyMask(value: string, mask: string): string {
    let formattedValue = '';
    let valueIndex = 0;

    for (let i = 0; i < mask.length; i++) {
      const maskChar = mask[i];
      const regex = this.regexMap[maskChar];

      if (regex) {
        if (valueIndex < value.length && regex.test(value[valueIndex])) {
          formattedValue += value[valueIndex++];
        } else {
          break;
        }
      } else {
        formattedValue += maskChar;
      }
    }

    return formattedValue;
  }
}