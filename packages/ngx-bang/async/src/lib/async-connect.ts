// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import { effect, getUnsubscribes, StateProxy } from 'ngx-bang';
import type { Observable } from 'rxjs';
import { isObservable } from 'rxjs';

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
