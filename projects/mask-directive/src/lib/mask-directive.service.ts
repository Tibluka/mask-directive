import { Injectable } from '@angular/core';

export interface CurrencyMaskConfig {
  symbol: string;
  prefix: string;
  decimal: string;
  thousand: string;
  decimalDigits: number;
}

// Intl.NumberFormat.formatToParts não está tipado nas lib.d.ts do TypeScript
// ~3.5 (exigido pelo Angular 8), embora exista em todo runtime com suporte a
// Intl. Declaramos aqui um contrato mínimo para manter a tipagem sem depender
// de uma versão mais nova do TypeScript.
interface NumberFormatPart {
  type: string;
  value: string;
}

interface NumberFormatWithParts {
  formatToParts(value: number): NumberFormatPart[];
}

/** @dynamic */
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
    } catch (_) {
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
      const parts = (formatter as unknown as NumberFormatWithParts).formatToParts(1234.56);

      const symbolPart = parts.find(part => part.type === 'currency');
      const decimalPart = parts.find(part => part.type === 'decimal');
      const thousandPart = parts.find(part => part.type === 'group');
      const resolvedMaxFractionDigits = formatter.resolvedOptions().maximumFractionDigits;

      const symbol = symbolPart ? symbolPart.value : currencyCode;
      const decimal = decimalPart ? decimalPart.value : ',';
      const thousand = thousandPart ? thousandPart.value : '.';
      const decimalDigits = resolvedMaxFractionDigits != null ? resolvedMaxFractionDigits : 2;

      return {
        symbol,
        prefix: `${symbol} `,
        decimal,
        thousand,
        decimalDigits,
      };
    } catch (_) {
      return null;
    }
  }

}
