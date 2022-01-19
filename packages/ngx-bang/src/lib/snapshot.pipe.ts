import { NgModule, Pipe, PipeTransform } from '@angular/core';
import type { StateProxy } from './types';
import { snapshot } from './utils';

@Pipe({ name: 'snap', pure: false })
export class SnapshotPipe implements PipeTransform {
  transform<TState extends object>(value: StateProxy<TState>): TState {
    return snapshot(value);
  }
}

@NgModule({
  declarations: [SnapshotPipe],
  exports: [SnapshotPipe],
})
export class SnapshotPipeModule {}
