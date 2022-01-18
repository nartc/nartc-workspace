import { ChangeDetectorRef, Inject, Injectable, Optional } from '@angular/core';
import { INITIAL_STATE, State } from 'ngx-bang';
import { Subject } from 'rxjs';

@Injectable()
export class DestroyedAwareState<TState extends object> extends State<TState> {
  protected destroyed$ = new Subject<void>();

  constructor(
    cdr: ChangeDetectorRef,
    @Optional() @Inject(INITIAL_STATE) initialState: TState
  ) {
    super(cdr, initialState);
  }

  override ngOnDestroy() {
    this.destroyed$.next();
    super.ngOnDestroy();
  }
}
