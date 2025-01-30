import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  form = new FormGroup({
    to: new FormControl('')
  })
  
  title = 'testing2';
  cpf: string = '';


  click() {
    console.log(this.form.value.to);

  }

  update(ev: any) {
    debugger
  }
}
