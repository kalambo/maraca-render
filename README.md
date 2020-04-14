# Maraca-Render for JavaScript / web

The Maraca-Render library for JavaScript / web. Use this to render Maraca output
as dynamic HTML.

## Install

```
yarn add maraca-render
```

or

```
npm install maraca-render --save
```

## Maraca-Render documentation

Full documentation for working with Maraca data as HTML (via Maraca-Render) can
be found at https://maraca-lang.org/app.

## Basic Usage

```ts
import maraca from 'maraca';
import render from 'maraca-render';

const source = "[style: ['font-weight': bold], Hello World]";

maraca(source, render(document.getElementById('root')));
```

## API

The core API takes a node, and creates a function which can be passed into
Maraca, to render the output as HTML inside the provided root node.

```ts
render = (node) => ((data) => void);
```
