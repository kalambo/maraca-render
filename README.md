# Maraca Render for JavaScript / web

The Maraca render library for JavaScript / web. Use this to turn Maraca output into an interactive web interface.

## Install

```
yarn add maraca-render
```

or

```
npm install maraca-render --save
```

## Maraca Render documentation

Full documentation for the Maraca render framework itself can be found at https://maraca-lang.org/render.

## Usage

```ts
import maraca from 'maraca';
import render, { box } from 'maraca-render';

const source = '[x: 1, y: 2, z: x? * y?]';

maraca(source, render(box(), root));
```
