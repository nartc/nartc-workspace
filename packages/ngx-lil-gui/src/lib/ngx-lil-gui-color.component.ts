import {
  Directive,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { ColorController } from 'lil-gui';
import { NgxLilGui } from './ngx-lil-gui.component';
import type {
  NgxLilGuiColorConfig,
  NgxLilGuiControllerChange,
  NgxLilGuiControllerFinishChange,
} from './types';

@Directive({
  selector: 'ngx-lil-gui-color',
  standalone: true,
})
export class NgxLilGuiColor implements OnInit, OnDestroy {
  @Input({ required: true }) property!: string;
  @Input() colorConfig?: NgxLilGuiColorConfig[string];

  @Output() valueChange = new EventEmitter<NgxLilGuiControllerChange>();
  @Output() finishChange = new EventEmitter<NgxLilGuiControllerFinishChange>();
  @Output() colorReady = new EventEmitter<ColorController>();
  @Output() preAdd = new EventEmitter<void>();

  #colorController?: ColorController;

  get colorController() {
    return this.#colorController;
  }

  #parentGui = inject(NgxLilGui, { skipSelf: true, optional: true });

  ngOnInit() {
    if (!this.#parentGui) {
      throw new Error('ngx-lil-gui-color must be used within a ngx-lil-gui');
    }

    this.preAdd.emit();

    this.#colorController = this.#parentGui.addColor(
      this.property,
      this.colorConfig
    );
    this.#parentGui.run(() => {
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
