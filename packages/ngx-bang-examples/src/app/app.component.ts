import { Component } from '@angular/core';

@Component({
  selector: 'bang-root',
  template: `
    <ul class="nav">
      <li routerLink="counter">Counter</li>
      <li routerLink="todo/all">Todo</li>
    </ul>
    <router-outlet></router-outlet>
  `,
})
export class AppComponent {}
