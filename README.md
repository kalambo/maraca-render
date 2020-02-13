# Maraca-Render for JavaScript / web

The Maraca-Render library for JavaScript / web. Use this to turn Maraca output
into an interactive web interface.

## Install

```
yarn add maraca-render
```

or

```
npm install maraca-render --save
```

## Maraca-Render documentation

Full documentation for the Maraca-Render framework itself can be found at
https://maraca-lang.org/render.

## Basic Usage

```ts
import maraca from 'maraca';
import render from 'maraca-render';

const source = '[style: bold, Hello World]';

maraca(source, render(document.getElementById('root')));
```

## API

The core API takes a root node, and optionally any custom components, and
creates a renderer which can be passed into Maraca.

```ts
render(node, components?) => ((data) => void);
```

### `components: { [name]: Component }`

The components parameter takes a dictionary of custom components, keyed by their
name (used to reference them from your Maraca code). Each component is a class
matching the following Component API.

```ts
class Component {
  static nodeType?;
  static getInfo(values, context) => { props; context };
  constructor?(node);
  render(node, props);
  dispose?();
}
```

#### `static nodeType?`

The optional `nodeType` static property tells Maraca-Render what type of HTML
element to create as the root node for this component.

#### `static getInfo(values, context) => { props; context }`

The `getInfo` static method takes the values provided to the component
(non-indexed items from the relevant Maraca box), along with the current
context, and returns the props for this component (passed to `render`), and the
new context (passed to any child components).

#### `constructor?(node)`

The optional constructor is called with the root node for this instance. Use
this to do any required setup for the component.

#### `render(node, props)`

The render method is called whenever the props are updated, and is used to
update the DOM.

#### `dispose: () => void`

The optional `dispose` method is called when the component is removed. Use this
to dispose of any resources.
