import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { FormsModule, NgModel, ReactiveFormsModule } from '@angular/forms';
import { MaskDirectiveModule } from 'mask-directive';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    MaskDirectiveModule,
    ReactiveFormsModule,
    FormsModule
  ],
  providers: [NgModel],
  bootstrap: [AppComponent]
})
export class AppModule { }
