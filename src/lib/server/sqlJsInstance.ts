import type { SqlJsStatic } from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';

let sqlJsPromise: Promise<SqlJsStatic> | undefined;

export function getSqlJs(): Promise<SqlJsStatic> {
	if (!sqlJsPromise) {
		sqlJsPromise = import('sql.js').then(({ default: init }) =>
			init({
				locateFile: () => wasmUrl // point to the bundled asset
			})
		);
	}
	return sqlJsPromise;
}
