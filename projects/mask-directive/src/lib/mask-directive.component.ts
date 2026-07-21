import { Directive, ElementRef, EventEmitter, HostListener, Input, Optional, Output, OnInit } from '@angular/core';
import { NgControl, NgModel } from '@angular/forms';
import { CurrencyMaskConfig, MaskDirectiveService } from './mask-directive.service';

@Directive({
  selector: '[libMask]',
  standalone: true
})
export class MaskDirective implements OnInit {
  @Input('libMask') mask: string = '';
  @Input() dropSpecialCharacters: boolean = true;
  // Locale usado para derivar símbolo e separadores da moeda via Intl.NumberFormat
  @Input() currencyLocale: string = 'pt-BR';
  @Output() valueChange: EventEmitter<string> = new EventEmitter<string>();

  private regexMap: { [key: string]: RegExp } = {
    '0': /\d/, // Apenas números
    'A': /[a-zA-Z]/, // Apenas letras
    '*': /[a-zA-Z0-9]/, // Letras e números
  };

  // Controle interno para valores de moeda (armazena no menor fracionamento da moeda, ex: centavos)
  private currencyValue: number = 0;

  // Cache da configuração de moeda (símbolo, separadores, decimais), calculada via Intl.NumberFormat
  private currencyConfig: CurrencyMaskConfig | null | undefined = undefined;

  // Garante que o validator de máscara seja adicionado apenas uma vez
  private validatorApplied: boolean = false;

  constructor(
    private el: ElementRef<HTMLInputElement>,
    @Optional() private ngModel: NgModel | null,
    @Optional() private ngControl: NgControl | null) { }

  ngOnInit() {
    // 🔧 PROTEÇÃO: Só executar se máscara estiver definida e não for campo numérico
    if (!this.mask || this.isNumericField()) {
      return;
    }

    // 🎯 ADICIONA VALIDATOR AUTOMATICAMENTE
    this.addAutomaticValidator();

    // 💰 Se for máscara de moeda, aplicar valor inicial e sair
    if (this.isCurrencyMask()) {
      // Aplica valor inicial se existir
      if (this.ngControl?.value != null && this.el?.nativeElement) {
        const value = this.parseInitialCurrencyValue(this.ngControl.value);
        this.currencyValue = value;
        this.el.nativeElement.value = this.formatCurrencyForDisplay(value);
      }
      return;
    }

    // Lógica para máscaras convencionais (telefone, CPF, etc)
    if (this.ngModel) {
      this.ngModel.valueChanges?.subscribe(value => {
        if (this.isValidValue(value)) {
          const stringValue = this.safeToString(value);
          const initialValue = stringValue.replace(/[^a-zA-Z0-9]/g, '');
          const masks = this.mask.split('||');
          const selectedMask = this.selectMask(masks, initialValue.length);
          if (selectedMask && this.el?.nativeElement) {
            this.el.nativeElement.value = this.applyMask(initialValue, selectedMask);
          }
        }
      });
    }

    if (this.ngControl?.control) {
      this.ngControl.control.valueChanges?.subscribe(value => {
        if (this.isValidValue(value)) {
          const stringValue = this.safeToString(value);
          const initialValue = stringValue.replace(/[^a-zA-Z0-9]/g, '');
          const masks = this.mask.split('||');
          const selectedMask = this.selectMask(masks, initialValue.length);
          if (selectedMask && this.el?.nativeElement) {
            this.el.nativeElement.value = this.applyMask(initialValue, selectedMask);
          }
        }
      });

      // 🔧 CORREÇÃO: Verificação inicial segura
      if (this.ngControl.value != null && this.el?.nativeElement) {
        const stringValue = this.safeToString(this.ngControl.value);
        const initialValue = stringValue.replace(/[^a-zA-Z0-9]/g, '');
        if (initialValue) {
          const masks = this.mask.split('||');
          const selectedMask = this.selectMask(masks, initialValue.length);
          if (selectedMask) {
            this.el.nativeElement.value = this.applyMask(initialValue, selectedMask);
          }
        }
      }
    }
  }

