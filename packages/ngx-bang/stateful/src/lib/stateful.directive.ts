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
// eslint-disable-next-line @nx/enforce-module-boundaries
import type { Snapshot } from 'ngx-bang';
// eslint-disable-next-line @nx/enforce-module-boundaries
import {
  createInvalidate,
  destroy,
  setInvalidate,
  snapshot,
  watch,
} from 'ngx-bang';

export interface StatefulContext<TData extends object> {
  $implicit: Snapshot<TData>;
  stateful: Snapshot<TData>;
}

@Directive({
  selector: '[stateful]',
})
export class StatefulDirective<TData extends object>
  implements OnInit, OnDestroy
{
  static ngTemplateGuard_stateful: 'binding';

  @Input() set stateful(state: TData) {
    this.state = state;
    setInvalidate(this.state, this.invalidate);
  }

  @Input() statefulDebounced = true;

  private state!: TData;

  private viewRef?: EmbeddedViewRef<StatefulContext<TData>>;

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
        if (this.viewRef) {
          const latestSnapshot = snapshot(this.state);
          this.viewRef.context.stateful = latestSnapshot;
          this.viewRef.context.$implicit = latestSnapshot;
        }
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
    if (this.viewRef) {
      this.viewRef.destroy();
    }
    this.vcr.clear();
  }
}

@NgModule({
  declarations: [StatefulDirective],
  exports: [StatefulDirective],
})
export class StatefulDirectiveModule {}
