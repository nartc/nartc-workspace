import { ChangeDetectorRef } from '@angular/core';
import {
  DERIVES,
  EFFECTS,
  INVALIDATE,
  PREV_SNAPSHOT,
  PROP_WATCHERS,
  SET_UNSUBSCRIBES,
  SNAPSHOT,
  UNSUBSCRIBES,
  VERSION,
  WATCHERS,
} from './symbols';
import type {
  AsRef,
  CleanUpFn,
  EffectFn,
  EffectFnWithCondition,
  Op,
  Path,
  Snapshot,
  StateProxy,
  Unsubscribe,
  Watcher,
} from './types';

export let globalVersion = 1;

export const refSet = new WeakSet();
export const ref = <T extends object>(o: T): T & AsRef => {
  refSet.add(o);
  return o as T & AsRef;
};

export const setGlobalVersion = (version: number) => {
  globalVersion = version;
  return globalVersion;
};

export const noop = () => {};

export function notEqual(a: unknown, b: unknown): boolean {
  const tOfA = typeof a;
  if (tOfA !== 'function' && tOfA !== 'object') {
    return !Object.is(a, b);
  }
  return true;
}

export const callUnsubscribe = (unsubscribe: Unsubscribe) =>
  typeof unsubscribe === 'function' ? unsubscribe() : unsubscribe.unsubscribe();

export const isObject = (x: unknown): x is object =>
  typeof x === 'object' && x !== null;

export const canProxy = (x: unknown) =>
  isObject(x) &&
  !refSet.has(x) &&
  (Array.isArray(x) || !(Symbol.iterator in x)) &&
  !(x instanceof WeakMap) &&
  !(x instanceof WeakSet) &&
  !(x instanceof Error) &&
  !(x instanceof Number) &&
  !(x instanceof Date) &&
  !(x instanceof String) &&
  !(x instanceof RegExp) &&
  !(x instanceof ArrayBuffer);

export const getVersion = (stateProxy: unknown): number | undefined =>
  isObject(stateProxy) ? (stateProxy as any)[VERSION] : undefined;
export const getWatchers = (stateProxy: any): Set<Watcher> =>
  isObject(stateProxy) ? (stateProxy as any)[WATCHERS] : undefined;
export const getPropWatchers = (stateProxy: any): Map<Path[number], Watcher> =>
  isObject(stateProxy) ? (stateProxy as any)[PROP_WATCHERS] : undefined;
export const getEffects = (stateProxy: any): Set<VoidFunction> =>
  isObject(stateProxy) ? (stateProxy as any)[EFFECTS] : undefined;
export const getDerives = (stateProxy: any): Set<StateProxy> =>
  isObject(stateProxy) ? (stateProxy as any)[DERIVES] : undefined;
export const getUnsubscribes = (stateProxy: any): Set<Unsubscribe> =>
  isObject(stateProxy) ? (stateProxy as any)[UNSUBSCRIBES] : undefined;
export const getSetUnsubscribes = (
  stateProxy: any
): Map<Path[number], Unsubscribe> =>
  isObject(stateProxy) ? (stateProxy as any)[SET_UNSUBSCRIBES] : undefined;
export const getInvalidate = (stateProxy: any): ((force?: boolean) => void) =>
  isObject(stateProxy) ? (stateProxy as any)[INVALIDATE] : undefined;
export const getSnapshot = <TState extends object>(
  stateProxy: StateProxy<TState>
): Snapshot<TState> =>
  stateProxy[
    SNAPSHOT as keyof typeof stateProxy
  ] as unknown as Snapshot<TState>;
export const getPrevSnapshot = <TState extends object>(
  stateProxy: StateProxy<TState>
): Snapshot<TState> =>
  stateProxy[
    PREV_SNAPSHOT as keyof typeof stateProxy
  ] as unknown as Snapshot<TState>;

const internalWatch = <TState extends object>(
  stateProxy: StateProxy<TState>,
  callback: (ops: Op[]) => void,
  debounced = true
) => {
  let promise: Promise<void> | undefined;
  const ops: Op[] = [];
  const watcher: Watcher = (op) => {
    ops.push(op);
    if (!debounced) {
      callback(ops.splice(0));
      return;
    }
    if (!promise) {
      promise = Promise.resolve().then(() => {
        promise = undefined;
        callback(ops.splice(0));
      });
    }
  };
  const watchers = getWatchers(stateProxy);
  const unsubscribes = getUnsubscribes(stateProxy);

  watchers.add(watcher);
  const cleanUp = () => {
    watchers.delete(watcher);
  };
  unsubscribes.add(cleanUp);
  return cleanUp;
};

