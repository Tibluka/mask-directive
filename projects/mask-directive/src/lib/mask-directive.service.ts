import { Injectable } from '@angular/core';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class MaskDirectiveService {

  constructor() { }

  /**
   * Cria um validator que valida contra padrões específicos de máscara
   */
  static maskPatternValidator(maskPattern: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

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

}
