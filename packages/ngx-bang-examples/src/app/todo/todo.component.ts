import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  NgModule,
  OnInit,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { TodoFilter } from './todo';
import { TodoFooterComponent } from './todo-footer.component';
import { TodoInputComponent } from './todo-input.component';
import { TodoItemComponent } from './todo-item.component';
import { TodoListComponent } from './todo-list.component';
import { TodoStore } from './todo.store';

@Component({
  selector: 'bang-todo',
  template: `
    <section class="todoapp">
      <header class="header">
        <h1>todos</h1>
        <bang-todo-input
          *ngIf="!todoStore.snapshot.loading; else loading"
          (addTodo)="onAddTodo($event)"
        ></bang-todo-input>
      </header>
      <bang-todo-list
        *ngIf="todoStore.derived.hasTodo"
        [todos]="todoStore.derived.filteredTodos"
        (toggle)="onToggle($event.index)"
        (update)="onUpdate($event)"
        (delete)="onDelete($event.index)"
      ></bang-todo-list>
      <bang-todo-footer
        *ngIf="todoStore.derived.hasTodo"
        [hasCompletedTodos]="todoStore.derived.hasCompleteTodo"
        [incompleteTodosCount]="todoStore.derived.incompleteTodosCount"
        [currentFilter]="todoStore.snapshot.filter"
        (filter)="onFilter($event)"
        (clearCompleted)="onClearCompleted()"
      ></bang-todo-footer>

      <ng-template #loading>
        <div>loading...</div>
      </ng-template>
    </section>
    <footer class="info">
      <p>Double-click to edit a todo</p>
      <p>Part of <a href="http://todomvc.com">TodoMVC</a></p>
    </footer>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [TodoStore],
})
export class TodoComponent implements OnInit {
  constructor(public todoStore: TodoStore) {}

  ngOnInit() {
    this.todoStore.init();
  }

  onAddTodo(newTodo: string) {
    this.todoStore.addTodo(newTodo);
  }

  onToggle(index: number) {
    this.todoStore.toggle(index);
  }

  onUpdate({ index, text }: { index: number; text: string }) {
    this.todoStore.update(index, text);
  }

  onDelete(index: number) {
    this.todoStore.delete(index);
  }

  onFilter(filter: TodoFilter) {
    this.todoStore.changeFilter(filter);
  }

  onClearCompleted() {
    this.todoStore.clearCompleted();
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
  ],
})
export class TodoModule {}
