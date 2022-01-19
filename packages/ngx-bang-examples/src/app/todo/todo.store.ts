import { ChangeDetectorRef, Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { effect, snapshot, State } from 'ngx-bang';
import { asyncConnect } from 'ngx-bang/async';
import { tap } from 'rxjs';
import { Todo, TodoFilter } from './todo';
import { TodoService } from './todo.service';

export interface TodoState {
  todos: Todo[];
  loading: boolean;
  filter: TodoFilter;
}

const initialState: TodoState = {
  todos: [],
  filter: 'SHOW_ALL',
  loading: false,
};

export interface TodoDerived {
  filteredTodos: Todo[];
  hasTodo: boolean;
  hasCompleteTodo: boolean;
  incompleteTodosCount: number;
}

@Injectable()
export class TodoStore extends State<TodoState> {
  derive = this.createDerive<TodoDerived>({
    filteredTodos: (get) => {
      const { filter, todos } = get(this.state);
      switch (filter) {
        default:
        case 'SHOW_ALL':
          return todos;
        case 'SHOW_COMPLETED':
          return todos.filter((t) => t.completed);
        case 'SHOW_ACTIVE':
          return todos.filter((t) => !t.completed);
      }
    },
    hasTodo: (get) => get(this.state).todos.length > 0,
    hasCompleteTodo: (get) =>
      get(this.state).todos.filter((t) => t.completed).length > 0,
    incompleteTodosCount: (get) =>
      get(this.state).todos.filter((t) => !t.completed).length,
  });

  get derived(): TodoDerived {
    return snapshot(this.derive);
  }

  constructor(
    private todoService: TodoService,
    private router: Router,
    private route: ActivatedRoute,
    cdr: ChangeDetectorRef
  ) {
    super(cdr, initialState);
  }

  init() {
    this.loadInitialFilter();
    this.loadTodo();
    this.changeFilterEffect();
  }

  private loadInitialFilter() {
    const initialFilter = this.route.snapshot.params['filter'];
    this.changeFilter(
      initialFilter === 'active'
        ? 'SHOW_ACTIVE'
        : initialFilter === 'completed'
        ? 'SHOW_COMPLETED'
        : 'SHOW_ALL'
    );
  }

  private loadTodo() {
    this.state.loading = true;
    asyncConnect(
      this.state,
      'todos',
      this.todoService.getTodos().pipe(tap(() => (this.state.loading = false)))
    );
  }

  private changeFilterEffect() {
    effect(this.state, ['filter'], () => {
      switch (this.snapshot.filter) {
        case 'SHOW_ACTIVE': {
          void this.router.navigate(['/todo', 'active']);
          break;
        }
        case 'SHOW_COMPLETED': {
          void this.router.navigate(['/todo', 'completed']);
          break;
        }
        default: {
          void this.router.navigate(['/todo', 'all']);
          break;
        }
      }
    });
  }

  addTodo(newTodo: string) {
    this.state.todos.push({
      id: Math.random(),
      text: newTodo,
      creationDate: new Date(),
      completed: false,
    });
  }

  toggle(index: number) {
    this.state.todos[index].completed = !this.snapshot.todos[index].completed;
  }

  update(index: number, text: string) {
    this.state.todos[index].text = text;
  }

  delete(index: number) {
    this.state.todos.splice(index, 1);
  }

  changeFilter(filter: TodoFilter) {
    this.state.filter = filter;
  }

  clearCompleted() {
    this.state.todos = this.snapshot.todos.filter((todo) => !todo.completed);
  }
}
