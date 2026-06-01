import path from 'path';
import { Parser, Language, Node } from 'web-tree-sitter';

let instance: Parser | null = null;
let initPromise: Promise<Parser> | null = null;
let EXTENSION_PATH: string = '';

export type SyntaxNode = Node;

export const setExtensionPath = (ePath: string) => {
  EXTENSION_PATH = ePath;
};

export async function createParser(): Promise<Parser> {
  try {
    const baseDir = EXTENSION_PATH || path.join(__dirname, '..');

    const runtimeWasmPath = path.resolve(baseDir, 'dist', 'tree-sitter.wasm');
    const cppWasmPath = path.resolve(baseDir, 'dist', 'tree-sitter-cpp.wasm');

    console.log('Runtime WASM Path:', runtimeWasmPath);
    console.log('CPP WASM Path:', cppWasmPath);

    await Parser.init({
      locateFile(scriptName: string) {
        const wasmPath = path.join(EXTENSION_PATH, 'dist', scriptName);
        console.log('Loading WASM from:', wasmPath);
        return wasmPath;
      },
    });

    const parser = new Parser();

    const langPath = path.join(EXTENSION_PATH, 'dist', 'tree-sitter-cpp.wasm');
    const Lang = await Language.load(langPath);

    parser.setLanguage(Lang);
    instance = parser;
    return parser;
  } catch (e) {
    console.error('Failed to initialize parser:', e);
    throw e;
  }
}

export async function getParser(): Promise<Parser> {
  if (instance) {
    return instance;
  }
  if (initPromise) {
    return initPromise;
  }
  initPromise = createParser().then((parser) => parser);
  return initPromise;
}

export const parseCode = (parser: Parser, code: string) => {
  const tree = parser.parse(code);
  return tree?.rootNode;
};

export const logTree = (node: SyntaxNode) => {
  // eslint-disable-next-line no-console
  console.log(node.type, node.text);
  for (const child of node.children) {
    logTree(child);
  }
};
