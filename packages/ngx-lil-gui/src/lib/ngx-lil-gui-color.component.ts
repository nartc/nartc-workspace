import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Optional,
  Output,
  SkipSelf,
} from '@angular/core';
import { ColorController } from 'lil-gui';
import { NgxLilGui } from './ngx-lil-gui.component';
import type {
  NgxLilGuiColorConfig,
  NgxLilGuiControllerChange,
  NgxLilGuiControllerFinishChange,
} from './types';

@Component({
  selector: 'ngx-lil-gui-color[property]',
  template: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgxLilGuiColor implements OnInit, OnDestroy {
  @Input() property!: string;
  @Input() colorConfig?: NgxLilGuiColorConfig[string];

  @Output() valueChange = new EventEmitter<NgxLilGuiControllerChange>();
  @Output() finishChange = new EventEmitter<NgxLilGuiControllerFinishChange>();
  @Output() colorReady = new EventEmitter<ColorController>();
  @Output() preAdd = new EventEmitter<void>();

  #colorController?: ColorController;

  get colorController() {
    return this.#colorController;
  }

  constructor(@Optional() @SkipSelf() private parentGui: NgxLilGui) {
    if (!parentGui) {
      throw new Error('ngx-lil-gui-color must be used within a ngx-lil-gui');
    }
  }

  ngOnInit() {
    this.preAdd.emit();

    this.#colorController = this.parentGui.addColor(
      this.property,
      this.colorConfig
    );
    this.parentGui.run(() => {
      if (this.colorController) {
        this.colorController.updateDisplay();

        this.colorController.onChange((value: any) => {
          this.valueChange.emit({ value, controller: this.colorController! });
        });
        this.colorController.onFinishChange((value: any) => {
          this.finishChange.emit({ value, controller: this.colorController! });
        });
        this.colorReady.emit(this.colorController!);
      }
    });
  }

  ngOnDestroy() {
    if (this.colorController) {
      this.colorController.destroy();
    }
  }
}
