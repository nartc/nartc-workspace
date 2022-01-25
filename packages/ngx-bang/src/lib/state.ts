import { getUntracked, markToTrack } from 'proxy-compare';
import {
  DERIVES,
  EFFECTS,
  HANDLER,
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
  Unsubscribe,
  VoidFunction,
  Watcher,
} from './types';
import {
  getDerives,
  getEffects,
  getInvalidate,
  getPrevSnapshot,
  getPropWatchers,
  getSetterUnsubscribes,
  getSnapshot,
  getUnsubscribes,
  getVersion,
  getWatchers,
  isObject,
  notEqual,
  setInvalidate,
} from './utils';

let globalVersion = 1;

const refSet = new WeakSet();

export const ref = <TObject extends object>(o: TObject): TObject & AsRef => {
  refSet.add(o);
  return o as TObject & AsRef;
};

const noop = () => {};

const canProxy = (x: unknown) =>
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

const stateCache = new WeakMap<object, object>();
const snapshotCache = new WeakMap<
  object,
  [version: number, snapshot: unknown]
>();

export function state<TState extends object>(
  initialState: TState = {} as TState,
  isRoot = true
): TState {
  if (!isObject(initialState)) {
    throw new Error('State must be an object type');
  }

  const cachedState = stateCache.get(initialState) as TState | undefined;
  if (cachedState) {
    return cachedState;
  }

  let localVersion = globalVersion;
  let invalidate = noop;

  const derives = new Set<object>();
  const unsubscribes = new Set<Unsubscribe>();
  const setterUnsubscribes = new Map<Path[number], Unsubscribe>();

  const watchers = new Set<Watcher>();
  const notifyWatcher = (op: Op, nextVersion = 0) => {
    if (!nextVersion) {
      nextVersion = ++globalVersion;
    }
    if (localVersion !== nextVersion) {
      localVersion = nextVersion;
      watchers.forEach((watcher) => watcher(op, nextVersion));
    }
  };

  const propWatchers = new Map<Path[number], Watcher>();
  const getPropWatcher = (prop: Path[number]) => {
    let propWatcher = propWatchers.get(prop);
    if (!propWatcher) {
      propWatcher = (op, nextVersion) => {
        const newOp: Op = [...op];
        newOp[1] = [prop, ...(newOp[1] as Path)];
        notifyWatcher(newOp, nextVersion);
      };
      propWatchers.set(prop, propWatcher);
    }
    return propWatcher;
  };
  const popPropWatcher = (prop: Path[number]) => {
    const propWatcher = propWatchers.get(prop);
    propWatchers.delete(prop);
    return propWatcher;
  };

  const effects = new Set<VoidFunction>();
  const notifyEffect = (nextVersion = 0) => {
    if (!nextVersion) {
      nextVersion = ++globalVersion;
    }

    if (localVersion !== nextVersion) {
      localVersion = nextVersion;
      effects.forEach((effectFn) => {
        effectFn();
      });
    }
  };

  const propEffects = new Map<Path[number], VoidFunction>();
  const getPropEffect = (prop: Path[number]) => {
    let propEffect = propEffects.get(prop);
    if (!propEffect) {
      propEffect = notifyEffect;
      propEffects.set(prop, propEffect);
    }
    return propEffect;
  };
  const popPropEffect = (prop: Path[number]) => {
    const propEffect = propEffects.get(prop);
    propEffects.delete(prop);
    return propEffect;
  };

  let prevSnapshot = initialState;
  const createSnapshot = (target: TState, receiver: any) => {
    const [cachedVersion, cachedSnapshot] = snapshotCache.get(receiver) || [];
    if (cachedVersion) {
      prevSnapshot = cachedSnapshot as TState;
      if (cachedVersion === localVersion) {
        return cachedSnapshot;
      }
    }

    const snapshot: any = Array.isArray(target)
      ? []
      : Object.create(Object.getPrototypeOf(target));
    markToTrack(snapshot, true); // mark to track
    snapshotCache.set(receiver, [localVersion, snapshot]);

    for (const ownKey of Reflect.ownKeys(target)) {
      const value = Reflect.get(target, ownKey, receiver);
      if (refSet.has(value)) {
        markToTrack(value, false);
        snapshot[ownKey] = value;
      } else if (getWatchers(value)) {
        snapshot[ownKey] = getSnapshot(value);
      } else {
        snapshot[ownKey] = value;
      }
    }

    Object.freeze(snapshot);
    return snapshot;
  };

  const baseState = Array.isArray(initialState)
    ? []
    : Object.create(Object.getPrototypeOf(initialState));

  const handler = {
    get(target: TState, prop: Path[number], receiver: any) {
      if (prop === VERSION) {
        return localVersion;
      }

      if (prop === WATCHERS) {
        return watchers;
      }

      if (prop === PROP_WATCHERS) {
        return propWatchers;
      }

      if (prop === EFFECTS) {
        return effects;
      }

      if (prop === UNSUBSCRIBES) {
        return unsubscribes;
      }

      if (prop === SET_UNSUBSCRIBES) {
        return setterUnsubscribes;
      }

      if (prop === SNAPSHOT) {
        return createSnapshot(target, receiver);
      }

      if (prop === PREV_SNAPSHOT) {
        return prevSnapshot || initialState;
      }

      if (prop === HANDLER) {
        return handler;
      }

      if (prop === INVALIDATE) {
        return invalidate;
      }

      if (prop === DERIVES) {
        return derives;
      }

      return Reflect.get(target, prop, receiver);
    },
    deleteProperty(target: TState, prop: Path[number]) {
      const prevValue = Reflect.get(target, prop);
      const childWatchers = prevValue?.[WATCHERS];
      if (childWatchers) {
        childWatchers.delete(popPropWatcher(prop));
      }
      const childEffects = prevValue?.[EFFECTS];
      if (childEffects) {
        childEffects.delete(popPropEffect(prop));
      }
      const deleted = Reflect.deleteProperty(target, prop);
      if (deleted) {
        notifyWatcher(['delete', [prop], prevValue]);
      }
      return deleted;
    },
    canProxy,
    notEqual,
    set(target: TState, prop: Path[number], value: any, receiver: any) {
      const prevValue = Reflect.get(target, prop, receiver);
      if (!this.notEqual(prevValue, value)) {
        return true;
      }

      if (prop === INVALIDATE) {
        invalidate = value;
        for (const ownKey of Reflect.ownKeys(receiver)) {
          const propertyValue = receiver[ownKey as keyof TState];
          if (
            getVersion(propertyValue) &&
            getInvalidate(propertyValue) === noop
          ) {
            setInvalidate(propertyValue, value);
          }
        }
        return true;
      }

      const childWatchers = getWatchers(prevValue);
      if (childWatchers) {
        const popped = popPropWatcher(prop);
        if (popped) {
          childWatchers.delete(popped);
        }
      }
      const childEffects = getEffects(prevValue);
      if (childEffects) {
        const popped = popPropEffect(prop);
        if (popped) {
          childEffects.delete(popped);
        }
      }

      if (isObject(value)) {
        value = getUntracked(value) || value;
      }
      let nextValue: any;

      if (Object.getOwnPropertyDescriptor(target, prop)?.set) {
        nextValue = value;
      } else if (getWatchers(value)) {
        nextValue = value;
        getWatchers(nextValue)!.add(getPropWatcher(prop));
        getEffects(nextValue)!.add(getPropEffect(prop));
      } else if (canProxy(value)) {
        nextValue = state(value, false);
        getWatchers(nextValue)!.add(getPropWatcher(prop));
        getEffects(nextValue)!.add(getPropEffect(prop));
      } else {
        nextValue = value;
      }

      Reflect.set(target, prop, nextValue, receiver);

      if (isRoot) {
        invalidate();
      }
      notifyWatcher(['set', [prop], value, prevValue]);
      notifyEffect();

      return true;
    },
  };

  const stateProxy = new Proxy<TState>(baseState, handler);
  stateCache.set(initialState, stateProxy);

  Reflect.ownKeys(initialState).forEach((key) => {
    const desc = Object.getOwnPropertyDescriptor(
      initialState,
      key
    ) as PropertyDescriptor;
    if (desc.get || desc.set) {
      Object.defineProperty(baseState, key, desc);
    } else {
      stateProxy[key as keyof typeof stateProxy] =
        initialState[key as keyof typeof initialState];
    }
  });

  return stateProxy;
}

