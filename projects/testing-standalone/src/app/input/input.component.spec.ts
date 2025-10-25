import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Directive, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { InputComponent } from './input.component';
import { IconComponent } from '../icon/icon.component';

// Mock da MaskDirective para evitar dependência de NgModel interno
@Directive({
  selector: '[libMask]',
  standalone: true
})
class MockMaskDirective {
  @Input() libMask: string = '';
  @Input() dropSpecialCharacters: boolean = false;
}

describe('InputComponent', () => {
  let component: InputComponent;
  let fixture: ComponentFixture<InputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputComponent]
    })
      .overrideComponent(InputComponent, {
        set: {
          imports: [
            CommonModule,
            IconComponent,
            FormsModule,
            MockMaskDirective  // Usa a mock ao invés da real
          ]
        }
      })
      .compileComponents();

    fixture = TestBed.createComponent(InputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.label).toBe('');
    expect(component.placeholder).toBe('');
    expect(component.type).toBe('text');
    expect(component.required).toBe(false);
    expect(component.disabled).toBe(false);
  });

  it('should generate unique ID on init', () => {
    expect(component.uniqueId).toContain('ds-input-');
    expect(component.uniqueId.length).toBeGreaterThan('ds-input-'.length);
  });

  it('should handle value changes', () => {
    const mockEvent = { value: 'test value' };
    spyOn(component.valueChanged, 'emit');

    component.onInputChange(mockEvent);

    expect(component.value).toBe('test value');
    expect(component.valueChanged.emit).toHaveBeenCalledWith('test value');
  });

  it('should handle focus and blur events', () => {
    expect(component.isFocused).toBe(false);

    component.onInputFocus();
    expect(component.isFocused).toBe(true);

    component.onInputBlur();
    expect(component.isFocused).toBe(false);
  });

  it('should apply correct CSS classes based on state', () => {
    component.invalid = true;
    expect(component.inputClasses).toContain('invalid');

    component.disabled = true;
    expect(component.inputClasses).toContain('disabled');

    component.readonly = true;
    expect(component.inputClasses).toContain('readonly');
  });

  it('should show error message when invalid and errorMessage is set', () => {
    component.invalid = false;
    component.errorMessage = '';
    expect(component.showError).toBe(false);

    component.invalid = true;
    component.errorMessage = 'Error message';
    expect(component.showError).toBe(true);
  });

  it('should show helper text when not invalid and helperText is set', () => {
    component.invalid = false;
    component.helperText = 'Helper text';
    expect(component.showHelper).toBe(true);

    component.invalid = true;
    component.errorMessage = 'Error';
    expect(component.showHelper).toBe(false);
  });

  it('should implement ControlValueAccessor methods', () => {
    const onChange = jasmine.createSpy('onChange');
    const onTouched = jasmine.createSpy('onTouched');

    component.registerOnChange(onChange);
    component.registerOnTouched(onTouched);

    component.writeValue('new value');
    expect(component.value).toBe('new value');

    component.setDisabledState(true);
    expect(component.disabled).toBe(true);
  });
});
