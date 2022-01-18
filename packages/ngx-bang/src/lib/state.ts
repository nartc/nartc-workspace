import { getUntracked, markToTrack } from 'proxy-compare';
import {
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
  Op,
  Path,
  StateObject,
  StateProxy,
  Unsubscribe,
  Watcher,
} from './types';
import {
  canProxy,
  getEffects,
  getInvalidate,
  getSnapshot,
  getWatchers,
  globalVersion,
  isObject,
  noop,
  notEqual,
  refSet,
  setGlobalVersion,
} from './utils';

const stateCache = new WeakMap<object, StateObject>();
const snapshotCache = new WeakMap<
  object,
  [version: number, snapshot: unknown]
>();

export function state<TState extends object>(
  initialState: TState = {} as TState,
  invalidate: (isAsync?: boolean) => void = noop
): StateProxy<TState> {
  if (!isObject(initialState)) {
    throw new Error('initialState must be an object');
  }

  const found = stateCache.get(initialState) as StateProxy<TState> | undefined;
  if (found) {
    return found;
  }

  let version = globalVersion;

  const unsubscribes = new Set<Unsubscribe>();
  const setUnsubscribes = new Map<Path[number], Unsubscribe>();

  const watchers = new Set<Watcher>();
  const notifyWatcher = (op: Op, nextVersion = 0) => {
    if (!nextVersion) {
      nextVersion = setGlobalVersion(globalVersion + 1);
    }
    if (version !== nextVersion) {
      version = nextVersion;
      watchers.forEach((watcher) => watcher(op, nextVersion as number));
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

  const effects = new Set<() => void>();
  const notifyEffect = (nextVersion = 0) => {
    if (!nextVersion) {
      nextVersion = setGlobalVersion(globalVersion + 1);
    }

    if (version !== nextVersion) {
      version = nextVersion;
      effects.forEach((effectFn) => {
        effectFn();
      });
    }
  };

  const propEffects = new Map<Path[number], () => void>();
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
  const createSnapshot = (target: StateProxy<TState>, receiver: any) => {
    const cache = snapshotCache.get(receiver);
    if (cache) {
      prevSnapshot = cache[1] as TState;
      if (cache[0] === version) {
        return cache[1];
      }
    }

    const snapshot: any = Array.isArray(target)
      ? []
      : Object.create(Object.getPrototypeOf(target));
    markToTrack(snapshot, true); // mark to track
    snapshotCache.set(receiver, [version, snapshot]);
    for (const key of Reflect.ownKeys(target)) {
      const value = Reflect.get(target, key, receiver);
      if (refSet.has(value)) {
        markToTrack(value, false); // mark not to track
        snapshot[key] = value;
      } else if (getWatchers(value)) {
        snapshot[key] = getSnapshot(value);
      } else {
        snapshot[key] = value;
      }
    }
    Object.freeze(snapshot);
    return snapshot;
  };

  const baseState = Array.isArray(initialState)
    ? []
    : Object.create(Object.getPrototypeOf(initialState));

  const handler: ProxyHandler<StateProxy<TState>> = {
    get(target: StateProxy<TState>, prop: Path[number], receiver: any) {
      if (prop === VERSION) {
        return version;
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
        return setUnsubscribes;
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

      return Reflect.get(target, prop, receiver);
    },
    deleteProperty(target: StateProxy<TState>, prop: Path[number]) {
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
    set(
      target: StateProxy<TState>,
      prop: Path[number],
      value: any,
      receiver: any
    ) {
      const prevValue = Reflect.get(target, prop, receiver);
      if (!notEqual(prevValue, value)) {
        return true;
      }

      if (prop === INVALIDATE) {
        invalidate = value;
        return true;
      }

      const childWatchers = prevValue?.[WATCHERS];
      if (childWatchers) {
        childWatchers.delete(popPropWatcher(prop));
      }
      const childEffects = prevValue?.[EFFECTS];
      if (childEffects) {
        childEffects.delete(popPropEffect(prop));
      }

      if (isObject(value)) {
        value = getUntracked(value) || value;
      }

      let nextValue: any;

      if (Object.getOwnPropertyDescriptor(target, prop)?.set) {
        nextValue = value;
      } else if (getWatchers(value)) {
        nextValue = value;
        getWatchers(nextValue).add(getPropWatcher(prop));
        getEffects(nextValue).add(getPropEffect(prop));
      } else if (canProxy(value)) {
        nextValue = state(value, getInvalidate(receiver));
        getWatchers(nextValue).add(getPropWatcher(prop));
        getEffects(nextValue).add(getPropEffect(prop));
      } else {
        nextValue = value;
      }

      Reflect.set(target, prop, nextValue, receiver);
      invalidate();
      notifyWatcher(['set', [prop], value, prevValue]);
      notifyEffect();

      return true;
    },
  };

  const stateProxy = new Proxy<StateProxy<TState>>(baseState, handler);

  stateCache.set(initialState, stateProxy);

  Reflect.ownKeys(initialState).forEach((key) => {
    const desc = Object.getOwnPropertyDescriptor(
      initialState,
      key
    ) as PropertyDescriptor;
    if (desc.get || desc.set) {
      Object.defineProperty(baseState, key, desc);
    } else {
      stateProxy[key as keyof typeof stateProxy] = initialState[
        key as keyof typeof initialState
      ] as StateProxy<TState>[keyof StateProxy<TState>];
    }
  });

  return stateProxy;
}
