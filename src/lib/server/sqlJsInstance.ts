// src/lib/server/sqlJsInstance.ts
import initSqlJs, { type SqlJsStatic } from 'sql.js/dist/sql-wasm.js';

let sqlJs: Promise<SqlJsStatic> | null = null;

export function getSqlJs(): Promise<SqlJsStatic> {
	if (!sqlJs) sqlJs = initSqlJs(); // Wasm bytes are embedded → no path issues
	return sqlJs;
}
