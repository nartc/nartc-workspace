export type VoidFunction = () => void;
export type InvalidateFunction = (isAsync?: boolean) => void;
export type AnyFunction = (...args: any[]) => any;

export interface UnsubscribeObject {
  unsubscribe: VoidFunction;
}

export type Unsubscribe = VoidFunction | UnsubscribeObject;

export type CleanUpFn = (isUnsubscribed: boolean) => void;
export type EffectFn = () => CleanUpFn | void;
export type EffectFnWithCondition = () => [
  (CleanUpFn | void)?,
  (() => boolean)?
];

export type Snapshot<TData> = TData extends AnyFunction
  ? TData
  : TData extends AsRef
  ? Omit<TData, '$$bangRef'>
  : TData extends object
  ? { [TKey in keyof TData]: Snapshot<TData[TKey]> }
  : TData;

export type Path = (string | symbol)[];
export type Op =
  | [op: 'set', path: Path, value: unknown, prevValue: unknown]
  | [op: 'delete', path: Path, prevValue: unknown]
  | [op: 'next', path: Path, value: unknown]
  | [op: 'error', path: Path, error: unknown]
  | [op: 'resolved', path: Path, value: unknown]
  | [op: 'rejected', path: Path, error: unknown];
export type Watcher = (op: Op, nextVersion: number) => void;

export type DeriveGet = <TData extends object>(stateProxy: TData) => TData;

export type DeriveSubscription = {
  s: object; // "s"ourceObject
  d: object; // "d"erivedObject
  k: string; // derived "k"ey
  c: () => void; // "c"allback
  n: boolean; // "n"otifyInSync
  i: string[]; // "i"goringKeys
  p?: Promise<void>; // "p"romise
};

export type DeriveSourceObjectEntry = [
  subscriptions: Set<DeriveSubscription>,
  unsubscribe: () => void,
  pendingCount: number,
  pendingCallbacks: Set<() => void>
];

export type DerivedObjectEntry = [subscriptions: Set<DeriveSubscription>];

export type DeriveFns<TDerived extends object> = {
  [TDeriveKey in keyof TDerived]: (
    get: DeriveGet,
    snapshot: Snapshot<TDerived>
  ) => TDerived[TDeriveKey];
};

export type AsRef = { $$bangRef: true };
