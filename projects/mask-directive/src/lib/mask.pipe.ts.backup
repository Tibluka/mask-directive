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

  // Configurações de máscaras de moeda
  private currencyMasks: { [key: string]: { symbol: string, decimal: string, thousand: string, prefix: string } } = {
    'BRL': { symbol: 'R$', decimal: ',', thousand: '.', prefix: 'R$ ' },
    'USD': { symbol: '$', decimal: '.', thousand: ',', prefix: '$ ' },
    'EUR': { symbol: '€', decimal: ',', thousand: '.', prefix: '€ ' },
    'GBP': { symbol: '£', decimal: '.', thousand: ',', prefix: '£ ' },
  };

  transform(value: string, masks: string): string {
    if (!value || !masks) {
      return value || '';
    }

    // 💰 Verifica se é máscara de moeda
    if (this.isCurrencyMask(masks)) {
      return this.applyCurrencyMask(value, masks);
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
   * Verifica se a máscara é do tipo moeda
   */
  private isCurrencyMask(mask: string): boolean {
    return this.currencyMasks.hasOwnProperty(mask.toUpperCase());
  }

  /**
   * Aplica formatação de moeda ao valor
   */
  private applyCurrencyMask(value: string, currencyType: string): string {
    const config = this.currencyMasks[currencyType.toUpperCase()];

    if (!config) return value;

    // Remove tudo exceto números
    const numbersOnly = value.replace(/\D/g, '');

    if (!numbersOnly) return '';

    // Separa parte inteira e decimal (últimos 2 dígitos são centavos)
    let integerPart: string;
    let decimalPart: string;

    if (numbersOnly.length === 1) {
      // Ex: "5" -> "0.05"
      integerPart = '0';
      decimalPart = '0' + numbersOnly;
    } else if (numbersOnly.length === 2) {
      // Ex: "50" -> "0.50"
      integerPart = '0';
      decimalPart = numbersOnly;
    } else {
      // Ex: "150" -> "1.50"
      integerPart = numbersOnly.slice(0, -2);
      decimalPart = numbersOnly.slice(-2);
    }

    // Adiciona separador de milhares na parte inteira
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, config.thousand);

    // Retorna o valor formatado com símbolo da moeda
    return `${config.prefix}${formattedInteger}${config.decimal}${decimalPart}`;
  }
}