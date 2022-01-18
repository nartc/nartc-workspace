import { getUnsubscribes, StateProxy } from 'ngx-bang';
import type { Observable } from 'rxjs';
import { isObservable } from 'rxjs';

export function connect<TData extends object, TKey extends keyof TData>(
  stateProxy: StateProxy<TData>,
  stateKey: TKey,
  connector: Observable<TData[TKey]> | PromiseLike<TData[TKey]>
): void {
  const isConnectorObservable = isObservable(connector);
  if (isConnectorObservable) {
    getUnsubscribes(stateProxy).add(
      connector.subscribe((value: TData[TKey]) => {
        stateProxy[stateKey] = value;
      })
    );
  } else {
    (connector as PromiseLike<TData[TKey]>).then((value) => {
      stateProxy[stateKey] = value;
    });
  }
}
