import { NgModule } from '@angular/core';
import { MaskDirective } from './mask-directive.component';
import { MaskPipe } from './mask.pipe';
import { FormsModule, NgModel } from '@angular/forms';


@NgModule({
  declarations: [
    MaskDirective,
    MaskPipe
  ],
  exports: [
    MaskDirective,
    MaskPipe
  ]
})
export class MaskDirectiveModule { }
