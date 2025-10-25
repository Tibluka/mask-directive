import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false
})
export class AppComponent {

  form = new FormGroup({
    to: new FormControl('', [Validators.required])
  })

  title = 'testing2';
  cpf: string = '';

  // Propriedades para máscaras de moeda
  valorBRL: string = '';
  valorUSD: string = '';
  valorEUR: string = '';


  click() {
    console.log('Form Values:', this.form.value);
    console.log('Form Valid:', this.form.valid);
    console.log('Form Errors:', this.form.errors);
    console.log('Individual Field Errors:');
    console.log('- Telefone:', this.form.get('to')?.errors);
    console.log('- CPF:', this.form.get('cpf')?.errors);
    console.log('- Valor BRL:', this.form.get('valorBRL')?.errors);
  }

  update(ev: any) {
    debugger
  }
}
