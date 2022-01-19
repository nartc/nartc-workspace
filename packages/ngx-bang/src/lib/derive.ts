import { state } from './state';
import type {
  DeriveFns,
  DeriveGet,
  DeriveSubscriptions,
  StateProxy,
} from './types';
import { getSnapshot, getVersion, watch } from './utils';

const subscriptionsCache = new WeakMap<
  StateProxy,
  DeriveSubscriptions<object>
>();

const getSubscriptions = <TData extends object>(
  stateProxy: StateProxy<TData>
) => {
  let subscriptions = subscriptionsCache.get(stateProxy);
  if (!subscriptions) {
    subscriptions = new Map();
    subscriptionsCache.set(stateProxy, subscriptions);
  }
  return subscriptions as unknown as DeriveSubscriptions<TData>;
};

/**
 * Create a derived `StateProxy`
 *
 * @template TDerive
 * @param {DeriveFns<TDerive>} derivedFns - A Record/Dictionary of derived key and a function that returns the value for that key
 * @param {boolean} [debounced=true] - Whether to debounce the value changes from the original `StateProxy`
 *
 * @returns {StateProxy<TDerive>}
 */
export const derive = <TDerive extends object>(
  derivedFns: DeriveFns<TDerive>,
  debounced = true
): StateProxy<TDerive> => {
  const derivedProxy = state({}) as StateProxy<TDerive>;
  const subscriptions: DeriveSubscriptions<TDerive> =
    getSubscriptions(derivedProxy);
  const addSubscription = (
    p: StateProxy<TDerive>,
    key: keyof TDerive,
    callback: () => void
  ) => {
    const subscription = subscriptions.get(p);
    if (subscription) {
      subscription[0].set(key, callback);
    } else {
      const unsubscribe = watch(
        p,
        (ops) => {
          if (
            p === derivedProxy &&
            ops.every(
              (op) => op[1].length === 1 && (op[1][0] as string) in derivedFns
            )
          ) {
            // only setting derived properties
            return;
          }
          subscriptions.get(p)?.[0].forEach((cb) => {
            cb();
          });
        },
        debounced
      );
      subscriptions.set(p, [new Map([[key, callback]]), unsubscribe]);
    }
  };
  const removeSubscription = (p: StateProxy<TDerive>, key: keyof TDerive) => {
    const subscription = subscriptions.get(p);
    if (subscription) {
      const [callbackMap, unsubscribe] = subscription;
      callbackMap.delete(key);
      if (!callbackMap.size) {
        unsubscribe();
        subscriptions.delete(p);
      }
    }
  };
  (Object.keys(derivedFns) as (keyof TDerive)[]).forEach((key) => {
    if (Object.getOwnPropertyDescriptor(derivedProxy, key)) {
      throw new Error('object property already defined');
    }
    const fn = derivedFns[key];
    let lastDependencies: Map<StateProxy, number> | null = null;
    const evaluate = () => {
      if (lastDependencies) {
        if (
          Array.from(lastDependencies).every(([p, n]) => getVersion(p) === n)
        ) {
          // no dependencies are changed
          return;
        }
      }
      const dependencies = new Map<StateProxy, number>();
      const get = <P extends object>(p: StateProxy<P>) => {
        dependencies.set(p, getVersion(p) as number);
        return p;
      };
      const value = fn(get as DeriveGet, getSnapshot(derivedProxy));
      const subscribe = () => {
        dependencies.forEach((_, p) => {
          if (!lastDependencies?.has(p)) {
            addSubscription(p as StateProxy<TDerive>, key, evaluate);
          }
        });
        lastDependencies?.forEach((_, p) => {
          if (!dependencies.has(p)) {
            removeSubscription(p as StateProxy<TDerive>, key);
          }
        });
        lastDependencies = dependencies;
      };

      subscribe();
      (derivedProxy as TDerive)[key] = value as TDerive[typeof key];
    };

    evaluate();
  });
  return derivedProxy;
};
