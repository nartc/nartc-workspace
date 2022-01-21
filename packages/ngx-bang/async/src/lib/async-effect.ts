// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import { CleanUpFn, getUnsubscribes, StateProxy } from 'ngx-bang';
import { isObservable, Observable, tap } from 'rxjs';

/**
 * Execute side-effect for StateProxy
 *
 * @template TData, TAsyncValue
 * @param {StateProxy<TData>} stateProxy - the `StateProxy` that this Effect is associated with
 * @param {Observable<TAsyncValue> | PromiseLike<TAsyncValue>} effect - the cause that would cause the effect to run
 * @param {(value: TAsyncValue) => CleanUpFn | void} effectFn - the effect to run
 *
 * @returns {void}
 */
export function asyncEffect<TData extends object, TAsyncValue>(
  stateProxy: StateProxy<TData>,
  effect: Observable<TAsyncValue> | PromiseLike<TAsyncValue>,
  effectFn: (
    value: TAsyncValue
  ) => ((prev: TAsyncValue | undefined, isUnsub: boolean) => void) | void
) {
  const unsubscribes = getUnsubscribes(stateProxy);
  let cleanUpFn:
    | ((prev: TAsyncValue | undefined, isUnsub: boolean) => void)
    | void;
  if (isObservable(effect)) {
    let hasFirstRun = false;
    let prevValue: TAsyncValue | undefined = undefined;
    const teardown = () => {
      if (cleanUpFn) {
        cleanUpFn(prevValue, true);
      }
    };

    unsubscribes.add(
      effect
        .pipe(
          tap({
            next: (value) => {
              if (cleanUpFn && hasFirstRun) {
                cleanUpFn(prevValue, false);
              }

              const cleanUpOrVoid = effectFn(value);
              if (cleanUpOrVoid) {
                cleanUpFn = cleanUpOrVoid;
              }

              prevValue = value;

              if (!hasFirstRun) {
                hasFirstRun = true;
              }
            },
            unsubscribe: teardown,
            finalize: teardown,
          })
        )
        .subscribe()
    );
  } else {
    (effect as Promise<TAsyncValue>).then((value) => {
      cleanUpFn = effectFn(value);
      if (cleanUpFn) {
        unsubscribes.add(cleanUpFn.bind({}, undefined, true));
      }
    });
  }
}
