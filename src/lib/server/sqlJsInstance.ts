import { createRequire } from 'module';
import { readFileSync } from 'node:fs';
import type { SqlJsStatic } from 'sql.js';
export const config = { runtime: 'nodejs18.x' };

const require = createRequire(import.meta.url);

// UMD bundle -> default export is the init fn
const initSqlJs: (cfg: {
	wasmBinary: Uint8Array;
}) => Promise<SqlJsStatic> = require('sql.js/dist/sql-wasm.js');

const wasmPath = require.resolve('sql.js/dist/sql-wasm.wasm');
const wasmBinary = readFileSync(wasmPath); // <-- Buffer (acts like Uint8Array)

// Quick sanity check:
if (
	!(
		wasmBinary[0] === 0x00 &&
		wasmBinary[1] === 0x61 &&
		wasmBinary[2] === 0x73 &&
		wasmBinary[3] === 0x6d
	)
) {
	throw new Error('WASM header incorrect — wrong/corrupted file');
}

let p: Promise<SqlJsStatic> | undefined;
export function getSqlJs() {
	return (p ??= initSqlJs({ wasmBinary }));
}
