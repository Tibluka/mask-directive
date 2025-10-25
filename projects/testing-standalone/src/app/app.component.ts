import { Component } from '@angular/core';
import { FormControl, FormGroup, FormsModule, NgModel, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaskDirectiveModule } from '../../../mask-directive/src/lib/mask-directive.module';
import { MaskDirectiveService } from '../../../mask-directive/src/lib/mask-directive.service';
import { CommonModule } from '@angular/common';
import { InputComponent } from './input/input.component';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaskDirectiveModule,
    FormsModule,
    InputComponent
  ],
  providers: [NgModel],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'testing-standalone';

  // Formulário para testar validação automática
  form = new FormGroup({
    cpfCnpj: new FormControl('', [Validators.required]),
  });

  constructor() {
    // Log quando o form é criado
    console.log('📝 AppComponent - Form criado:', this.form);

    // Monitora mudanças no form
    this.form.valueChanges.subscribe(value => {
      console.log('📝 AppComponent - Form value changed:', value);
      console.log('📝 AppComponent - Form valid:', this.form.valid);
      console.log('📝 AppComponent - CPF valid:', this.form.get('cpfCnpj')?.valid);
      console.log('📝 AppComponent - CPF errors:', this.form.get('cpfCnpj')?.errors);
    });
  }

  testValidation() {
    console.log('🧪 === TESTE DE VALIDAÇÃO ===');
    console.log('📝 Form válido:', this.form.valid);
    console.log('📝 CPF valor:', this.form.get('cpfCnpj')?.value);
    console.log('📝 CPF válido:', this.form.get('cpfCnpj')?.valid);
    console.log('📝 CPF errors:', this.form.get('cpfCnpj')?.errors);
    console.log('📝 CPF touched:', this.form.get('cpfCnpj')?.touched);
    console.log('📝 CPF dirty:', this.form.get('cpfCnpj')?.dirty);

    // Força validação
    this.form.get('cpfCnpj')?.markAsTouched();
    this.form.get('cpfCnpj')?.updateValueAndValidity();

    console.log('📝 Após markAsTouched - CPF válido:', this.form.get('cpfCnpj')?.valid);
    console.log('📝 Após markAsTouched - CPF errors:', this.form.get('cpfCnpj')?.errors);
  }
}