/**
 * Clean up all listeners of a StateProxy
 *
 * @template TState
 * @param {TState} stateProxy - The StateProxy to destroy
 */
export function destroy<TState extends object>(stateProxy: TState) {
  Reflect.ownKeys(stateProxy).forEach((key) => {
    const propertyValue = stateProxy[key as keyof TState];
    if (getVersion(propertyValue)) {
      destroy(propertyValue as any);
    }
  });

  const effects = getEffects(stateProxy);
  const watchers = getWatchers(stateProxy);
  const propWatchers = getPropWatchers(stateProxy);
  const derives = getDerives(stateProxy);
  const unsubscribes = getUnsubscribes(stateProxy);
  const setterUnsubscribes = getSetterUnsubscribes(stateProxy);

  effects!.clear();
  watchers!.clear();
  propWatchers!.clear();
  unsubscribes!.forEach(callUnsubscribe);
  unsubscribes!.clear();
  setterUnsubscribes!.forEach(callUnsubscribe);
  setterUnsubscribes!.clear();

  if (derives!.size > 0) {
    derives!.forEach(destroy);
  }
}

/**
 *
 * Retrieve the snapshot for a StateProxy
 *
 * @template TState
 * @param {TState} stateProxy - The StateProxy to get the snapshot for
 * @param {boolean} [prev = false] - whether to get the previous snapshot or the current
 * @returns {TState} - The snapshot
 */
