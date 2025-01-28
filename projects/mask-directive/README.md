# Installing

Angular version 19.x.x

$ npm install --save mask-directive

Angular version 13.x.x

$ npm install --save mask-directive@13

# Quickstart if ngx-mask version < 19.0.0

import { MaskDirective } from 'mask-directive';

@Component({
   selector: 'my-testing',
   templateUrl: './my-testing.component.html',
   styleUrls: ['./my-testing.component.css'],
   standalone: true,
   imports: [
      MaskDirective,
      MaskPipe   
   ],
   providers: [
         (...)
   ],
})

# Quickstart if ngx-mask version >= 13.0.0

import { MaskDirective } from 'mask-directive';

@NgModule({
  imports: [
   MaskDirective,
   MaskPipe
  ],
  providers: [
    (...)
  ]
})

# Usage

<input type="text" [(ngModel)]="cpf" libMask="000.000.000-00">

<input type="text" [(ngModel)]="cnpj" libMask="00.000.000/0000-00">

<input type="text" [(ngModel)]="cpf/cnpj" libMask="000.000.000-00||00.000.000/0000-00">

Adicionalmente, você pode utilizar o mask-directive como pipe:

<span>{{phone | libPipe: '(00) 0000-0000||(00) 00000-0000'}}</span>