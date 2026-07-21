import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

function matchesPattern(value: string, pattern: string): boolean {
  if (!value || !pattern) return false;

  const cleanValue = value.replace(/[^a-zA-Z0-9]/g, '');
  const cleanPattern = pattern.replace(/[^0A*]/g, '');

  if (cleanValue.length !== cleanPattern.length) {
    return false;
  }

  for (let i = 0; i < cleanValue.length; i++) {
    const valueChar = cleanValue[i];
    const patternChar = cleanPattern[i];

    if (patternChar === '0' && !/\d/.test(valueChar)) {
      return false;
    }
    if (patternChar === 'A' && !/[a-zA-Z]/.test(valueChar)) {
      return false;
    }
    if (patternChar === '*' && !/[a-zA-Z0-9]/.test(valueChar)) {
      return false;
    }
  }

  return true;
}

export function maskPatternValidator(maskPattern: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value || control.value === '') return null;

    const value = control.value.toString();
    const patterns = maskPattern.split('||');
    const isValid = patterns.some(pattern => matchesPattern(value, pattern));

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

export function createMaskValidator(maskPattern: string): ValidatorFn {
  return maskPatternValidator(maskPattern);
}
