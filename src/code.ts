import { parse, toData } from 'maraca';
import * as CodeMirror from 'codemirror';
import * as prettier from 'prettier/standalone';
import * as prettierMaraca from 'prettier-plugin-maraca';

// @ts-ignore
window.CodeMirror = CodeMirror;
import 'codemirror/addon/mode/simple';
import 'codemirror/lib/codemirror.css';

CodeMirror.defineSimpleMode('maraca', {
  start: [
    { regex: /'\S/, token: 'string' },
    { regex: /\[|\(|\{/, token: 'attribute', indent: true },
    { regex: /\]|\)|\}/, token: 'attribute', dedent: true },
    { regex: /,/, token: 'attribute' },
    {
      regex: /((\\d+\\.\\d+)|([a-zA-Z0-9]+))?(:=\\?|:=|::|:|=>>|=>|~)/,
      token: 'keyword',
    },
    { regex: /\?/, token: 'attribute' },
    { regex: /(@@@|@@|@|##|#)((\d+\.\d+)|([a-zA-Z0-9]+))?/, token: 'def' },
    { regex: /<=|>=|==|<|>|=|\+|\-|\*|\/|%|\^|!|\./, token: 'operator' },
    { regex: /(\d+\.\d+)|([a-zA-Z0-9]+)/, token: 'number' },
    { regex: /"/, token: 'string', push: 'string' },
  ],
  string: [
    { regex: /[^"]+/, token: 'string' },
    { regex: /""/, token: 'string-2' },
    { regex: /"(?!")/, token: 'string', pop: true },
  ],
  meta: {
    electricChars: '])}',
  },
});

const formatCode = code => {
  try {
    parse(code);
    return prettier.format(code, {
      parser: 'maraca',
      plugins: [prettierMaraca],
    });
  } catch {
    return code;
  }
};

export default (node, { code = '', format }, setters) => {
  node.style.height = '600px';
  if (!node.__editor) {
    node.__editorFormat = format;
    node.__editor = CodeMirror(node, {
      value: code,
      mode: 'maraca',
      tabSize: 2,
      lineNumbers: true,
    });
    node.__editor.on('change', () => {
      setters.code(toData(node.__editor.getDoc().getValue()));
    });
  }
  const formatted = format === node.__editorFormat ? code : formatCode(code);
  node.__editorFormat = format;
  if (formatted !== code) {
    setters.code(toData(formatted));
  }
  if (formatted !== node.__editor.getDoc().getValue()) {
    node.__editor.getDoc().setValue(formatted);
  }
  setTimeout(() => node.__editor.refresh());
};
