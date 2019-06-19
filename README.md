# Maraca-Render for JavaScript / web

The Maraca render library for JavaScript / web. Use this to turn Maraca output into an interactive web interface.

## Install

```
yarn add maraca-render
```

or

```
npm install maraca-render --save
```

## Maraca-Render documentation

Full documentation for the Maraca render framework itself can be found at https://maraca-lang.org/render.

## Basic Usage

```ts
import maraca from 'maraca';
import render from 'maraca-render';

const source = '[style: bold, Hello World]';

maraca(source, render(document.getElementById('root')));
```

## API

The core API takes a root node, and optionally any custom components, and creates a renderer which can be passed into Maraca.

```ts
render(node, components?): (data) => void;
```

### `components: { [name]: () => { node, update, destroy? } }`

The components parameter takes a dictionary of custom components, keyed by their name (used to reference them from your Maraca code).

Each component is a constructor function which returns a DOM node, an update method, and an optional destroy method.

#### `update: (values: { [key]: data }, indices: data[]) => void`

The update method is called whenever the component's data is updated. The list corresponding to the component is separated into values (non-indexed entries) and indices (indexed entries). The data type is the same as from the Maraca runtime.

#### `destroy: () => void`

The destroy method is called when the component is unmounted, so use it to dispose any resources.
