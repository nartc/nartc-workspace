import {
  Directive,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { Controller } from 'lil-gui';
import { NgxLilGui } from './ngx-lil-gui.component';
import type {
  NgxLilGuiControllerChange,
  NgxLilGuiControllerConfig,
  NgxLilGuiControllerFinishChange,
} from './types';

@Directive({
  selector: 'ngx-lil-gui-controller',
  standalone: true,
})
export class NgxLilGuiController implements OnInit, OnDestroy {
  @Input({ required: true }) property!: string;
  @Input() controllerConfig?: NgxLilGuiControllerConfig[string];

  @Output() valueChange = new EventEmitter<NgxLilGuiControllerChange>();
  @Output() finishChange = new EventEmitter<NgxLilGuiControllerFinishChange>();
  @Output() controllerReady = new EventEmitter<Controller>();
  @Output() preAdd = new EventEmitter<void>();

  #controller?: Controller;

  #parentGui = inject(NgxLilGui, { optional: true, skipSelf: true });

  ngOnInit() {
    if (!this.#parentGui) {
      throw new Error(
        'ngx-lil-gui-controller must be used within a ngx-lil-gui'
      );
    }

    this.preAdd.emit();

    this.#controller = this.#parentGui.addController(
      this.property,
      this.controllerConfig
    );
    this.#parentGui.run(() => {
      if (this.controller) {
        this.controller.updateDisplay();

        this.controller.onChange((value: any) => {
          this.valueChange.emit({ value, controller: this.controller! });
        });
        this.controller.onFinishChange((value: any) => {
          this.finishChange.emit({ value, controller: this.controller! });
        });

        this.controllerReady.emit(this.controller);
      }
    });
  }

  ngOnDestroy() {
    if (this.controller) {
      this.controller.destroy();
    }
  }

  get controller(): Controller | undefined {
    return this.#controller;
  }
}
