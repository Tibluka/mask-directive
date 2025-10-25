
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, forwardRef, Input, OnDestroy, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MaskDirective } from "mask-directive";

@Component({
  selector: 'ds-input',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MaskDirective
  ],
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.scss'],
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true
    }
  ]
})
export class InputComponent implements OnInit, OnDestroy, ControlValueAccessor {
  @Input() label: string = '';
  @Input() placeholder: string = '';
  @Input() type: string = 'text';
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
  @Input() invalid: boolean = false;
  @Input() icon: string = '';
  @Input() iconPosition: 'left' | 'right' = 'left';
  @Input() maxlength: number | null = null;
  @Input() minlength: number | null = null;
  @Input() readonly: boolean = false;
  @Input() autocomplete: string = 'off';
  @Input() errorMessage: string = '';
  @Input() helperText: string = '';
  @Input() fullWidth: boolean = false;
  @Input() width: string = 'fit-content';
  @Input() libMask: string = '';

  @Input() ngModel: any;
  @Output() ngModelChange = new EventEmitter<any>();

  @Output() valueChanged = new EventEmitter<string>();

  value: string = '';
  isFocused: boolean = false;
  uniqueId: string = '';

  private onChange = (value: any) => { };
  private onTouched = () => { };

  constructor() {

  }

  ngOnInit() {
    this.uniqueId = `ds-input-${Math.random().toString(36).substr(2, 9)}`;

    if (this.ngModel !== undefined && this.ngModel !== null) {
      this.value = String(this.ngModel);
    }
  }

  ngOnDestroy() { }


  writeValue(value: any): void {
    if (value === null || value === undefined) {
      this.value = '';
    } else {

      this.value = String(value);
    }
  }

  registerOnChange(fn: (value: any) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }


  onInputChange(newValue: any): void {
    if (newValue === null || newValue === undefined) return;

    let stringValue = String(newValue);

    if (this.type === 'number') {
      this.value = stringValue;
      this.onChange(stringValue);
      this.ngModelChange.emit(stringValue);
      this.valueChanged.emit(stringValue);
      return;
    }

    this.value = stringValue;
    this.onChange(stringValue);
    this.ngModelChange.emit(stringValue);
    this.valueChanged.emit(stringValue);
  }


  onInputFocus(): void {
    this.isFocused = true;
  }

  onInputBlur(): void {
    this.isFocused = false;
    this.onTouched();
  }


  get inputClasses(): string {
    const classes = ['input-field'];

    if (this.invalid) classes.push('invalid');
    if (this.disabled) classes.push('disabled');
    if (this.readonly) classes.push('readonly');
    if (this.icon) classes.push(`has-icon-${this.iconPosition}`);

    return classes.join(' ');
  }

  get labelClasses(): string {
    const classes = [];
    if (this.required) classes.push('required');
    return classes.join(' ');
  }

  get showError(): boolean {
    return this.invalid && !!this.errorMessage;
  }

  get showHelper(): boolean {
    return !this.showError && !!this.helperText;
  }

  /**
   * Retorna o tipo efetivo do input.
   * Se tiver máscara de moeda, força type="text" para evitar erro de parse
   */
  get effectiveType(): string {

    const currencyMasks = ['BRL', 'USD', 'EUR', 'GBP'];
    if (this.libMask && currencyMasks.includes(this.libMask.toUpperCase())) {
      return 'text';
    }
    return this.type;
  }

  get safeValue(): string {
    if (this.value === null || this.value === undefined) {
      return '';
    }
    return String(this.value);
  }


  get safeMaxlength(): number | null {
    return this.maxlength;
  }

  get safeMinlength(): number | null {
    return this.minlength;
  }
}
