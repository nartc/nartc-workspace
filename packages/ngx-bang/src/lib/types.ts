export type VoidFunction = () => void;

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

export type StateProxy<TData extends object = object> = {
  [TKey in keyof TData]: TData[TKey] extends AsRef
    ? TData[TKey]
    : TData[TKey] extends object
    ? StateProxy<TData[TKey]>
    : TData[TKey];
};

export type StateObject = object;
export type Path = (string | symbol)[];
export type Op =
  | [op: 'set', path: Path, value: unknown, prevValue: unknown]
  | [op: 'delete', path: Path, prevValue: unknown]
  | [op: 'next', path: Path, value: unknown]
  | [op: 'error', path: Path, error: unknown]
  | [op: 'resolved', path: Path, value: unknown]
  | [op: 'rejected', path: Path, error: unknown];
export type Watcher = (op: Op, nextVersion: number) => void;

export type DeriveGet = <TData extends object>(
  stateProxy: StateProxy<TData>
) => TData;

export type DeriveSubscriptions<TDerive extends object> = Map<
  StateProxy<TDerive>,
  [callbackMap: Map<keyof TDerive, VoidFunction>, unsubscribe: VoidFunction]
>;

export type DeriveFns<TDerived extends object> = {
  [TDeriveKey in keyof TDerived]: (
    get: DeriveGet,
    snapshot: TDerived
  ) => TDerived[TDeriveKey];
};

export const enum AsRef {}
