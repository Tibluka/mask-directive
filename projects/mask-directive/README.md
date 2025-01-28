# Installing

$ npm install --save mask-directive

# Quickstart if mask-directive is STANDALONE

import { MaskDirective } from 'mask-directive';
import { NgModel } from '@angular/forms';

---app.component.ts---
@Component({
   selector: 'my-testing',
   templateUrl: './my-testing.component.html',
   styleUrls: ['./my-testing.component.css'],
   standalone: true,
   imports: [
      MaskDirectiveModule
   ],
   providers: [NgModel] // Adicionar NgModel
})

# Quickstart if mask-directive is used in module

import { MaskDirective } from 'mask-directive';

---app.module.ts---
@NgModule({
    imports: [
      MaskDirectiveModule
   ]
})

---app.component.ts---
@Component({
   selector: 'my-testing',
   templateUrl: './my-testing.component.html',
   styleUrls: ['./my-testing.component.css'],
   providers: [NgModel] // Adicionar NgModel
})



# Usage

<input type="text" [(ngModel)]="cpf" libMask="000.000.000-00">

<input type="text" [(ngModel)]="cnpj" libMask="00.000.000/0000-00">

<input type="text" [(ngModel)]="cpf/cnpj" libMask="000.000.000-00||00.000.000/0000-00">

Adicionalmente, você pode utilizar o mask-directive como pipe:

<span>{{phone | libPipe: '(00) 0000-0000||(00) 00000-0000'}}</span>