const internalEffect = <TState extends object>(
  stateProxy: StateProxy<TState>,
  effectFn: EffectFnWithCondition,
  debounced = true
) => {
  let promise: Promise<void> | undefined;
  let [cleanUpFn, shouldRunEffect]: [(CleanUpFn | void)?, (() => boolean)?] =
    [];
  let hasFirstRun = false;

  const innerEffect = () => {
    const runEffect = () => {
      if (cleanUpFn) {
        cleanUpFn(false);
      }

      [cleanUpFn, shouldRunEffect] = effectFn();
    };

    if (!debounced) {
      if (!hasFirstRun || shouldRunEffect?.()) {
        runEffect();
        return;
      }
    }

    if (!promise) {
      if (!hasFirstRun || shouldRunEffect?.()) {
        promise = Promise.resolve().then(() => {
          promise = undefined;
          runEffect();
        });
      }
    }
  };

  const teardown = () => {
    if (cleanUpFn) {
      cleanUpFn(true);
    }
  };

  const effects = getEffects(stateProxy);
  const version = getVersion(stateProxy);
  const unsubscribes = getUnsubscribes(stateProxy);

  effects.add(innerEffect);
  if (globalVersion === version || !hasFirstRun) {
    innerEffect();
    hasFirstRun = true;
  }

  const unsubscribe = () => {
    teardown();
    const removed = effects.delete(innerEffect);
    if (removed && effects.size === 0) {
      // no more effects
    }
  };

  unsubscribe.unsubscribe = unsubscribe;
  unsubscribes.add(unsubscribe);

  return unsubscribe;
};

/**
 * Clean up all listeners of a StateProxy
 *
 * @template TState
 * @param {StateProxy<TState>} stateProxy - The StateProxy to destroy
 */
export function destroy<TState extends object>(stateProxy: StateProxy<TState>) {
  Reflect.ownKeys(stateProxy).forEach((key) => {
    const propertyValue = stateProxy[key as keyof StateProxy<TState>];
    if (getVersion(propertyValue)) {
      destroy(propertyValue as StateProxy);
    }
  });

  const effects = getEffects(stateProxy);
  const watchers = getWatchers(stateProxy);
  const propWatchers = getPropWatchers(stateProxy);
  const derives = getDerives(stateProxy);
  const unsubscribes = getUnsubscribes(stateProxy);
  const setUnsubscribes = getSetUnsubscribes(stateProxy);

  effects.clear();
  watchers.clear();
  propWatchers.clear();
  unsubscribes.forEach(callUnsubscribe);
  unsubscribes.clear();
  setUnsubscribes.forEach(callUnsubscribe);
  setUnsubscribes.clear();

  if (derives?.size > 0) {
    derives.forEach(destroy);
  }
}

export function setInvalidate<TState extends object>(
  stateProxy: StateProxy<TState>,
  invalidate: (isAsync?: boolean) => void
) {
  stateProxy[INVALIDATE as keyof typeof stateProxy] = invalidate as any;
}

/**
 *
 * Retrieve the snapshot for a StateProxy
 *
 * @template TState
 * @param {StateProxy<TState>} stateProxy - The StateProxy to get the snapshot for
 * @param {boolean} [prev = false] - whether to get the previous snapshot or the current
 * @returns {TState} - The snapshot
 */
export function snapshot<TState extends object>(
  stateProxy: StateProxy<TState>,
  prev = false
): Snapshot<TState> {
  if (prev) return getPrevSnapshot(stateProxy);
  return getSnapshot(stateProxy);
}

/**
 * Watch changes of properties in StateProxy
 *
 * @template TState, TKey
 * @param {StateProxy<TState>} stateProxy - The StateProxy to watch
 * @param {TKey[]} keys - a list of StateProxy properties to watch
 * @param {...values: TState[TKey][]} callback - callback to invoke when the properties (being watched) change
 * @param {boolean} [debounced = true] - whether to invoke callback with debounced changes or not.
 * @returns {VoidFunction} unsubscribe - Function to invoke to stop the watcher
 */
