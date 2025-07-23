import { createRequire } from 'module';
import { readFileSync } from 'fs';
import type { SqlJsStatic } from 'sql.js';

const require = createRequire(import.meta.url);
const initSqlJs: (cfg: {
	wasmBinary: ArrayBuffer;
}) => Promise<SqlJsStatic> = require('sql.js/dist/sql-wasm.js');

const wasmPath = require.resolve('sql.js/dist/sql-wasm.wasm'); // real file path
const wasmBinary = readFileSync(wasmPath).buffer;

let p: Promise<SqlJsStatic> | undefined;
export function getSqlJs() {
	return (p ??= initSqlJs({ wasmBinary }));
}
