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

export interface StatefulContext<TData extends object> {
  $implicit: TData;
  stateful: TData;
}

@Directive({
  selector: '[stateful]',
})
export class StatefulDirective<TData extends object>
  implements OnDestroy, OnInit
{
  static ngTemplateGuard_stateful: 'binding';
  static ngTemplateGuard_statefulDerived: 'binding';

  @Input() set stateful(state: StateProxy<TData>) {
    this.state = state;
    setInvalidate(this.state, this.invalidate);
  }

  @Input() statefulDebounced = true;

  @Input() set statefulDerived(derived: StateProxy | Array<StateProxy>) {
    this.deriveProxies = Array.isArray(derived) ? derived : [derived];
    this.deriveProxies.forEach((deriveProxy) =>
      setInvalidate(deriveProxy, this.invalidate)
    );
  }

  private state!: StateProxy<TData>;

  private viewRef?: EmbeddedViewRef<StatefulContext<TData>>;

  private deriveProxies: Array<StateProxy> = [];
  private invalidate = createInvalidate(this.cdr);

  static ngTemplateContextGuard<TData extends object = any>(
    dir: StatefulDirective<TData>,
    ctx: unknown
  ): ctx is StatefulContext<TData> {
    return true;
  }

  constructor(
    private cdr: ChangeDetectorRef,
    private templateRef: TemplateRef<StatefulContext<TData>>,
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
    });
  }

  ngOnDestroy() {
    destroy(this.state);
    this.deriveProxies.forEach(destroy);
  }
}

@NgModule({
  declarations: [StatefulDirective],
  exports: [StatefulDirective],
})
export class StatefulDirectiveModule {}
