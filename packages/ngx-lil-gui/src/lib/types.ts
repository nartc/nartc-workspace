import GUI, { Controller } from 'lil-gui';

export type AnyRecord = Record<any, any>;

export type NgxLilGuiChange = Parameters<
  Parameters<typeof GUI.prototype.onChange>[0]
>[0] & { gui: GUI };
export type NgxLilGuiFinishChange = Parameters<
  Parameters<typeof GUI.prototype.onFinishChange>[0]
>[0] & { gui: GUI };

export type NgxLilGuiControllerChange = {
  value: any;
  controller: Controller;
};

export type NgxLilGuiControllerFinishChange = {
  value: any;
  controller: Controller;
};

export interface NgxLilGuiControllerNumberConfig {
  min: number;
  max?: number;
  step?: number;
  onChange?: (arg: NgxLilGuiControllerChange) => void;
  onFinishChange?: (arg: NgxLilGuiControllerFinishChange) => void;
}

export interface NgxLilGuiControllerSelectConfig {
  collection: string[] | AnyRecord;
  onChange?: (arg: NgxLilGuiControllerChange) => void;
  onFinishChange?: (arg: NgxLilGuiControllerFinishChange) => void;
}

export interface NgxLilGuiControllerConfig {
  [K: string]:
    | NgxLilGuiControllerNumberConfig
    | NgxLilGuiControllerSelectConfig;
}

export interface NgxLilGuiColorConfig {
  [K: string]: {
    rgbScale?: number;
    onChange?: (arg: NgxLilGuiControllerChange) => void;
    onFinishChange?: (arg: NgxLilGuiControllerFinishChange) => void;
  };
}

export interface NgxLilGuiConfig {
  object: AnyRecord;
  controllers?: NgxLilGuiControllerConfig;
  colors?: NgxLilGuiColorConfig;
  guis?: { [K: string]: NgxLilGuiConfig };
}