  @HostListener('input', ['$event'])
  onInput(event: any): void {
    // 🔧 PROTEÇÃO: Só executar se máscara estiver definida e não for campo numérico
    if (!this.mask || this.isNumericField()) {
      return;
    }

    // 🎯 Tenta adicionar validator se ainda não foi adicionado
    this.tryAddValidator();

    const inputElement = this.el?.nativeElement;
    if (!inputElement) return;

    const rawValue = inputElement.value;
    if (rawValue == null) return;

    // 💰 Verifica se é máscara de moeda e direciona para handler específico
    if (this.isCurrencyMask()) {
      this.handleCurrencyInput(inputElement, event);
      return;
    }

    // Lógica normal de máscara (para máscaras de padrão como telefone, CPF, etc)
    const inputValue = this.safeToString(rawValue).replace(/[^a-zA-Z0-9]/g, '');

    // Divide as máscaras pelo delimitador "||"
    const masks = this.mask.split('||');
    const selectedMask = this.selectMask(masks, inputValue.length);

    if (!selectedMask) {
      inputElement.value = inputValue;
      return;
    }

    inputElement.value = this.applyMask(inputValue, selectedMask);

    // Atualiza o valor limpo, sem caracteres especiais, se dropSpecialCharacters for true
    if (this.dropSpecialCharacters) {
      const cleanedInputValue = inputValue.replace(/[^a-zA-Z0-9]/g, '');
      this.valueChange.emit(cleanedInputValue);

      // Atualiza o FormControl/NgModel com o valor limpo
      if (this.ngControl?.control) {
        this.ngControl.control.setValue(cleanedInputValue, { emitEvent: false, emitModelToViewChange: false });
      }
      if (this.ngModel) {
        this.ngModel.viewToModelUpdate(cleanedInputValue);
      }
    } else {
      // Se dropSpecialCharacters for false, emite o valor formatado
      this.valueChange.emit(inputElement.value);

      // Atualiza o FormControl/NgModel com o valor formatado
      if (this.ngControl?.control) {
        this.ngControl.control.setValue(inputElement.value, { emitEvent: false, emitModelToViewChange: false });
      }
      if (this.ngModel) {
        this.ngModel.viewToModelUpdate(inputElement.value);
      }
    }

    // Tratamento de delete com timeout
    if (
      event.inputType == 'deleteContentBackward' || event.inputType == 'deleteContentForward'
    ) {
      setTimeout(() => {
        const value = this.safeToString(inputElement.value || '').trim();
        if (value.length > 0) {
          const lastChar = value.charAt(value.length - 1);
          if (!/[a-zA-Z0-9]/.test(lastChar)) {
            const updatedValue = value.substring(0, value.length - 1);
            inputElement.value = updatedValue;

            // Atualiza o FormControl/NgModel com o valor corrigido
            if (this.dropSpecialCharacters) {
              const cleanedValue = updatedValue.replace(/[^a-zA-Z0-9]/g, '');
              if (this.ngControl?.control) {
                this.ngControl.control.setValue(cleanedValue, { emitEvent: false, emitModelToViewChange: false });
              }
              if (this.ngModel) {
                this.ngModel.viewToModelUpdate(cleanedValue);
              }
            } else {
              if (this.ngControl?.control) {
                this.ngControl.control.setValue(updatedValue, { emitEvent: false, emitModelToViewChange: false });
              }
              if (this.ngModel) {
                this.ngModel.viewToModelUpdate(updatedValue);
              }
            }
          }
        } else {
          // Se o campo está vazio, limpa o FormControl/NgModel
          if (this.ngControl?.control) {
            this.ngControl.control.setValue('', { emitEvent: false, emitModelToViewChange: false });
          }
          if (this.ngModel) {
            this.ngModel.viewToModelUpdate('');
          }
        }
      }, 1);
    }
  }

  // 🔧 MÉTODOS AUXILIARES SEGUROS

  /**
   * Verifica se o valor é válido para processamento
   */
  private isValidValue(value: any): boolean {
    return value != null && value !== '';
  }

