import { Pipe, PipeTransform } from '@angular/core';
import { CurrencyMaskConfig, MaskDirectiveService } from './mask-directive.service';

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

  transform(value: string, masks: string, locale: string = 'pt-BR'): string {
    if (!value || !masks) {
      return value || '';
    }

    // 💰 Verifica se é máscara de moeda (qualquer código ISO 4217 válido)
    const currencyConfig = MaskDirectiveService.getCurrencyConfig(masks, locale);
    if (currencyConfig) {
      return this.applyCurrencyMask(value, currencyConfig);
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

  // 💰 MÉTODOS DE MÁSCARA DE MOEDA

  /**
   * Aplica formatação de moeda ao valor, para qualquer moeda ISO 4217
   * suportada, considerando a quantidade de decimais específica de cada
   * moeda (ex: 0 para JPY/KRW, 3 para BHD/KWD, 2 para a maioria).
   */
  private applyCurrencyMask(value: string, config: CurrencyMaskConfig): string {
    const numbersOnly = value.replace(/\D/g, '');

    if (!numbersOnly) return '';

    if (config.decimalDigits === 0) {
      const formattedInteger = numbersOnly.replace(/\B(?=(\d{3})+(?!\d))/g, config.thousand);
      return `${config.prefix}${formattedInteger}`;
    }

    // Garante dígitos suficientes para separar parte inteira e decimal
    const paddedValue = numbersOnly.padStart(config.decimalDigits + 1, '0');
    const integerPart = paddedValue.slice(0, -config.decimalDigits);
    const decimalPart = paddedValue.slice(-config.decimalDigits);

    // Adiciona separador de milhares na parte inteira
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, config.thousand);

    // Retorna o valor formatado com símbolo da moeda
    return `${config.prefix}${formattedInteger}${config.decimal}${decimalPart}`;
  }
}
