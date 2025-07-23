import type { SqlJsStatic } from 'sql.js';
import { browser } from '$app/environment';
import { getServerFetch } from '$lib/server/fetchStore';

let p: Promise<SqlJsStatic> | undefined;

export function getSqlJs(): Promise<SqlJsStatic> {
	if (p) return p;

	const f = browser ? fetch : getServerFetch();

	p = (async () => {
		const resp = await f('/sql-wasm.wasm');
		const wasmBinary = new Uint8Array(await resp.arrayBuffer());
		const mod: any = await import('sql.js/dist/sql-wasm.js');
		const init = (mod.default ?? mod) as (cfg: { wasmBinary: Uint8Array }) => Promise<SqlJsStatic>;
		return init({ wasmBinary });
	})();

	return p;
}
