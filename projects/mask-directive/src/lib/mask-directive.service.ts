import { Injectable } from '@angular/core';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export interface CurrencyMaskConfig {
  symbol: string;
  prefix: string;
  decimal: string;
  thousand: string;
  decimalDigits: number;
}

@Injectable({
  providedIn: 'root'
})
export class MaskDirectiveService {

  constructor() { }

  /**
   * Verifica se um código corresponde a uma moeda ISO 4217 suportada pelo
   * ambiente (via Intl.NumberFormat), sem depender de uma lista fixa de moedas.
   */
  static isValidCurrencyCode(code: string): boolean {
    if (!code || !/^[A-Za-z]{3}$/.test(code)) return false;

    try {
      new Intl.NumberFormat(undefined, { style: 'currency', currency: code.toUpperCase() });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Deriva a configuração de formatação (símbolo, separadores e quantidade de
   * decimais) de qualquer moeda ISO 4217 usando Intl.NumberFormat, em vez de
   * uma lista fixa de moedas.
   */
  static getCurrencyConfig(code: string, locale: string = 'pt-BR'): CurrencyMaskConfig | null {
    if (!this.isValidCurrencyCode(code)) return null;

    const currencyCode = code.toUpperCase();

    try {
      const formatter = new Intl.NumberFormat(locale, { style: 'currency', currency: currencyCode });
      const parts = formatter.formatToParts(1234.56);

      const symbol = parts.find(part => part.type === 'currency')?.value ?? currencyCode;
      const decimal = parts.find(part => part.type === 'decimal')?.value ?? ',';
      const thousand = parts.find(part => part.type === 'group')?.value ?? '.';
      const decimalDigits = formatter.resolvedOptions().maximumFractionDigits ?? 2;

      return {
        symbol,
        prefix: `${symbol} `,
        decimal,
        thousand,
        decimalDigits,
      };
    } catch {
      return null;
    }
  }

  /**
   * Cria um validator que valida contra padrões específicos de máscara
   */
  static maskPatternValidator(maskPattern: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      // Se não tem valor ou está vazio, não valida (deixa outros validators como required fazerem seu trabalho)
      if (!control.value || control.value === '') return null;

      const value = control.value.toString();

      // Divide os padrões de máscara pelo delimitador "||"
      const patterns = maskPattern.split('||');

      // Verifica se o valor corresponde a algum dos padrões
      const isValid = patterns.some(pattern => {
        return this.matchesPattern(value, pattern);
      });

      if (!isValid) {
        return {
          maskPatternInvalid: {
            value: control.value,
            expectedPatterns: patterns
          }
        };
      }

      return null;
    };
  }

  /**
   * Verifica se o valor corresponde ao padrão da máscara
   */
  private static matchesPattern(value: string, pattern: string): boolean {
    if (!value || !pattern) return false;

    // Remove caracteres especiais do valor para comparar apenas com números/letras
    const cleanValue = value.replace(/[^a-zA-Z0-9]/g, '');
    const cleanPattern = pattern.replace(/[^0A*]/g, '');

    // Verifica se o comprimento do valor limpo corresponde ao padrão
    if (cleanValue.length !== cleanPattern.length) {
      return false;
    }

    // Verifica se cada caractere do valor corresponde ao padrão
    for (let i = 0; i < cleanValue.length; i++) {
      const valueChar = cleanValue[i];
      const patternChar = cleanPattern[i];

      if (patternChar === '0' && !/\d/.test(valueChar)) {
        return false; // Deve ser número
      }
      if (patternChar === 'A' && !/[a-zA-Z]/.test(valueChar)) {
        return false; // Deve ser letra
      }
      if (patternChar === '*' && !/[a-zA-Z0-9]/.test(valueChar)) {
        return false; // Deve ser letra ou número
      }
    }

    return true;
  }

  /**
   * Cria um validator que funciona com qualquer máscara
   * Use este método quando a validação automática não funcionar
   */
  static createMaskValidator(maskPattern: string): ValidatorFn {
    return this.maskPatternValidator(maskPattern);
  }

}
