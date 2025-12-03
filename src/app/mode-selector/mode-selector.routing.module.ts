import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { ModeSelectorComponent } from './mode-selector/mode-selector.component';

const routes: Routes = [
  {
    path: 'settings',
    component: ModeSelectorComponent
  }
];

@NgModule({
  declarations: [],
  imports: [CommonModule, RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ModeSelectorRoutingModule {}