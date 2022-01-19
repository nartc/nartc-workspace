import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  NgModule,
  OnInit,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { StatefulDirectiveModule } from 'ngx-bang';
import { TodoFooterComponent } from './todo-footer.component';
import { TodoInputComponent } from './todo-input.component';
import { TodoItemComponent } from './todo-item.component';
import { TodoListComponent } from './todo-list.component';
import { TodoStore } from './todo.store';

@Component({
  selector: 'bang-todo',
  template: `
    <ng-container *stateful="todoStore.state; derived: todoStore.derive">
      <section class="todoapp">
        <header class="header">
          <h1>todos</h1>
          <bang-todo-input
            *ngIf="!todoStore.snapshot.loading; else loading"
            (addTodo)="todoStore.addTodo($event)"
          ></bang-todo-input>
        </header>
        <bang-todo-list
          *ngIf="todoStore.derived.hasTodo"
          [todos]="todoStore.derived.filteredTodos"
          (toggle)="todoStore.toggle($event.index)"
          (update)="todoStore.update($event.index, $event.text)"
          (delete)="todoStore.delete($event.index)"
        ></bang-todo-list>
        <bang-todo-footer
          *ngIf="todoStore.derived.hasTodo"
          [hasCompletedTodos]="todoStore.derived.hasCompleteTodo"
          [incompleteTodosCount]="todoStore.derived.incompleteTodosCount"
          [currentFilter]="todoStore.snapshot.filter"
          (filter)="todoStore.changeFilter($event)"
          (clearCompleted)="todoStore.clearCompleted()"
        ></bang-todo-footer>

        <ng-template #loading>
          <div>loading...</div>
        </ng-template>
      </section>
      <footer class="info">
        <p>Double-click to edit a todo</p>
        <p>Part of <a href="http://todomvc.com">TodoMVC</a></p>
      </footer>
    </ng-container>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [TodoStore],
})
export class TodoComponent implements OnInit {
  constructor(public todoStore: TodoStore) {}

  ngOnInit() {
    this.todoStore.init();
  }
}

@NgModule({
  declarations: [
    TodoComponent,
    TodoListComponent,
    TodoItemComponent,
    TodoInputComponent,
    TodoFooterComponent,
  ],
  imports: [
    RouterModule.forChild([{ path: ':filter', component: TodoComponent }]),
    CommonModule,
    StatefulDirectiveModule,
  ],
})
export class TodoModule {}
