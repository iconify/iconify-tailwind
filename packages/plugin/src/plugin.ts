import plugin from 'tailwindcss/plugin';
import { getDynamicCSSRules } from './plugins/dynamic.js';
import type {
	DynamicIconifyPluginOptions,
	PreparsedIconifyPluginOptions,
} from './helpers/options.js';
import {
	getCSSComponentsForPlugin,
	getCSSRulesForPlugin,
} from './plugins/preparsed.js';
import {
	importDirectorySync,
	cleanupSVG,
	parseColors,
	runSVGO,
	isEmptyColor,
} from '@iconify/tools';
import { IconifyJSON } from '@iconify/types';

function getBooleanValue(value: unknown, defaultValue: boolean): boolean {
	switch (value) {
		case true:
		case '1':
		case 'true':
			return true;

		case false:
		case '0':
		case 'false':
			return false;
	}
	return defaultValue ?? false;
}

function getFloatValue(value: unknown, defaultValue: number): number {
	if (typeof value === 'number') {
		return value;
	}
	if (typeof value === 'string') {
		// Parse string
		const num = parseFloat(value);
		return isNaN(num) ? defaultValue : num;
	}
	return defaultValue;
}

const exportedPlugin: any = plugin.withOptions((params: unknown) => {
	// Clean up options
	const dynamicOptions: DynamicIconifyPluginOptions = {};
	const preparsedOptions: PreparsedIconifyPluginOptions = {};
	// console.log('Params:', JSON.stringify(params, null, 2));
	Object.entries(params ?? {}).forEach(([key, value]) => {
		switch (key) {
			// Options for dynamic plugin
			case 'prefix':
				if (value === false) {
					// Empty prefix: disables plugin
					dynamicOptions.prefix = '';
				}
				if (typeof value === 'string') {
					dynamicOptions.prefix = value;
				}
				return;

			case 'overrideOnly':
			case 'override-only':
			case 'overrideonly':
				dynamicOptions.overrideOnly = getBooleanValue(
					value,
					dynamicOptions.overrideOnly ?? false
				);
				return;

			// Options for preparsed plugin
			case 'prefixes': {
				// prefixes: foo;
				if (typeof value === 'string') {
					preparsedOptions.prefixes = [value];
					return;
				}
				// prefixes: foo, bar;
				if (Array.isArray(value)) {
					preparsedOptions.prefixes = value;
					return;
				}
				return;
			}

			case 'iconSelector':
			case 'icon-selector':
			case 'iconselector':
				if (typeof value === 'string') {
					preparsedOptions.iconSelector = value;
				}
				return;

			case 'maskSelector':
			case 'mask-selector':
			case 'maskselector':
				if (typeof value === 'string') {
					preparsedOptions.maskSelector = value;
				}
				return;

			case 'backgroundSelector':
			case 'background-selector':
			case 'backgroundselector':
				if (typeof value === 'string') {
					preparsedOptions.backgroundSelector = value;
				}
				return;

			case 'icon-sets':
			case 'iconSets':
			case 'iconsets':
				const iconSetsList = parseCssObject(
					'icon-sets',
					['from-json', 'from-folder'],
					value
				).map(({ key, value, type }) => {
					if (type === 'from-folder') {
						return [key, iconSetFromFolder(value)];
					} else {
						return [key, value];
					}
				});
				const iconSets = Object.fromEntries(iconSetsList);
				preparsedOptions.iconSets = iconSets;
				dynamicOptions.iconSets = iconSets;
				return;

			case 'varName':
			case 'var-name':
			case 'varname':
				if (typeof value === 'string') {
					preparsedOptions.varName = value;
				}
				return;

			case 'square':
				preparsedOptions.square = getBooleanValue(
					value,
					preparsedOptions.square ?? true
				);
				return;

			// Common options
			case 'scale': {
				const scale = getFloatValue(value, dynamicOptions.scale ?? 1);
				dynamicOptions.scale = scale;
				preparsedOptions.scale = scale;
				return;
			}
		}
	});

	return ({ matchComponents, addComponents, addUtilities }) => {
		// Dynamic plugin
		const prefix = dynamicOptions.prefix ?? 'icon';
		if (prefix) {
			matchComponents({
				[prefix]: (icon: string) => {
					try {
						return getDynamicCSSRules(icon, dynamicOptions);
					} catch (err) {
						// Log error, but do not throw it
						console.warn((err as Error).message);
						return {};
					}
				},
			});
		}

		// Preparsed options
		if (preparsedOptions.prefixes) {
			addComponents(getCSSComponentsForPlugin(preparsedOptions));
			addUtilities(getCSSRulesForPlugin(preparsedOptions));
		}
	};
});

/** Parses `f1(k1, v1), f2(k2, v2)` into
 * `[{type: "f1", key: "k1", value: "v1"}, {type: "f2", key: "k2", value: "v2"}]` */
const parseCssObject = (
	name: string,
	validFunctions: string[],
	values: string | string[]
) => {
	if (typeof values === 'string') {
		return parseCssObject(name, validFunctions, [values]);
	}
	const allowedValues = validFunctions
		.map((f) => `${f}(key1, value1)`)
		.join(', ');
	const err = `Invalid ${name} property: ${values}\nallowed values: ${allowedValues};`;

	if (values.constructor !== Array) throw new Error(err);

	return values.map((value: string) => {
		// https://regexr.com/8hkrp
		const matched = value.match(
			new RegExp(`^(${validFunctions.join('|')})\\((.*)\\s*,\\s*(.*)\\)$`)
		);
		if (!matched) throw new Error(err);

		const f = matched[1];
		const k = parseCssString(matched[2]);
		const v = parseCssString(matched[3]);
		return { key: k, value: v, type: f };
	});
};

/** extracts "foo" from: foo, "foo" or 'foo' */
const parseCssString = (value: string) => {
	const matched = value.match(/^['"]?([^'"]+)['"]?$/);
	return matched ? matched[1] : value;
};

// copied from https://iconify.design/docs/libraries/tools/import/directory.html
const iconSetFromFolder = (dir): IconifyJSON => {
	const iconSet = importDirectorySync(dir);

	// Validate, clean up, fix palette and optimise
	iconSet.forEachSync((name, type) => {
		if (type !== 'icon') {
			return;
		}

		const svg = iconSet.toSVG(name);
		if (!svg) {
			// Invalid icon
			iconSet.remove(name);
			return;
		}

		// Clean up and optimise icons
		try {
			// Clean up icon code
			cleanupSVG(svg);

			// Assume icon is monotone: replace color with currentColor, add if missing
			// If icon is not monotone, remove this code
			parseColors(svg, {
				defaultColor: 'currentColor',
				callback: (attr, colorStr, color) => {
					return !color || isEmptyColor(color)
						? colorStr
						: 'currentColor';
				},
			});

			// Optimise
			runSVGO(svg);
		} catch (err) {
			// Invalid icon
			console.error(`Error parsing ${name}:`, err);
			iconSet.remove(name);
			return;
		}

		// Update icon
		iconSet.fromSVG(name, svg);
	});
	return iconSet.export();
};

export default exportedPlugin;
