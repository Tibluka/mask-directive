import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'libPipe'
})
export class MaskPipe implements PipeTransform {
  private regexMap: {
    [key: string]: RegExp
  } = {
      '0': /\d/, // Apenas números
      'A': /[a-zA-Z]/, // Apenas letras
      '*': /[a-zA-Z0-9]/, // Letras e números
    };

  transform(value: string, masks: string): string {
    if (!value || !masks) {
      return value || '';
    }

    const inputValue = value.replace(/[^a-zA-Z0-9]/g, ''); // Remove caracteres inválidos

    // Divide as máscaras pelo delimitador "||"
    const maskArray = masks.split('||');
    let selectedMask = maskArray[0]; // Máscara padrão, será substituída conforme o comprimento

    // Seleciona a máscara com base no comprimento do valor
    for (const mask of maskArray) {
      const maskLength = mask.replace(/[^0A*]/g, '').length; // Conta apenas os caracteres dinâmicos
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
        // Substitui caracteres da máscara dinâmica
        if (valueIndex < value.length && regex.test(value[valueIndex])) {
          formattedValue += value[valueIndex++];
        } else {
          break; // Para o loop se não houver mais caracteres válidos
        }
      } else {
        // Adiciona os caracteres fixos da máscara
        formattedValue += maskChar;
      }
    }

    return formattedValue;
  }
}
