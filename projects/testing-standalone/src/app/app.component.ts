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
    // Monitora mudanças no form
    this.form.valueChanges.subscribe(value => {
      // Form value changed
    });
  }

  testValidation() {
    // Força validação
    this.form.get('cpfCnpj')?.markAsTouched();
    this.form.get('cpfCnpj')?.updateValueAndValidity();
  }
}
