import { createSliceActions } from './create-slice-actions';
import type { AnyFunction, PayloadAction } from './typings';

const getter = (featureName: string, actionName: string) =>
  featureName + '/' + actionName;

describe(createSliceActions.name, () => {
  it('should return {noop} if reducers is empty', () => {
    expect(createSliceActions('feature', getter, {})).toEqual({
      noop: expect.any(Function),
    });
  });

  it('should return actions for case reducers', () => {
    const actions = createSliceActions('feature', getter, {
      foo: (state) => state,
      bar: (state) => state,
    });

    expect(Object.keys(actions).length).toEqual(3);
    ['foo', 'bar'].forEach((key) => {
      expect((actions as Record<string, AnyFunction>)[key]).toBeTruthy();
      expect((actions as Record<string, AnyFunction>)[key]()).toEqual({
        type: 'feature/' + key,
      });
    });
  });

  it('should return actions for async case reducers', () => {
    const actions = createSliceActions('feature', getter, {
      foo: {
        success: (state) => state,
        trigger: (state) => state,
      },
      bar: {
        success: (state) => state,
        failure: (state) => state,
      },
    });

    expect(Object.keys(actions).length).toEqual(3);
    ['foo', 'bar'].forEach((key) => {
      const action = (actions as Record<string, any>)[key];
      expect(action).toBeTruthy();
      expect(Object.keys(action).length).toEqual(2);

      Object.keys(action).forEach((actionKey) => {
        expect(action[actionKey]()).toEqual({
          type: `feature/${key} ${actionKey}`,
        });
      });
    });
  });

  it('should return actions with payload', () => {
    const actions = createSliceActions('feature', getter, {
      foo: (state, _: PayloadAction<{ foo: string }>) => state,
      bar: {
        success: (state) => state,
        trigger: (state, _: PayloadAction<{ bar: string }>) => state,
      },
    });

    expect(Object.keys(actions).length).toEqual(3);
    ['foo', 'bar'].forEach((key) => {
      const action = (actions as Record<string, any>)[key];
      expect(action).toBeTruthy();
      if (key === 'foo') {
        expect(action({ foo: 'foo' })).toEqual({
          type: 'feature/foo',
          foo: 'foo',
        });
      } else if (key === 'bar') {
        expect(action['trigger']({ bar: 'bar' })).toEqual({
          type: 'feature/bar trigger',
          bar: 'bar',
        });
      }
    });
  });

  it('should return actions with correct name if actionsMap is provided', () => {
    const actions = createSliceActions(
      'feature',
      getter,
      {
        foo: (state) => state,
        bar: state => state
      },
      { foo: '[Foo Action] The Foo', noop: '[Noop Action] The Noop' }
    );

    expect(Object.keys(actions).length).toEqual(3);
    expect(actions.foo()).toEqual({
      type: '[Foo Action] The Foo',
    });
    expect(actions.noop()).toEqual({
      type: '[Noop Action] The Noop',
    });
    expect(actions.bar()).toEqual({
      type: 'feature/bar',
    });
  });
});
