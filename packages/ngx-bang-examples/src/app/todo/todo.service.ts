import { Injectable } from '@angular/core';
import { Todo } from './todo';

@Injectable({ providedIn: 'root' })
export class TodoService {
  getTodos(): Promise<Todo[]> {
    return fetch('assets/todos.json')
      .then((res) => res.json())
      .then((data) =>
        data.map((x: Todo) => ({
          id: x.id,
          text: x.text,
          creationDate: new Date(x.creationDate),
          completed: x.completed,
        }))
      ) as Promise<Todo[]>;
  }
}