export function watch<TState extends object, TKey extends keyof TState>(
  stateProxy: StateProxy<TState>,
  keys: TKey[],
  callback: (...values: TState[TKey][]) => void,
  debounced?: boolean
): VoidFunction;
/**
 * Watch StateProxy changes
 *
 * @template TState
 * @param {StateProxy<TState>} stateProxy - The StateProxy to watch
 * @param {(ops: Op[]) => void} callback - callback to invoke when state changes
 * @param {boolean} [debounced = true] - whether to invoke callback with debounced changes or not.
 * @returns {VoidFunction} unsubscribe - Function to invoke to stop the watcher
 */
export function watch<TState extends object>(
  stateProxy: StateProxy<TState>,
  callback: (ops: Op[]) => void,
  debounced?: boolean
): VoidFunction;

export function watch<TState extends object, TKey extends keyof TState>(
  stateProxy: StateProxy<TState>,
  ...args:
    | [TKey[], (...values: TState[TKey][]) => void, boolean?]
    | [(ops: Op[]) => void, boolean?]
) {
  const [keysOrCallback, callbackOrDebounced, debouncedParams = true] = args;

  if (typeof keysOrCallback === 'function') {
    const callback = keysOrCallback as (ops: Op[]) => void;
    const debounced = (callbackOrDebounced ?? true) as boolean;
    return internalWatch(stateProxy, callback, debounced);
  }

  const keys = keysOrCallback as TKey[];
  const callback = callbackOrDebounced as (...values: TState[TKey][]) => void;
  return internalWatch(
    stateProxy,
    (ops) => {
      if (keys.some((key) => ops.some((op) => op[1][0] === key))) {
        callback(...keys.map((key) => (stateProxy as TState)[key]));
      }
    },
    debouncedParams
  );
}

/**
 * Execute effect on properties changes
 *
 * @template TState, TKey
 * @param {StateProxy<TState>} stateProxy - The StateProxy to watch
 * @param {TKey[]} keys - list of properties to watch
 * @param {EffectFn} effectFn - the effectFn to invoke on State changes
 * @param {boolean} [debounced = true]
 * @returns {VoidFunction} unsubscribe - Function to invoke to stop the watcher
 */
export function effect<TState extends object, TKey extends keyof TState>(
  stateProxy: StateProxy<TState>,
  keys: TKey[],
  effectFn: EffectFn,
  debounced?: boolean
): VoidFunction;
/**
 * Execute effect on state changes
 *
 * @template TState
 * @param {StateProxy<TState>} stateProxy - The StateProxy to watch
 * @param {EffectFn} effectFn - the effectFn to invoke on State changes
 * @param {boolean} [debounced = true]
 * @returns {VoidFunction} unsubscribe - Function to invoke to stop the watcher
 */
export function effect<TState extends object>(
  stateProxy: StateProxy<TState>,
  effectFn: EffectFn,
  debounced?: boolean
): VoidFunction;
export function effect<TState extends object, TKey extends keyof TState>(
  stateProxy: StateProxy<TState>,
  ...args: [TKey[], EffectFn, boolean?] | [EffectFn, boolean?]
) {
  const [keysOrEffectFn, debouncedOrEffectFn, debouncedParams = true] = args;

  if (typeof keysOrEffectFn === 'function') {
    const effectFn = keysOrEffectFn as EffectFn;
    const debounced = (debouncedOrEffectFn ?? true) as boolean;
    return internalEffect(
      stateProxy,
      () => [effectFn(), () => true],
      debounced
    );
  }

  const keys = keysOrEffectFn as TKey[];
  const effectFn = debouncedOrEffectFn as EffectFn;
  return internalEffect(
    stateProxy,
    () => {
      return [
        effectFn(),
        () => {
          const previousSnapshot = snapshot(stateProxy, true);
          const currentSnapshot = snapshot(stateProxy);
          return (
            notEqual(previousSnapshot, currentSnapshot) &&
            keys.some((key) =>
              notEqual(
                (previousSnapshot as any)[key],
                (currentSnapshot as any)[key]
              )
            )
          );
        },
      ];
    },
    debouncedParams
  );
}

/**
 * @internal
 * @param {ChangeDetectorRef} cdr
 */
export function createInvalidate(cdr: ChangeDetectorRef) {
  return (isAsync?: boolean) => {
    if (isAsync) {
      requestAnimationFrame(() => {
        cdr.markForCheck();
      });
    } else {
      cdr.markForCheck();
    }
  };
}
