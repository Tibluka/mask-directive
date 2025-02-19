import { Directive, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { NgControl, NgModel } from '@angular/forms';

@Directive({
  selector: '[libMask]'
})
export class MaskDirective {
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
    if (this.ngModel) {
      this.ngModel.valueChanges?.subscribe(value => {
        const initialValue = value.replace(/[^a-zA-Z0-9]/g, '');
        const masks = this.mask.split('||');
        const selectedMask = this.selectMask(masks, initialValue.length);
        this.el.nativeElement.value = this.applyMask(initialValue, selectedMask);
      });
    }
    if (this.ngControl?.control) {

      this.ngControl.control.valueChanges?.subscribe(value => {
        if (value) {
          const initialValue = value.replace(/[^a-zA-Z0-9]/g, '');
          const masks = this.mask.split('||');
          const selectedMask = this.selectMask(masks, initialValue.length);
          this.el.nativeElement.value = this.applyMask(initialValue, selectedMask);
        }
      });
      const initialValue = this.ngControl.value.replace(/[^a-zA-Z0-9]/g, '');
      if (!initialValue) return;
      const masks = this.mask.split('||');
      const selectedMask = this.selectMask(masks, initialValue.length);
      this.el.nativeElement.value = this.applyMask(initialValue, selectedMask);
    }
  }

  @HostListener('input', ['$event'])
  onInput(event: any): void {
    const inputElement = this.el.nativeElement;
    let inputValue = inputElement.value.replace(/[^a-zA-Z0-9]/g, ''); // Valor sem caracteres inválidos

    if (!this.mask) return;

    const masks = this.mask.split('||');
    const selectedMask = this.selectMask(masks, inputValue.length);

    if (!selectedMask) {
      inputElement.value = inputValue;
      return;
    }

    // Obtém a posição atual do cursor
    const cursorPosition = inputElement.selectionStart || 0;
    const prevValue = inputElement.value;

    inputElement.value = this.applyMask(inputValue, selectedMask);

    if (this.dropSpecialCharacters) {
      inputValue = inputValue.replace(/[^a-zA-Z0-9]/g, ''); // Remove caracteres especiais
      this.valueChange.emit(inputValue);
    }

    if (event.inputType === 'deleteContentBackward' || event.inputType === 'deleteContentForward') {
      let newValue = inputElement.value;
      let newCursorPosition = cursorPosition;

      if (cursorPosition > 0) {
        const prevChar = prevValue[cursorPosition - 1]; // Caracter antes do cursor
        const nextChar = prevValue[cursorPosition]; // Caracter após o cursor

        // Se estiver deletando e o caractere anterior for especial, apaga ele também
        if (!/[a-zA-Z0-9]/.test(prevChar)) {
          newValue = prevValue.substring(0, cursorPosition - 1) + prevValue.substring(cursorPosition);
          newCursorPosition--;
        }

        // Se após apagar o caractere ainda sobrar um especial na posição, remove
        if (nextChar && !/[a-zA-Z0-9]/.test(nextChar)) {
          newValue = newValue.substring(0, newCursorPosition) + newValue.substring(newCursorPosition + 1);
        }

        inputElement.value = newValue;
        inputElement.setSelectionRange(newCursorPosition, newCursorPosition);
      }
    }
  }


  // Seleciona a máscara com base no tamanho do valor
  private selectMask(masks: string[], valueLength: number): string | null {
    // Encontra a máscara com o tamanho mais próximo ao valor atual
    for (const mask of masks) {
      const maskLength = mask.replace(/[^0A*]/g, '').length; // Conta apenas os caracteres dinâmicos
      if (valueLength <= maskLength) {
        return mask;
      }
    }
    return masks[masks.length - 1] || null; // Retorna a última máscara se nenhuma combinar
  }

  // Aplica a máscara selecionada ao valor
  private applyMask(value: string, mask: any): string {
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
