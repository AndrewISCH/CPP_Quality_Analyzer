const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

const WASM_WEB_ENGINE_PATH =
  'node_modules/web-tree-sitter/web-tree-sitter.wasm';
const WASM_CPP_GRAMMAR_PATH =
  'node_modules/tree-sitter-cpp/tree-sitter-cpp.wasm';

const WASM_WEB_ENGINE_DIST_PATH = 'dist/web-tree-sitter.wasm';
const WASM_CPP_GRAMMAR_DIST_PATH = 'dist/tree-sitter-cpp.wasm';
// const WASM_GRAMMAR_DIST_PATH = 'dist/tree-sitter.wasm';

const copyWasmFiles = () => {
  if (!fs.existsSync(path.join(__dirname, 'dist'))) {
    fs.mkdirSync(path.join(__dirname, 'dist'));
  }

  fs.copyFileSync(
    path.join(__dirname, WASM_WEB_ENGINE_PATH),
    path.join(__dirname, WASM_WEB_ENGINE_DIST_PATH)
  );
  // fs.copyFileSync(
  //   path.join(__dirname, WASM_WEB_GRAMMAR_PATH),
  //   path.join(__dirname, WASM_GRAMMAR_DIST_PATH)
  // );
  fs.copyFileSync(
    path.join(__dirname, WASM_CPP_GRAMMAR_PATH),
    path.join(__dirname, WASM_CPP_GRAMMAR_DIST_PATH)
  );
};
const esbuildProblemMatcherPlugin = {
  name: 'esbuild-problem-matcher',
  setup(build) {
    build.onStart(() => {
      console.log('[watch] build started');
    });
    build.onEnd((result) => {
      result.errors.forEach(({ text, location }) => {
        console.error(`✘ [ERROR] ${text}`);
        console.error(
          `    ${location.file}:${location.line}:${location.column}:`
        );
      });
      copyWasmFiles();
      console.log('[watch] build finished');
    });
  },
};

async function main() {
  const ctx = await esbuild.context({
    entryPoints: ['src/extension.ts'],
    bundle: true,
    format: 'cjs',
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    platform: 'node',
    outfile: 'dist/extension.js',
    external: ['vscode', 'web-tree-sitter'],
    logLevel: 'silent',
    plugins: [
      /* add to the end of plugins array */
      esbuildProblemMatcherPlugin,
    ],
  });
  if (watch) {
    await ctx.watch();
  } else {
    await ctx.rebuild();
    await ctx.dispose();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
