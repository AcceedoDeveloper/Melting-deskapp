import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PageNotFoundComponent } from './shared/components';

import { HomeRoutingModule } from './home/home-routing.module';
import { DetailRoutingModule } from './detail/detail-routing.module';
import { ModeSelectorRoutingModule } from './mode-selector/mode-selector.routing.module';
import { CalendarRoutingModule} from './calender/calendar.routing.module';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: '**',
    component: PageNotFoundComponent
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' }),
    HomeRoutingModule,
    DetailRoutingModule,
    ModeSelectorRoutingModule,
    CalendarRoutingModule
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
