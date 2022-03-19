import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TranslateModule } from '@ngx-translate/core';

import { PageNotFoundComponent } from './components/';
import { WebviewDirective } from './directives/';
import { ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../material.module';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ErrorDialogComponent } from './components/error-dialog/error-dialog.component';
import { LoaderDialogComponent } from './components/loader-dialog/loader-dialog.component';

@NgModule({
  declarations: [PageNotFoundComponent, WebviewDirective, ErrorDialogComponent, LoaderDialogComponent],
  imports: [CommonModule, TranslateModule, ReactiveFormsModule, MaterialModule],
  exports: [
    TranslateModule, WebviewDirective, ReactiveFormsModule, MaterialModule, FlexLayoutModule
  ]
})
export class SharedModule { }
