import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Optional,
  Output,
  SkipSelf,
} from '@angular/core';
import GUI, { ColorController, Controller } from 'lil-gui';
import type {
  AnyRecord,
  NgxLilGuiChange,
  NgxLilGuiColorConfig,
  NgxLilGuiConfig,
  NgxLilGuiControllerChange,
  NgxLilGuiControllerConfig,
  NgxLilGuiControllerNumberConfig,
  NgxLilGuiControllerSelectConfig,
  NgxLilGuiFinishChange,
} from './types';

@Component({
  selector: `
    ngx-lil-gui:not([config]):not([object]),
    ngx-lil-gui[config]:not([object]),
    ngx-lil-gui[object]:not([config])
  `,
  template: ` <ng-content></ng-content> `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgxLilGui implements OnInit, OnDestroy {
  @Input() zoneless = false;
  @Input() self = false;

  @Input() autoPlace?: boolean;
  @Input() container?: HTMLElement | false;
  @Input() width?: number;
  @Input() title?: string;
  @Input() injectStyles?: boolean;
  @Input() touchStyles?: number;

  @Input() object?: AnyRecord;
  @Input() config?: NgxLilGuiConfig;

  @Output() guiChange = new EventEmitter<NgxLilGuiChange>();
  @Output() guiFinishChange = new EventEmitter<NgxLilGuiFinishChange>();
  @Output() guiReady = new EventEmitter<GUI>();

  #gui!: GUI;

  constructor(
    @SkipSelf() private hostElement: ElementRef<HTMLElement>,
    @Optional() @SkipSelf() @Inject(NgxLilGui) private parentGUI: NgxLilGui,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    this.run(() => {
      this.zoneless = this.parentGUI?.zoneless ?? this.zoneless;
      let container: HTMLElement | undefined =
        this.container instanceof HTMLElement
          ? this.container
          : this.hostElement.nativeElement;

      if (typeof this.container === 'boolean') {
        container = undefined;
      }

      this.#gui = new GUI({
        container,
        touchStyles: this.touchStyles,
        autoPlace: this.autoPlace,
        injectStyles: this.injectStyles,
        width: this.width,
        title: this.title,
        parent: this.self ? undefined : this.parentGUI?.gui || undefined,
      });

      this.#setupEvents();

      if (this.config) {
        this.#buildGUI(this.config);
      }

      this.guiReady.emit(this.gui);
    });
  }

  get gui(): GUI {
    return this.#gui;
  }

  addController(
    property: string,
    controllerConfig?: NgxLilGuiControllerConfig[string]
  ): Controller | undefined {
    return this.run(() => {
      if (this.object) {
        const [, , ...config] = extractControllerConfig(controllerConfig);
        return this.gui.add(this.object, property, ...config);
      }
      return undefined;
    });
  }

  addColor(
    property: string,
    colorConfig?: NgxLilGuiColorConfig[string]
  ): ColorController | undefined {
    return this.run(() => {
      if (this.object) {
        return this.gui.addColor(
          this.object,
          property,
          colorConfig?.rgbScale
        ) as ColorController;
      }

      return undefined;
    });
  }

  run<TReturn = void>(fn: () => TReturn): TReturn {
    if (this.zoneless) {
      return this.ngZone.runOutsideAngular(() => {
        return fn();
      });
    }

    return fn();
  }

  ngOnDestroy() {
    this.run(() => {
      this.#gui.destroy();
    });
  }

  #setupEvents() {
    this.gui.onChange((arg0) => {
      this.guiChange.emit({ ...arg0, gui: this.gui });
    });

    this.gui.onFinishChange((arg0) => {
      this.guiFinishChange.emit({ ...arg0, gui: this.gui });
    });
  }

  #buildGUI(config: NgxLilGuiConfig, gui = this.gui) {
    const { guis, colors, object, controllers } = config as NgxLilGuiConfig;

    for (const [controllerKey, controllerValue] of Object.entries(
      controllers || {}
    )) {
      const [onChange, onFinishChange, ...config] =
        extractControllerConfig(controllerValue);
      const controller = gui.add(object, controllerKey, ...config);
      if (onChange) {
        controller.onChange((value: any) => {
          onChange({ value, controller });
        });
      }

      if (onFinishChange) {
        controller.onFinishChange((value: any) => {
          onFinishChange({ value, controller });
        });
      }
    }

    for (const [colorKey, colorValue] of Object.entries(colors || {})) {
      const { rgbScale, onChange, onFinishChange } = colorValue;
      const controller = gui.addColor(object, colorKey, rgbScale);
      if (onChange) {
        controller.onChange((value: any) => {
          onChange({ value, controller });
        });
      }

      if (onFinishChange) {
        controller.onFinishChange((value: any) => {
          onFinishChange({ value, controller });
        });
      }
    }

    for (const [folderKey, folderConfig] of Object.entries(guis || {})) {
      const folder = gui.addFolder(folderKey);
      this.#buildGUI(folderConfig, folder);
    }
  }
}

function extractControllerConfig(
  controllerConfig?: NgxLilGuiControllerConfig[string]
): [
  ((arg: NgxLilGuiControllerChange) => void) | undefined,
  ((arg: NgxLilGuiControllerChange) => void) | undefined,
  (number | string[] | AnyRecord)?,
  number?,
  number?
] {
  const config: [
    ((arg: NgxLilGuiControllerChange) => void) | undefined,
    ((arg: NgxLilGuiControllerChange) => void) | undefined,
    (number | string[] | AnyRecord)?,
    number?,
    number?
  ] = [undefined, undefined];

  if (controllerConfig) {
    config[0] = controllerConfig.onChange;
    config[1] = controllerConfig.onFinishChange;

    config[2] =
      (controllerConfig as NgxLilGuiControllerSelectConfig).collection ||
      (controllerConfig as NgxLilGuiControllerNumberConfig).min;

    config[3] = (controllerConfig as NgxLilGuiControllerNumberConfig).max;
    config[4] = (controllerConfig as NgxLilGuiControllerNumberConfig).step;
  }

  return config;
}
