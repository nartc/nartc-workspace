# ngx-lil-gui

## Installation

    npm install ngx-lil-gui lil-gui

## Usage

Add `NgxLilGuiModule` to your module imports which will expose 3 components

```ts
@NgModule({
  imports: [NgxLilGuiModule],
})
export class SomeModule {
}
```

### `ngx-lil-gui`

This wraps a [`GUI`](https://lil-gui.georgealways.com/#GUI) instance. There are 3 ways to use `ngx-lil-gui`:

1. `ngx-lil-gui`: This acts as a grouping folder with no **immediate** controllers underneath it.
2. `ngx-lil-gui[config]`: You can pass a `NgxLilGuiConfig` object to the `ngx-lil-gui` component and the controllers
   will be built based on the config.
3. `ngx-lil-gui[object]`: Build the GUI declaratively on the template. `[object]` is the object that this GUI controls.

#### Nested GUI

You can nest `ngx-lil-gui` and it will create a folder structure for you.

```html

<div #divElement>
  <span #spanElement></span>
</div>

<ngx-lil-gui title="Group">
  <ngx-lil-gui title="DIV" [object]="divElement.style"></ngx-lil-gui>
  <ngx-lil-gui title="SPAN" [object]="spanElement.style"></ngx-lil-gui>
</ngx-lil-gui>
```

### `ngx-lil-gui-controller`

This wraps a [`Controller`](https://lil-gui.georgealways.com/#Controller).

```html

<div #divElement></div>

<ngx-lil-gui title="DIV" [object]="divElement.style">
  <ngx-lil-gui-controller
    property="display"
    [controllerConfig]="{collection: ['block', 'flex', 'inline-flex']}"
  ></ngx-lil-gui-controller>
</ngx-lil-gui>
```

### `ngx-lil-gui-color`

This wraps a [`Controller`](https://lil-gui.georgealways.com/#Controller) as well. It will display a color picker.

```html

<div #divElement></div>

<ngx-lil-gui title="DIV" [object]="divElement.style">
  <ngx-lil-gui-color property="backgroundColor"></ngx-lil-gui-color>
</ngx-lil-gui>
```
