import { Inject, Injectable, Optional } from '@angular/core';
// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import { INITIAL_STATE, State } from 'ngx-bang';
import { Subject } from 'rxjs';

@Injectable()
export class DestroyedAwareState<TState extends object> extends State<TState> {
  protected destroyed$ = new Subject<void>();

  constructor(@Optional() @Inject(INITIAL_STATE) initialState: TState) {
    super(initialState);
  }

  override ngOnDestroy() {
    this.destroyed$.next();
    super.ngOnDestroy();
  }
}
