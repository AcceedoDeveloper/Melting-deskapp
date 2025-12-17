import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import {CalendarComponent } from './calendar/calendar.component';

const routes: Routes = [
  {
    path: 'calendar',
    component: CalendarComponent
  }
];


@NgModule({
  declarations: [],
  imports: [CommonModule, RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CalendarRoutingModule {}