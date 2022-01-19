import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    HttpClientModule,
    RouterModule.forRoot(
      [
        {
          path: 'counter',
          loadChildren: () =>
            import('./counter/counter.component').then(
              (m) => m.CounterComponentModule
            ),
        },
        {
          path: 'todo',
          loadChildren: () =>
            import('./todo/todo.component').then((m) => m.TodoModule),
        },
        {
          path: '',
          redirectTo: 'counter',
          pathMatch: 'full',
        },
      ],
      { initialNavigation: 'enabledBlocking' }
    ),
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
