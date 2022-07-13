import { NgModule } from '@angular/core';
import { NgxLilGuiColor } from './ngx-lil-gui-color.component';
import { NgxLilGuiController } from './ngx-lil-gui-controller.component';
import { NgxLilGui } from './ngx-lil-gui.component';

/**
 * @description Using standalone components is recommended
 */
@NgModule({
  imports: [NgxLilGui, NgxLilGuiController, NgxLilGuiColor],
  exports: [NgxLilGui, NgxLilGuiController, NgxLilGuiColor],
})
export class NgxLilGuiModule {}
