import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { FormsModule, NgModel, ReactiveFormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { MaskDirectiveModule } from 'projects/mask-directive/src/public-api';

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