  /**
   * Converte qualquer valor para string de forma segura
   */
  private safeToString(value: any): string {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'boolean') return value.toString();
    try {
      return String(value);
    } catch {
      return '';
    }
  }

  /**
   * Verifica se é um campo numérico (para não aplicar máscara)
   */
  private isNumericField(): boolean {
    return this.el?.nativeElement?.type === 'number';
  }

  // Seleciona a máscara com base no tamanho do valor
  private selectMask(masks: string[], valueLength: number): string | null {
    if (!masks || masks.length === 0) return null;

    // Encontra a máscara com o tamanho mais próximo ao valor atual
    for (const mask of masks) {
      if (!mask) continue;
      const maskLength = mask.replace(/[^0A*]/g, '').length; // Conta apenas os caracteres dinâmicos
      if (valueLength <= maskLength) {
        return mask;
      }
    }
    return masks[masks.length - 1] || null; // Retorna a última máscara se nenhuma combinar
  }

  // Aplica a máscara selecionada ao valor
  private applyMask(value: string, mask: string): string {
    if (!value || !mask) return value || '';

    let formattedValue = '';
    let valueIndex = 0;

    for (let i = 0; i < mask.length && valueIndex < value.length; i++) {
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

  // 💰 MÉTODOS DE MÁSCARA DE MOEDA - CORRIGIDOS

  /**
   * Manipula input para máscaras de moeda
   */
  private handleCurrencyInput(inputElement: HTMLInputElement, event: any): void {
    const rawValue = inputElement.value;
    const config = this.getCurrencyConfig();

    if (!config) return;

    // Remove tudo que não é número do valor atual
    const numbersOnly = rawValue.replace(/\D/g, '');

    // Se for delete/backspace
    if (event.inputType === 'deleteContentBackward') {
      // Remove o último dígito do menor fracionamento da moeda (ex: centavos)
      this.currencyValue = Math.floor(this.currencyValue / 10);
    } else if (numbersOnly) {
      // Pega apenas o último dígito digitado
      const lastDigit = numbersOnly.slice(-1);
      // Adiciona o novo dígito ao valor no menor fracionamento da moeda
      this.currencyValue = (this.currencyValue * 10) + Number.parseInt(lastDigit, 10);

      // Limite de segurança para evitar overflow, independente da moeda
      const maxValue = Math.floor(Number.MAX_SAFE_INTEGER / 10);
      if (this.currencyValue > maxValue) {
        this.currencyValue = maxValue;
      }
    }

    // Formata o valor para exibição
    const formattedValue = this.formatCurrencyForDisplay(this.currencyValue);
    inputElement.value = formattedValue;

    // Define o valor a ser armazenado
    let valueToStore: string;

    if (this.dropSpecialCharacters) {
      // Armazena valor em centavos como string
      valueToStore = this.currencyValue.toString();
    } else {
      // Armazena valor formatado
      valueToStore = formattedValue;
    }

    // Atualiza o FormControl/NgModel
    if (this.ngControl?.control) {
      this.ngControl.control.setValue(valueToStore, { emitEvent: false, emitModelToViewChange: false });
    }
    if (this.ngModel) {
      this.ngModel.viewToModelUpdate(valueToStore);
    }

    this.valueChange.emit(valueToStore);

    // Move o cursor para o final
    setTimeout(() => {
      if (typeof inputElement.setSelectionRange === 'function') {
        const len = inputElement.value.length;
        inputElement.setSelectionRange(len, len);
      }
    }, 0);
  }

  /**
   * Deriva e armazena em cache a configuração da moeda (símbolo, separadores
   * e quantidade de decimais) via Intl.NumberFormat, para qualquer código
   * ISO 4217 válido — sem depender de uma lista fixa de moedas.
   */
  private getCurrencyConfig(): CurrencyMaskConfig | null {
    if (this.currencyConfig === undefined) {
      this.currencyConfig = MaskDirectiveService.getCurrencyConfig(this.mask, this.currencyLocale);
    }
    return this.currencyConfig;
  }

  /**
   * Verifica se a máscara é do tipo moeda
   */
  private isCurrencyMask(): boolean {
    return this.getCurrencyConfig() !== null;
  }

  /**
   * Formata o valor (armazenado no menor fracionamento da moeda) para exibição
   */
  private formatCurrencyForDisplay(valueInSmallestUnit: number): string {
    const config = this.getCurrencyConfig();

    if (!config) return '';

    const factor = 10 ** config.decimalDigits;

    // Separa a parte inteira da parte fracionária (ex: reais/centavos)
    const integerPart = Math.floor(valueInSmallestUnit / factor);

    // Formata a parte inteira com separador de milhares
    const formattedInteger = integerPart
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, config.thousand);

    // Moedas sem parte decimal (ex: JPY, KRW) não exibem separador decimal
    if (config.decimalDigits === 0) {
      return `${config.prefix}${formattedInteger}`;
    }

    const decimalPart = valueInSmallestUnit % factor;
    const formattedDecimal = decimalPart.toString().padStart(config.decimalDigits, '0');

    // Retorna o valor formatado com símbolo da moeda
    return `${config.prefix}${formattedInteger}${config.decimal}${formattedDecimal}`;
  }

  /**
   * Converte valor inicial para o menor fracionamento da moeda
   */
  private parseInitialCurrencyValue(value: any): number {
    if (!value) return 0;

    const stringValue = this.safeToString(value);

    // Se já for um número no menor fracionamento da moeda, retorna direto
    if (this.dropSpecialCharacters && /^\d+$/.test(stringValue)) {
      return Number.parseInt(stringValue, 10);
    }

    // Se for formatado, extrai apenas números
    const numbersOnly = stringValue.replace(/\D/g, '');

    return Number.parseInt(numbersOnly || '0', 10);
  }

  @HostListener('blur')
  onBlur(): void {
    // Garante que o valor mínimo seja R$ 0,00 quando sair do campo
    if (this.isCurrencyMask() && this.currencyValue === 0) {
      const inputElement = this.el?.nativeElement;
      if (inputElement) {
        inputElement.value = this.formatCurrencyForDisplay(0);
      }
    }
  }

  @HostListener('focus')
  onFocus(): void {
    // Seleciona todo o texto ao focar no campo de moeda
    if (this.isCurrencyMask()) {
      setTimeout(() => {
        const inputElement = this.el?.nativeElement;
        if (inputElement && typeof inputElement.select === 'function') {
          inputElement.select();
        }
      }, 0);
    }
  }

  /**
   * 🎯 Adiciona validator automaticamente baseado na máscara
   */
  private addAutomaticValidator(): void {
    // Tenta com NgControl primeiro
    if (this.ngControl?.control) {
      this.addValidatorToControl(this.ngControl.control);
      return;
    }

    // Se não tem NgControl, tenta com NgModel
    if (this.ngModel?.control) {
      this.addValidatorToControl(this.ngModel.control);
      return;
    }

    // Se não tem nenhum dos dois, aguarda um pouco e tenta novamente
    setTimeout(() => {
      if (this.ngControl?.control) {
        this.addValidatorToControl(this.ngControl.control);
      } else if (this.ngModel?.control) {
        this.addValidatorToControl(this.ngModel.control);
      }
    }, 100);
  }

  /**
   * Adiciona validator a um control específico
   */
  private addValidatorToControl(control: any): void {
    // 🔧 CORREÇÃO: usa uma flag simples em vez de testar o validator com um
    // valor vazio (o validator sempre retorna null para valor vazio, então
    // esse teste nunca detectava que o validator já tinha sido adicionado).
    // Sem essa flag, o validator era reempilhado e updateValueAndValidity()
    // era chamado a cada tecla digitada, disparando o valueChanges do
    // ngOnInit com o valor antigo do control e sobrescrevendo o valor recém
    // digitado no input.
    if (!control || this.validatorApplied) {
      return;
    }

    const currentValidators = control.validator ? [control.validator] : [];
    const maskValidator = MaskDirectiveService.maskPatternValidator(this.mask);

    control.setValidators([...currentValidators, maskValidator]);
    control.updateValueAndValidity({ emitEvent: false });

    this.validatorApplied = true;
  }

  /**
   * Tenta adicionar validator quando o control estiver disponível
   */
  private tryAddValidator(): void {
    // Tenta com NgControl primeiro
    if (this.ngControl?.control) {
      this.addValidatorToControl(this.ngControl.control);
      return;
    }

    // Se não tem NgControl, tenta com NgModel
    if (this.ngModel?.control) {
      this.addValidatorToControl(this.ngModel.control);
      return;
    }
  }
}