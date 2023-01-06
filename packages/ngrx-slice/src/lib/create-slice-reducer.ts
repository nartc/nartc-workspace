import type { ActionCreator, ActionReducer } from '@ngrx/store';
import { createReducer, on } from '@ngrx/store';
import { produce } from 'immer';
import type {
  CaseReducer,
  SliceActions,
  SliceCaseReducers,
  SliceOptions,
} from './typings';

export function createSliceReducer<
  SliceState extends object,
  SliceName extends string = string,
  CaseReducers extends SliceCaseReducers<SliceState> = SliceCaseReducers<SliceState>
>(
  initialState: SliceState,
  actions: SliceActions<SliceState, CaseReducers>,
  reducers: CaseReducers,
  extraReducers?: SliceOptions<
    SliceName,
    SliceState,
    CaseReducers
  >['extraReducers']
): ActionReducer<SliceState> {
  const reducerArgs = [] as Array<ReturnType<typeof on>>;
  const extra: Array<ReturnType<typeof on>> = (extraReducers || []) as Array<
    ReturnType<typeof on>
  >;

  for (const [reducerKey, reducer] of Object.entries(reducers)) {
    const typeOfReducer = typeof reducer;

    if (typeOfReducer === 'function') {
      reducerArgs.push(
        on(actions[reducerKey] as unknown as ActionCreator, (state, payload) =>
          produce(state, (draft) => (reducer as any)(draft, payload))
        )
      );
      continue;
    }

    Object.keys(reducer).forEach((asyncKey) => {
      const asyncReducer = (reducer as unknown as Record<string, CaseReducer>)[
        asyncKey
      ];
      reducerArgs.push(
        on(
          (actions[reducerKey] as unknown as Record<string, ActionCreator>)[
            asyncKey
          ],
          (state, payload) =>
            produce(state, (draft) => asyncReducer(draft, payload))
        )
      );
    });
  }

  return createReducer(initialState, ...(reducerArgs.concat(extra) as any));
}
