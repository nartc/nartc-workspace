import {
  ChangeDetectorRef,
  Directive,
  EmbeddedViewRef,
  Input,
  NgModule,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import type { StateProxy } from './types';
import {
  createInvalidate,
  destroy,
  setInvalidate,
  snapshot,
  watch,
} from './utils';

export interface StatefulContext<
  TData extends object,
  TDerived extends object
> {
  $implicit: TData;
  stateful: TData;
  derived: TDerived;
}

@Directive({
  selector: '[stateful]',
})
export class StatefulDirective<TData extends object, TDerived extends object>
  implements OnDestroy, OnInit
{
  static ngTemplateGuard_stateful: 'binding';
  static ngTemplateGuard_statefulDerived: 'binding';

  @Input() set stateful(state: StateProxy<TData>) {
    this.state = state;
    setInvalidate(this.state, this.invalidate);
  }

  @Input() statefulDebounced = true;

  @Input() set statefulDerived(derived: StateProxy<TDerived>) {
    this.derived = derived;
    setInvalidate(this.derived, this.invalidate);
  }

  private state!: StateProxy<TData>;

  private derived?: StateProxy<TDerived>;
  private viewRef?: EmbeddedViewRef<StatefulContext<TData, TDerived>>;

  private invalidate = createInvalidate(this.cdr);

  static ngTemplateContextGuard<
    TData extends object = any,
    TDerived extends object = any
  >(
    dir: StatefulDirective<TData, TDerived>,
    ctx: unknown
  ): ctx is StatefulContext<TData, TDerived> {
    return true;
  }

  constructor(
    private cdr: ChangeDetectorRef,
    private templateRef: TemplateRef<StatefulContext<TData, TDerived>>,
    private vcr: ViewContainerRef
  ) {}

  ngOnInit() {
    this.render();
    watch(
      this.state,
      () => {
        this.render();
        this.cdr.detectChanges();
      },
      this.statefulDebounced
    );
  }

  private render() {
    if (this.viewRef) {
      this.viewRef.destroy();
    }
    const currentSnapshot = snapshot(this.state);
    this.viewRef = this.vcr.createEmbeddedView(this.templateRef, {
      $implicit: currentSnapshot,
      stateful: currentSnapshot,
      derived: this.derived ? snapshot(this.derived) : ({} as TDerived),
    });
  }

  ngOnDestroy() {
    destroy(this.state);
    if (this.derived) {
      destroy(this.derived);
    }
  }
}

@NgModule({
  declarations: [StatefulDirective],
  exports: [StatefulDirective],
})
export class StatefulDirectiveModule {}
