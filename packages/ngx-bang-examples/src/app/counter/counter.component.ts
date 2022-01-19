import {
  ChangeDetectionStrategy,
  Component,
  NgModule,
  OnInit,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  derive,
  snapshot,
  SnapshotPipeModule,
  state,
  StatefulDirectiveModule,
} from 'ngx-bang';
import { asyncConnect } from 'ngx-bang/async';
import { map, timer } from 'rxjs';

interface CounterState {
  count: number;
  incrementCount: number;
  decrementCount: number;
  secondsPassed: number;
}

@Component({
  selector: 'bang-counter',
  template: `
    <ng-container *stateful="state; let snapshot">
      <button (click)="onDecrement()">-</button>
      <span>
        Double of {{ snapshot.count }} is {{ (derived | snap).double }}
      </span>
      <button (click)="onIncrement()">+</button>
      <p>You have clicked increment: {{ snapshot.incrementCount }}</p>
      <p>You have clicked decrement: {{ snapshot.decrementCount }}</p>
      <p>
        Seconds since last "count" ({{ snapshot.count }}) changed:
        {{ snapshot.secondsPassed }}s
      </p>
    </ng-container>
  `,
  styles: [
    `
      button {
        cursor: pointer;
        padding: 0.25rem 1rem;
        background: white;
        border: 1px solid black;
        border-radius: 0.25rem;
      }

      span {
        margin: 0 1rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CounterComponent implements OnInit {
  state = state<CounterState>({
    count: 0,
    incrementCount: 0,
    decrementCount: 0,
    secondsPassed: 0,
  });

  derived = derive({
    double: (get) => get(this.state).count * 2,
  });

  ngOnInit() {
    asyncConnect(this.state, 'secondsPassed', [
      timer(0, 1000).pipe(map((tick) => tick + 1)),
      ['count'],
    ]);
  }

  onIncrement() {
    const { count, incrementCount } = snapshot(this.state);
    this.state.count = count + 1;
    this.state.incrementCount = incrementCount + 1;
  }

  onDecrement() {
    const { count, decrementCount } = snapshot(this.state);
    this.state.count = count - 1;
    this.state.decrementCount = decrementCount + 1;
  }
}

@NgModule({
  declarations: [CounterComponent],
  imports: [
    RouterModule.forChild([{ path: '', component: CounterComponent }]),
    StatefulDirectiveModule,
    SnapshotPipeModule,
  ],
})
export class CounterComponentModule {}
