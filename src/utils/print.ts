import * as prettier from 'prettier/standalone';
import { parse } from 'maraca';

const {
  breakParent,
  concat,
  group,
  ifBreak,
  indent,
  join,
  line,
  softline,
} = prettier.doc.builders;

export const languages = [
  {
    name: 'Maraca',
    parsers: ['maraca'],
    extensions: ['.ma'],
    tmScope: 'source.maraca',
    vscodeLanguageIds: ['maraca'],
  },
];

export const parsers = {
  maraca: {
    parse,
    astFormat: 'maraca',
    locStart: node => node.start,
    locEnd: node => node.end,
  },
};

const indentBreak = (...docs) => ifBreak(indent(concat(docs)), concat(docs));

const printConfig = (
  path,
  print,
  { type, nodes = [] as any[], info = {} as any },
) => {
  if (type === 'assign') {
    if (nodes[1].type === 'nil') {
      return group(
        concat([':', indentBreak(line, path.call(print, 'nodes', '0'))]),
      );
    }
    return group(
      concat([
        path.call(print, 'nodes', '1'),
        ':',
        indentBreak(line, path.call(print, 'nodes', '0')),
      ]),
    );
  }
  if (type === 'list') {
    return group(
      concat([
        '[',
        indent(
          concat([
            softline,
            join(
              concat([',', line]),
              path
                .map(p => {
                  const c = p.getValue();
                  if (
                    c.type === 'nil' ||
                    (c.type === 'assign' && c.nodes[0].type === 'nil')
                  ) {
                    return null;
                  }
                  return print(p);
                }, 'nodes')
                .filter(x => x),
            ),
          ]),
        ),
        ifBreak(',', ''),
        softline,
        ']',
      ]),
    );
  }
  if (type === 'value') return info.value;
  if (type === 'nil') return '';
};

const printBreak = (path, print, config) => {
  const result = printConfig(path, print, config);
  if (config.break) return concat([breakParent, result]);
  return result;
};

export const printers = {
  maraca: {
    print(path, _, print) {
      const config = path.getValue();
      return printBreak(path, print, config);
    },
  },
};
