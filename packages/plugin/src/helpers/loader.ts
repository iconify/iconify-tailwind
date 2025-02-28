import { readFileSync, lstatSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { IconifyJSON } from '@iconify/types';
import type { IconifyIconSetSource } from './options.js';
import { matchIconName } from '@iconify/utils/lib/icon/name';

/**
 * Try to resolve file
 */
function resolveFile(filename: string): string | undefined {
	try {
		return fileURLToPath(import.meta.resolve(filename));
	} catch (err) {
		//
	}

	try {
		return require.resolve(filename);
	} catch (err) {
		//
	}
}

/**
 * Locate icon set
 */
interface LocatedIconSet {
	main: string;
	info?: string;
}
export function locateIconSet(prefix: string): LocatedIconSet | undefined {
	// CommonJS way to load files
	// Try `@iconify-json/{$prefix}`
	try {
		const main = require.resolve(`@iconify-json/${prefix}/icons.json`);
		const info = require.resolve(`@iconify-json/${prefix}/info.json`);
		return {
			main,
			info,
		};
	} catch {
		//
	}

	// Try `@iconify/json`
	try {
		const main = require.resolve(`@iconify/json/json/${prefix}.json`);
		return {
			main,
		};
	} catch {
		//
	}

	// Try files
	const main = resolveFile(`@iconify-json/${prefix}/icons.json`);
	if (main) {
		const info = resolveFile(`@iconify-json/${prefix}/info.json`);
		if (info) {
			return {
				main,
				info,
			};
		}
	}

	const full = resolveFile(`@iconify/json/json/${prefix}.json`);
	if (full) {
		return {
			main: full,
		};
	}
}

/**
 * Cache for loaded icon sets
 *
 * Tailwind CSS can send multiple separate requests to plugin, this will
 * prevent same data from being loaded multiple times.
 *
 * Key is filename, not prefix!
 */
const cache = Object.create(null) as Record<string, IconifyJSON>;

/**
 * Load icon set from file
 */
function loadIconSetFromFile(source: LocatedIconSet): IconifyJSON | undefined {
	try {
		const result = JSON.parse(
			readFileSync(source.main, 'utf8')
		) as IconifyJSON;
		if (!result.info && source.info) {
			// Load info from a separate file
			result.info = JSON.parse(
				readFileSync(source.info, 'utf8')
			) as IconifyJSON['info'];
		}
		return result;
	} catch {
		//
	}
}

/**
 * Load icon set from source
 */
export function loadIconSet(
	source: IconifyIconSetSource
): IconifyJSON | undefined {
	if (typeof source === 'function') {
		// Callback
		return source();
	}

	if (typeof source === 'object') {
		// IconifyJSON
		return source;
	}

	// String

	// Try to parse JSON
	if (source.startsWith('{')) {
		try {
			return JSON.parse(source) as IconifyJSON;
		} catch {
			// Invalid JSON
		}
	}

	// Check for cache
	if (cache[source]) {
		return cache[source];
	}

	// Icon set prefix
	if (source.match(matchIconName)) {
		const filename = locateIconSet(source);
		if (filename) {
			// Load icon set
			const result = loadIconSetFromFile(filename);
			if (result) {
				cache[source] = result;
			}
			return result;
		}
	}

	// Filename
	const result = loadIconSetFromFile({
		main: source,
	});
	if (result) {
		cache[source] = result;
	}
	return result;
}
