import { NgModule } from '@angular/core';
import { NgxLilGuiColor } from './ngx-lil-gui-color.component';
import { NgxLilGuiController } from './ngx-lil-gui-controller.component';
import { NgxLilGui } from './ngx-lil-gui.component';

@NgModule({
  declarations: [NgxLilGui, NgxLilGuiController, NgxLilGuiColor],
  exports: [NgxLilGui, NgxLilGuiController, NgxLilGuiColor],
})
export class NgxLilGuiModule {}
