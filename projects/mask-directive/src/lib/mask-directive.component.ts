import { Directive, ElementRef, EventEmitter, HostListener, Input, Output, OnInit } from '@angular/core';
import { NgControl, NgModel } from '@angular/forms';

@Directive({
  selector: '[libMask]',
  standalone: false
})
export class MaskDirective implements OnInit {
  @Input('libMask') mask: string = '';
  @Input() dropSpecialCharacters: boolean = false;
  @Output() valueChange: EventEmitter<string> = new EventEmitter<string>();

  private regexMap: { [key: string]: RegExp } = {
    '0': /\d/, // Apenas números
    'A': /[a-zA-Z]/, // Apenas letras
    '*': /[a-zA-Z0-9]/, // Letras e números
  };

  constructor(
    private el: ElementRef<HTMLInputElement>,
    private ngModel: NgModel,
    private ngControl: NgControl) { }

  ngOnInit() {
    // 🔧 PROTEÇÃO: Só executar se máscara estiver definida e não for campo numérico
    if (!this.mask || this.isNumericField()) {
      return;
    }

    if (this.ngModel) {
      this.ngModel.valueChanges?.subscribe(value => {
        // 🔧 CORREÇÃO ULTRA SEGURA: Múltiplas validações
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
        // 🔧 CORREÇÃO ULTRA SEGURA: Múltiplas validações
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

    const inputElement = this.el?.nativeElement;
    if (!inputElement) return;

    // 🔧 CORREÇÃO ULTRA SEGURA: Verificar se inputElement.value existe
    const rawValue = inputElement.value;
    if (rawValue == null) return;

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
      this.valueChange.emit(cleanedInputValue); // Emite o valor limpo

      // Atualiza o FormControl/NgModel com o valor limpo
      if (this.ngControl?.control) {
        this.ngControl.control.setValue(cleanedInputValue, { emitEvent: false });
      }
      if (this.ngModel) {
        this.ngModel.update.emit(cleanedInputValue);
      }
    } else {
      // Se dropSpecialCharacters for false, emite o valor formatado
      this.valueChange.emit(inputElement.value);
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
}