export function snapshot<TState extends object>(
  stateProxy: TState,
  prev = false
): Snapshot<TState> {
  if (prev) return getPrevSnapshot(stateProxy);
  return getSnapshot(stateProxy);
}

/**
 * Watch changes of properties in StateProxy
 *
 * @template TState, TKey
 * @param {TState} stateProxy - The StateProxy to watch
 * @param {TKey[]} keys - a list of StateProxy properties to watch
 * @param {...values: TState[TKey][]} callback - callback to invoke when the properties (being watched) change
 * @param {boolean} [debounced = true] - whether to invoke callback with debounced changes or not.
 * @returns {VoidFunction} unsubscribe - Function to invoke to stop the watcher
 */
export function watch<TState extends object, TKey extends keyof TState>(
  stateProxy: TState,
  keys: TKey[],
  callback: (...values: TState[TKey][]) => void,
  debounced?: boolean
): VoidFunction;
/**
 * Watch StateProxy changes
 *
 * @template TState
 * @param {TState} stateProxy - The StateProxy to watch
 * @param {(ops: Op[]) => void} callback - callback to invoke when state changes
 * @param {boolean} [debounced = true] - whether to invoke callback with debounced changes or not.
 * @returns {VoidFunction} unsubscribe - Function to invoke to stop the watcher
 */
export function watch<TState extends object>(
  stateProxy: TState,
  callback: (ops: Op[]) => void,
  debounced?: boolean
): VoidFunction;

export function watch<TState extends object, TKey extends keyof TState>(
  stateProxy: TState,
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
 * @param {TState} stateProxy - The StateProxy to watch
 * @param {TKey[]} keys - list of properties to watch
 * @param {EffectFn} effectFn - the effectFn to invoke on State changes
 * @param {boolean} [debounced = true]
 * @returns {VoidFunction} unsubscribe - Function to invoke to stop the watcher
 */
export function effect<TState extends object, TKey extends keyof TState>(
  stateProxy: TState,
  keys: TKey[],
  effectFn: EffectFn,
  debounced?: boolean
): VoidFunction;
/**
 * Execute effect on state changes
 *
 * @template TState
 * @param {TState} stateProxy - The StateProxy to watch
 * @param {EffectFn} effectFn - the effectFn to invoke on State changes
 * @param {boolean} [debounced = true]
 * @returns {VoidFunction} unsubscribe - Function to invoke to stop the watcher
 */
export function effect<TState extends object>(
  stateProxy: TState,
  effectFn: EffectFn,
  debounced?: boolean
): VoidFunction;
export function effect<TState extends object, TKey extends keyof TState>(
  stateProxy: TState,
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

function internalWatch<TState extends object>(
  stateProxy: TState,
  callback: (ops: Op[]) => void,
  debounced = true
) {
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

  watchers!.add(watcher);
  const cleanUp = () => {
    watchers!.delete(watcher);
  };
  unsubscribes!.add(cleanUp);
  return cleanUp;
}

function internalEffect<TState extends object>(
  stateProxy: TState,
  effectFn: EffectFnWithCondition,
  debounced = true
) {
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

  effects!.add(innerEffect);
  if (globalVersion === version || !hasFirstRun) {
    innerEffect();
    hasFirstRun = true;
  }

  const unsubscribe = () => {
    teardown();
    const removed = effects!.delete(innerEffect);
    if (removed && effects!.size === 0) {
      // no more effects
    }
  };

  unsubscribe.unsubscribe = unsubscribe;
  unsubscribes!.add(unsubscribe);

  return unsubscribe;
}

function callUnsubscribe(unsubscribe: Unsubscribe) {
  return typeof unsubscribe === 'function'
    ? unsubscribe()
    : unsubscribe.unsubscribe();
}
