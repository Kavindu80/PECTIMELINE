const fs = require('fs');
const path = require('path');

console.log('Checking for Rollup native module issue...');

// Path to Vite's bundled Rollup native.js
const nativePath = path.join(__dirname, 'node_modules', 'vite', 'node_modules', 'rollup', 'dist', 'native.js');

if (!fs.existsSync(nativePath)) {
  console.log('Rollup native.js not found, skipping patch');
  process.exit(0);
}

let content = fs.readFileSync(nativePath, 'utf8');

// Check if already patched
if (content.includes('PATCHED: Try WASM fallback')) {
  console.log('✓ Rollup already patched');
  process.exit(0);
}

// Find the error throwing section and replace with WASM fallback
const originalError = `\t\tthrow new Error(
\t\t\t\`Cannot find module \${id}. \` +
\t\t\t\t\`npm has a bug related to optional dependencies (https://github.com/npm/cli/issues/4828). \` +
\t\t\t\t'Please try \`npm i\` again after removing both package-lock.json and node_modules directory.',
\t\t\t{ cause: error }
\t\t);`;

const patchedError = `\t\t// PATCHED: Try WASM fallback instead of throwing error
\t\tconsole.warn('Native Rollup module not available, using WASM fallback (slower but functional)');
\t\ttry {
\t\t\tconst wasmBindings = require('@rollup/wasm-node/dist/wasm-node/bindings_wasm.js');
\t\t\treturn {
\t\t\t\tparse: wasmBindings.parse,
\t\t\t\tparseAsync: async (code, allowReturnOutsideFunction, jsx, _signal) =>
\t\t\t\t\twasmBindings.parse(code, allowReturnOutsideFunction, jsx),
\t\t\t\txxhashBase64Url: wasmBindings.xxhashBase64Url,
\t\t\t\txxhashBase36: wasmBindings.xxhashBase36,
\t\t\t\txxhashBase16: wasmBindings.xxhashBase16
\t\t\t};
\t\t} catch (wasmError) {
\t\t\tthrow new Error(
\t\t\t\t\`Cannot find module \${id}. \` +
\t\t\t\t\t\`npm has a bug related to optional dependencies (https://github.com/npm/cli/issues/4828). \` +
\t\t\t\t\t'Please try \`npm i\` again after removing both package-lock.json and node_modules directory.',
\t\t\t\t{ cause: error }
\t\t\t);
\t\t}`;

if (content.includes(originalError)) {
  content = content.replace(originalError, patchedError);
  fs.writeFileSync(nativePath, content, 'utf8');
  console.log('✓ Successfully patched Rollup to use WASM fallback');
  console.log('  This fixes the @rollup/rollup-win32-x64-msvc download issue caused by corporate firewall');
} else {
  console.log('⚠ Could not find expected error pattern, Rollup may have been updated');
  console.log('  Build may fail - please check if native module is available');
}
