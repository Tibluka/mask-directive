import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false
})
export class AppComponent {

  title = 'testing2';

  // ---------------------------------------------------------------------
  // Reactive Forms (formControlName) — máscaras de padrão e de moeda
  // ---------------------------------------------------------------------
  form = new FormGroup({
    telefone: new FormControl('', [Validators.required]),
    placa: new FormControl(''),
    placaMercosul: new FormControl(''),
    valorBRLForm: new FormControl(''),
  });

  // ---------------------------------------------------------------------
  // Template-driven (ngModel) — máscaras de padrão
  // ---------------------------------------------------------------------
  cpf: string = '';
  codigoSku: string = '';
  numeroSemMascara: string = '';

  // ---------------------------------------------------------------------
  // Template-driven (ngModel) — máscaras de moeda (qualquer ISO 4217)
  // ---------------------------------------------------------------------
  valorBRL: string = '';
  valorUSD: string = '';
  valorEUR: string = '';
  valorJPY: string = '';
  valorCHF: string = '';
  valorGBP: string = '';
  valorGBPBritanico: string = '';
  valorKWD: string = '';

  logForm(): void {
    console.log('Form Values:', this.form.value);
    console.log('Form Valid:', this.form.valid);
    console.log('Form Errors:');
    console.log('- Telefone:', this.form.get('telefone')?.errors);
    console.log('- Placa:', this.form.get('placa')?.errors);
    console.log('- Valor BRL (form):', this.form.get('valorBRLForm')?.errors);
  }

  definirValoresProgramaticamente(): void {
    this.form.patchValue({
      telefone: '11912345678',
      placa: 'ABC1234',
      valorBRLForm: '987654',
    });
    this.cpf = '52998224725';
    this.valorBRL = '250050';
  }

  limparTudo(): void {
    this.form.reset();
    this.cpf = '';
    this.codigoSku = '';
    this.numeroSemMascara = '';
    this.valorBRL = '';
    this.valorUSD = '';
    this.valorEUR = '';
    this.valorJPY = '';
    this.valorCHF = '';
    this.valorGBP = '';
    this.valorGBPBritanico = '';
    this.valorKWD = '';
  }
}
