import { state, watch } from './state';
import type {
  DerivedObjectEntry,
  DeriveFns,
  DeriveSourceObjectEntry,
  DeriveSubscription,
  Snapshot,
} from './types';
import {
  getDerives,
  getInvalidate,
  getSnapshot,
  getVersion,
  setInvalidate,
} from './utils';

const sourceObjectMap = new WeakMap<object, DeriveSourceObjectEntry>();
const derivedObjectMap = new WeakMap<object, DerivedObjectEntry>();

const markPending = (sourceObject: object) => {
  const sourceObjectEntry = sourceObjectMap.get(sourceObject);
  if (sourceObjectEntry) {
    sourceObjectEntry[0].forEach((subscription) => {
      const { d: derivedObject } = subscription;
      if (sourceObject !== derivedObject) {
        markPending(derivedObject);
      }
    });
    ++sourceObjectEntry[2]; // pendingCount
  }
};

// has side effect (even though used in Array.map)
const checkPending = (sourceObject: object, callback: () => void) => {
  const sourceObjectEntry = sourceObjectMap.get(sourceObject);
  if (sourceObjectEntry?.[2]) {
    sourceObjectEntry[3].add(callback); // pendingCallbacks
    return true;
  }
  return false;
};

const unmarkPending = (sourceObject: object) => {
  const sourceObjectEntry = sourceObjectMap.get(sourceObject);
  if (sourceObjectEntry) {
    --sourceObjectEntry[2]; // pendingCount
    if (!sourceObjectEntry[2]) {
      const pendingCallbacks = new Set(sourceObjectEntry[3]);
      sourceObjectEntry[3].clear(); // pendingCallbacks
      pendingCallbacks.forEach((callback) => callback());
    }
    sourceObjectEntry[0].forEach((subscription) => {
      const { d: derivedObject } = subscription;
      if (sourceObject !== derivedObject) {
        unmarkPending(derivedObject);
      }
    });
  }
};

const addSubscription = (subscription: DeriveSubscription) => {
  const { s: sourceObject, d: derivedObject } = subscription;
  let derivedObjectEntry = derivedObjectMap.get(derivedObject);
  if (!derivedObjectEntry) {
    derivedObjectEntry = [new Set()];
    derivedObjectMap.set(subscription.d, derivedObjectEntry);
  }
  derivedObjectEntry[0].add(subscription);
  let sourceObjectEntry = sourceObjectMap.get(sourceObject);
  if (!sourceObjectEntry) {
    const subscriptions = new Set<DeriveSubscription>();
    const unsubscribe = watch(
      sourceObject,
      (ops) => {
        subscriptions.forEach((subscription) => {
          const {
            d: derivedObject,
            c: callback,
            n: notifyInSync,
            i: ignoreKeys,
          } = subscription;
          if (
            sourceObject === derivedObject &&
            ops.every(
              (op) =>
                op[1].length === 1 && ignoreKeys.includes(op[1][0] as string)
            )
          ) {
            // only setting derived properties
            return;
          }
          if (subscription.p) {
            // already scheduled
            return;
          }
          markPending(sourceObject);
          if (notifyInSync) {
            callback();
            unmarkPending(sourceObject);
          } else {
            subscription.p = Promise.resolve().then(() => {
              delete subscription.p; // promise
              callback();
              unmarkPending(sourceObject);
            });
          }
        });
      },
      true
    );
    sourceObjectEntry = [subscriptions, unsubscribe, 0, new Set()];
    sourceObjectMap.set(sourceObject, sourceObjectEntry);
  }
  sourceObjectEntry[0].add(subscription);
};

const removeSubscription = (subscription: DeriveSubscription) => {
  const { s: sourceObject, d: derivedObject } = subscription;
  const derivedObjectEntry = derivedObjectMap.get(derivedObject);
  derivedObjectEntry?.[0].delete(subscription);
  if (derivedObjectEntry?.[0].size === 0) {
    derivedObjectMap.delete(derivedObject);
  }
  const sourceObjectEntry = sourceObjectMap.get(sourceObject);
  if (sourceObjectEntry) {
    const [subscriptions, unsubscribe] = sourceObjectEntry;
    subscriptions.delete(subscription);
    if (!subscriptions.size) {
      unsubscribe();
      sourceObjectMap.delete(sourceObject);
    }
  }
};

/**
 * Create a derived `StateProxy`
 *
 * @template TDerive
 * @param {DeriveFns<TDerive>} deriveFns - A Record/Dictionary of derived key and a function that returns the value for that key
 * @param {boolean} [debounced=true] - Whether to debounce the value changes from the original `StateProxy`
 *
 * @returns {TDerive}
 */
export function derive<TDerive extends object>(
  deriveFns: DeriveFns<TDerive>,
  debounced = true
): TDerive {
  const derivedProxy = state({} as TDerive);
  const derivedKeys = Object.keys(deriveFns);

  for (const derivedKey of derivedKeys) {
    if (Object.getOwnPropertyDescriptor(derivedProxy, derivedKey)) {
      throw new Error('object property already defined');
    }
    const fn = deriveFns[derivedKey as keyof typeof deriveFns];
    type DeriveDependencyEntry = {
      v: number; // "v"ersion
      s?: DeriveSubscription; // "s"ubscription
    };
    let lastDependencies: Map<object, DeriveDependencyEntry> | null = null;
    const evaluate = () => {
      if (lastDependencies) {
        if (
          Array.from(lastDependencies)
            .map(([p]) => checkPending(p, evaluate))
            .some((isPending) => isPending)
        ) {
          // some dependencies are pending
          return;
        }
        if (
          Array.from(lastDependencies).every(
            ([p, entry]) => getVersion(p) === entry.v
          )
        ) {
          // no dependencies are changed
          return;
        }
      }
      const dependencies = new Map<object, DeriveDependencyEntry>();
      const get = <P extends object>(p: P) => {
        const derives = getDerives(p);
        if (!derives?.has(derivedProxy)) {
          derives?.add(derivedProxy);
        }

        const stateInvalidate = getInvalidate(p);
        const derivedInvalidate = getInvalidate(derivedProxy);
        if (stateInvalidate !== derivedInvalidate) {
          setInvalidate(derivedProxy, stateInvalidate!);
        }

        dependencies.set(p, { v: getVersion(p) as number });
        return p as Snapshot<P>;
      };
      const value = fn(get, getSnapshot(derivedProxy));
      const subscribeToDependencies = () => {
        dependencies.forEach((entry, p) => {
          const lastSubscription = lastDependencies?.get(p)?.s;
          if (lastSubscription) {
            entry.s = lastSubscription;
          } else {
            const subscription: DeriveSubscription = {
              s: p, // sourceObject
              d: derivedProxy, // derivedObject
              k: derivedKey, // derived key
              c: evaluate, // callback
              n: debounced,
              i: derivedKeys, // ignoringKeys
            };
            addSubscription(subscription);
            entry.s = subscription;
          }
        });
        lastDependencies?.forEach((entry, p) => {
          if (!dependencies.has(p) && entry.s) {
            removeSubscription(entry.s);
          }
        });
        lastDependencies = dependencies;
      };
      subscribeToDependencies();
      derivedProxy[derivedKey as keyof TDerive] = value;
    };

    evaluate();
  }

  return derivedProxy;
}
