import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  form = new FormGroup({
    to: new FormControl('11123231232')
  })
  
  title = 'testing2';
  cpf: string = '11123231232';


  click() {
    console.log(this.cpf);

  }

  update(ev: any) {
    debugger
  }
}
