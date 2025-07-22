import { type Database } from 'sql.js';
import { getSqlJs } from './sqlJsInstance';

const databaseRoot = 'https://protestmap.info/data';

interface LatestDbManifest {
	dbFilename: string;
	lastUpdated: string;
	sha?: string;
}

export interface DateSummary {
	date: Date;
	eventCount: number;
	hasTurnout: boolean;
}

export class EventDb {
	private static _instance: Promise<EventDb> | null = null;
	private static lastCheck = 0;
	private static readonly CHECK_INTERVAL_MS = 5 /* min */ * 60_000;

	private constructor(
		private db: Database,
		private manifest: LatestDbManifest
	) {}

	getCreatedAt(): Date {
		const stmt = this.db.prepare(`SELECT value FROM meta WHERE key = 'created_at'`);
		if (!stmt.step()) {
			stmt.free();
			throw new Error('created_at not found in meta');
		}

		const [createdAt] = stmt.get();
		stmt.free();
		return new Date(createdAt as string);
	}

	/**
	 * Return up to 20 distinct event names whose lower‑cased value
	 * contains `query`, ranked by
	 *   0. exact match
	 *   1. starts‑with match
	 *   2. ends‑with match
	 *   3. contains match
	 * then by descending occurrence count inside each tier.
	 *
	 * @param query the user’s search term (case‑insensitive)
	 */
	getMatchingEventNames(query: string): string[] {
		if (!query) return [];

		const needle = query.toLowerCase();

		// One prepared statement: 4 placeholders, all bound to the same `needle`
		const stmt = this.db.prepare(`
    /* Pull distinct names that contain the needle (case‑insensitively) */
    SELECT event_name,
           COUNT(*)                AS occurrences,
           /* Tiered ranking for ORDER BY                                        */
           CASE
             WHEN lower(event_name) = ?                 THEN 0
             WHEN lower(event_name) LIKE ? || '%'       THEN 1
             WHEN lower(event_name) LIKE '%' || ?       THEN 2
             ELSE 3                                     -- contains (fallback)
           END                                          AS tier
    FROM   events
    WHERE  lower(event_name) LIKE '%' || ? || '%'
    GROUP  BY event_name
    ORDER  BY tier, occurrences DESC                   -- (< tier, > count)
    LIMIT  20;
  `);

		const names: string[] = [];
		stmt.bind([needle, needle, needle, needle]);

		while (stmt.step()) {
			const row = stmt.getAsObject() as { event_name: string };
			names.push(row.event_name);
		}
		stmt.free(); // tidy up

		return names;
	}

	/**
	 * Return up to 20 distinct event names whose lower‑cased value
	 * contains `query`, ranked by
	 *   0. exact match
	 *   1. starts‑with match
	 *   2. ends‑with match
	 *   3. contains match
	 * then by descending occurrence count inside each tier.
	 *
	 * @param query the user’s search term (case‑insensitive)
	 */
	getMatchingLocations(query: string): string[] {
		if (!query) return [];

		const needle = query.toLowerCase();

		// One prepared statement: 4 placeholders, all bound to the same `needle`
		const stmt = this.db.prepare(`
    SELECT city_name,
           CASE
             WHEN lower(city_name) = ?                 THEN 0
             WHEN lower(city_name) LIKE ? || '%'       THEN 1
             WHEN lower(city_name) LIKE '%' || ?       THEN 2
             ELSE 3                                     -- contains (fallback)
           END                                          AS tier
    FROM   city_infos
    WHERE  lower(city_name) LIKE '%' || ? || '%'
    ORDER  BY tier ASC            
    LIMIT  20;
  `);

		const names: string[] = [];
		stmt.bind([needle, needle, needle, needle]);

		while (stmt.step()) {
			const row = stmt.getAsObject() as { city_name: string };
			names.push(row.city_name);
		}
		stmt.free(); // tidy up

		return names;
	}

	async checkIsUpdateAvailable() {
		const newManifest = await EventDb.#fetchManifest();
		return (
			newManifest.dbFilename !== this.manifest.dbFilename || newManifest.sha !== this.manifest.sha
		);
	}

	static async #fetchManifest(): Promise<LatestDbManifest> {
		const manifestRes = await fetch(`${databaseRoot}/latest.json`, { cache: 'no-cache' });
		if (!manifestRes.ok) throw new Error(`Failed to load latest.json`);
		return (await manifestRes.json()) as LatestDbManifest;
	}

	static async create(): Promise<EventDb> {
		const manifest = await EventDb.#fetchManifest();

		const dbRes = await fetch(`${databaseRoot}/${manifest.dbFilename}`);
		if (!dbRes.ok) throw new Error(`Failed to fetch database file: ${manifest.dbFilename}`);
		const dbBuffer = await dbRes.arrayBuffer();

		const SQL = await getSqlJs();
		const db = new SQL.Database(new Uint8Array(dbBuffer));

		return new EventDb(db, manifest);
	}

	static async get(): Promise<EventDb> {
		if (!this._instance) {
			this._instance = this.create();
			return this._instance;
		}

		const now = Date.now();
		if (now - this.lastCheck > this.CHECK_INTERVAL_MS) {
			this.lastCheck = now;
			try {
				const current = await this._instance;
				if (await current.checkIsUpdateAvailable()) {
					this._instance = this.create();
				}
			} catch (err) {
				console.error('EventDb refresh check failed: ', err);
				// keep using the old DB on failure
			}
		}
		return this._instance;
	}
}
