// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import { effect, getUnsubscribes, StateProxy } from 'ngx-bang';
import type { Observable } from 'rxjs';
import { isObservable } from 'rxjs';

/**
 * Connect an async object (Observable/Promise) to a property on the StateProxy
 *
 * @template TData, TKey
 * @param {StateProxy<TData>} stateProxy - the `StateProxy` that this connector is associated with
 * @param {TKey} stateKey - the property key on the `StateProxy` that the connector should connect to
 * @param {| Observable<TData[TKey]> | [Observable<TData[TKey]>, TKey[]] | PromiseLike<TData[TKey]>} connector - the Connector. Can be a Promise, an Observable, or an array with [Observable, dependenciesKeys]
 *
 * @returns {void}
 */
export function asyncConnect<TData extends object, TKey extends keyof TData>(
  stateProxy: StateProxy<TData>,
  stateKey: TKey,
  connector:
    | Observable<TData[TKey]>
    | [Observable<TData[TKey]>, TKey[]]
    | PromiseLike<TData[TKey]>
): void {
  const [connectorInput, deps = []]: [
    Observable<TData[TKey]> | PromiseLike<TData[TKey]>,
    TKey[]?
  ] = Array.isArray(connector) ? connector : [connector];

  const isConnectorObservable = isObservable(connectorInput);

  if (!isConnectorObservable) {
    connectorInput.then((value) => {
      stateProxy[stateKey] = value;
    });
    return;
  }

  if (deps.length > 0) {
    effect(stateProxy, deps, () => {
      const sub = connectorInput.subscribe((value: TData[TKey]) => {
        stateProxy[stateKey] = value;
      });
      return () => {
        sub.unsubscribe();
      };
    });
  } else {
    getUnsubscribes(stateProxy).add(
      connectorInput.subscribe((value: TData[TKey]) => {
        stateProxy[stateKey] = value;
      })
    );
  }
}
