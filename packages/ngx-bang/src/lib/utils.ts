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
  InvalidateFunction,
  Unsubscribe,
  VoidFunction,
  Watcher,
} from './types';
import { Path } from './types';

export function isObject(x: unknown): x is object {
  return typeof x === 'object' && x !== null;
}

export function notEqual(a: unknown, b: unknown): boolean {
  const tOfA = typeof a;
  if (tOfA !== 'function' && tOfA !== 'object') {
    return !Object.is(a, b);
  }
  return true;
}

export function getVersion(state: unknown): number | undefined {
  return isObject(state) ? (state as any)[VERSION] : undefined;
}

export function getUnsubscribes(state: unknown): Set<Unsubscribe> | undefined {
  return isObject(state) ? (state as any)[UNSUBSCRIBES] : undefined;
}

export function getSetterUnsubscribes(
  state: unknown
): Map<Path[number], Unsubscribe> | undefined {
  return isObject(state) ? (state as any)[SET_UNSUBSCRIBES] : undefined;
}

export function getWatchers(state: unknown): Set<Watcher> | undefined {
  return isObject(state) ? (state as any)[WATCHERS] : undefined;
}

export function getPropWatchers(
  state: unknown
): Map<Path[number], Watcher> | undefined {
  return isObject(state) ? (state as any)[PROP_WATCHERS] : undefined;
}

export function getEffects(state: unknown): Set<VoidFunction> | undefined {
  return isObject(state) ? (state as any)[EFFECTS] : undefined;
}

export function getSnapshot(state: unknown) {
  return isObject(state) ? (state as any)[SNAPSHOT] : undefined;
}

export function getPrevSnapshot(state: unknown) {
  return isObject(state) ? (state as any)[PREV_SNAPSHOT] : undefined;
}

export function getDerives(state: unknown): Set<object> | undefined {
  return isObject(state) ? (state as any)[DERIVES] : undefined;
}

export function getInvalidate(state: unknown): InvalidateFunction | undefined {
  return isObject(state) ? (state as any)[INVALIDATE] : undefined;
}

export function setInvalidate(
  state: unknown,
  invalidate: InvalidateFunction
): void {
  if (isObject(state)) {
    (state as any)[INVALIDATE] = invalidate;
  }
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
