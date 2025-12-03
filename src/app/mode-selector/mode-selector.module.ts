
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModeSelectorComponent } from './mode-selector/mode-selector.component';
import { SharedModule } from '../shared/shared.module';   // YOU already have this
import { FormsModule, ReactiveFormsModule } from '@angular/forms';


@NgModule({
  declarations: [ModeSelectorComponent],
  imports: [
    CommonModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule
  ],
  exports: [ModeSelectorComponent]   // <== IMPORTANT
})
export class ModeSelectorModule { }
