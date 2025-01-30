
# Mask Directive

A lightweight Angular library for applying masks to inputs and using them as pipes.

## Installing

To install the library, use the following commands depending on your Angular version:

### For Angular 18+
```bash
$ npm install --save mask-directive@latest
```

### For Angular 13
```bash
$ npm install --save mask-directive@angular-13
```

## Quickstart

### If `mask-directive` is STANDALONE:

First, import `MaskDirective` and `NgModel` into your standalone component.

```typescript
import { MaskDirective } from 'mask-directive';
import { NgModel } from '@angular/forms';

@Component({
   selector: 'my-testing',
   templateUrl: './my-testing.component.html',
   styleUrls: ['./my-testing.component.css'],
   standalone: true,
   imports: [
      MaskDirective
   ],
   providers: [NgModel] // Add NgModel
})
export class MyTestingComponent {}
```

### If `mask-directive` is used in a Module:

Import `MaskDirective` into your module.

```typescript
import { MaskDirective } from 'mask-directive';

@NgModule({
    imports: [
      MaskDirective
   ]
})
export class AppModule {}
```

Then, use it in your component.

```typescript
import { Component } from '@angular/core';
import { NgModel } from '@angular/forms';

@Component({
   selector: 'my-testing',
   templateUrl: './my-testing.component.html',
   styleUrls: ['./my-testing.component.css'],
   providers: [NgModel] // Add NgModel
})
export class MyTestingComponent {}
```

## Usage

You can use the `mask-directive` with Angular's two-way binding to format inputs. Below are some examples:

### Input Mask Examples

#### CPF Mask:
```html
<input type="text" [(ngModel)]="cpf" libMask="000.000.000-00">
console.log('Ex: 123.456.789-00')
```

#### CNPJ Mask:
```html
<input type="text" [(ngModel)]="cnpj" libMask="00.000.000/0000-00">
console.log('Ex: 12.345.678/0001-90')
```

#### CPF/CNPJ Dynamic Mask:
```html
<input type="text" [(ngModel)]="cpfCnpj" libMask="000.000.000-00||00.000.000/0000-00">
console.log('Ex: 123.456.789-00' or 'Ex: 12.345.678/0001-90')
```

#### dropSpecialCharacters (valueChanged) output:
```html
<input type="text" [(ngModel)]="cpfCnpj" libMask="000.000.000-00" [dropSpecialCharacters]="true"
 (valueChanged)="cpfCnpj = $event">
console.log('Ex: 12345678900')
```

```html
<form [formGroup]="reactiveForm">
   <input type="text" formControlName="cpfCnpj" libMask="000.000.000-00" [dropSpecialCharacters]="true"
      (valueChanged)="reactiveForm.get('cpfCnpj').setValue($event)">
</form>
console.log('Ex: 12345678900')
```

### Using as a Pipe

You can also use `mask-directive` as a pipe to format text dynamically:

#### Phone Number Mask:
```html
<span>{{ phone | libPipe: '(00) 0000-0000||(00) 00000-0000' }}</span>
```