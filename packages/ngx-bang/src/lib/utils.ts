import { ApplicationRef, ChangeDetectorRef } from '@angular/core';
import {
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
  CleanUpFn,
  EffectFn,
  EffectFnWithCondition,
  Op,
  Path,
  StateProxy,
  Unsubscribe,
  Watcher,
} from './types';
import { AsRef } from './types';

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
): TState =>
  stateProxy[SNAPSHOT as keyof typeof stateProxy] as unknown as TState;
export const getPrevSnapshot = <TState extends object>(
  stateProxy: StateProxy<TState>
): TState =>
  stateProxy[PREV_SNAPSHOT as keyof typeof stateProxy] as unknown as TState;

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

export function destroy<TState extends object>(stateProxy: StateProxy<TState>) {
  Reflect.ownKeys(stateProxy).forEach((key) => {
    const propertyValue = stateProxy[key as keyof StateProxy<TState>];
    if (getVersion(propertyValue)) {
      destroy(propertyValue as StateProxy<any>);
    }
  });

  const effects = getEffects(stateProxy);
  const watchers = getWatchers(stateProxy);
  const propWatchers = getPropWatchers(stateProxy);
  const unsubscribes = getUnsubscribes(stateProxy);
  const setUnsubscribes = getSetUnsubscribes(stateProxy);

  effects.clear();
  watchers.clear();
  propWatchers.clear();
  unsubscribes.forEach(callUnsubscribe);
  unsubscribes.clear();
  setUnsubscribes.forEach(callUnsubscribe);
  setUnsubscribes.clear();
}

export function setInvalidate<TState extends object>(
  stateProxy: StateProxy<TState>,
  invalidate: (isAsync?: boolean) => void
) {
  stateProxy[INVALIDATE as keyof typeof stateProxy] = invalidate as any;
}

export function snapshot<TState extends object>(
  stateProxy: StateProxy<TState>,
  prev = false
): TState {
  if (prev) return getPrevSnapshot(stateProxy);
  return getSnapshot(stateProxy);
}

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
              notEqual(previousSnapshot[key], currentSnapshot[key])
            )
          );
        },
      ];
    },
    debouncedParams
  );
}

export function createInvalidate(
  cdrOrAppRef: ChangeDetectorRef | ApplicationRef
) {
  return (isAsync?: boolean) => {
    const invalidate = () => {
      if (cdrOrAppRef instanceof ChangeDetectorRef) {
        cdrOrAppRef.markForCheck();
      } else {
        cdrOrAppRef.tick();
      }
    };
    if (isAsync) {
      requestAnimationFrame(() => {
        invalidate();
      });
    } else {
      invalidate();
    }
  };
}
