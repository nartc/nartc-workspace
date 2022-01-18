// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import { getUnsubscribes, StateProxy } from 'ngx-bang';
import { isObservable, Observable } from 'rxjs';

export function asyncEffect<TData extends object, TAsyncValue>(
  stateProxy: StateProxy<TData>,
  effect: Observable<TAsyncValue> | PromiseLike<TAsyncValue>,
  successCallback?: (value: TAsyncValue) => void,
  errorCallback?: (error: any) => void
) {
  if (isObservable(effect)) {
    getUnsubscribes(stateProxy).add(
      effect.subscribe({
        next: (value) => {
          if (successCallback) successCallback(value);
        },
        error: (error) => {
          if (errorCallback) errorCallback(error);
        },
      })
    );
  } else {
    const promise = (effect as Promise<TAsyncValue>).then((value) => {
      if (successCallback) successCallback(value);
    });

    if (errorCallback) {
      promise.catch((error) => {
        errorCallback(error);
      });
    }
  }
}
