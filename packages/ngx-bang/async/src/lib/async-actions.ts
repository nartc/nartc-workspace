import { Observable, Subject } from 'rxjs';

type AsyncActions<TActions extends object> = {
  [TActionKey in keyof TActions]: (args: TActions[TActionKey]) => void;
};

type AsyncActionsObservables<TActions extends object> = {
  [TActionKey in Extract<
    keyof TActions,
    string
  > as `${TActionKey}$`]: Observable<TActions[TActionKey]>;
};

type AsyncActionsProxy<TActions extends object> = AsyncActions<TActions> &
  AsyncActionsObservables<TActions>;

export function asyncActions<
  TActions extends object
>(): AsyncActionsProxy<TActions> {
  const subCache: Record<string, Subject<any>> = {};
  return new Proxy(
    {},
    {
      get: (_, p: string) => {
        if (p.endsWith('$')) {
          return (subCache[p] || (subCache[p] = new Subject())).asObservable();
        }

        return (args: TActions[keyof TActions]) => {
          const $prop = p + '$';
          const sub = subCache[$prop] || (subCache[$prop] = new Subject());
          sub.next(args);
        };
      },
      set: () => {
        throw new Error('setters are not available on asyncActions');
      },
    }
  ) as AsyncActionsProxy<TActions>;
}
