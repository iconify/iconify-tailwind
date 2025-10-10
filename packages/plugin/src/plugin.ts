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

const exportedPlugin = plugin.withOptions((params: unknown) => {
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
				const iconSets = parseCssObject('icon-set', value);
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

/** Parses `$name(k1, v1), $name(k2, v2)` into `{k1: "v1", k2: "v2"}` */
const parseCssObject = (name, values) => {
	if (typeof values === 'string') {
		return parseCssObject(name, [values]);
	}
	const err = `Invalid ${name} property: ${values}\nexpected: ${name}(key1, value1), ${name}(key2, value2);`;
	if (values.constructor !== Array) throw new Error(err);

	return Object.fromEntries(
		values.map((value: string) => {
			// https://regexr.com/8h5pb
			const matched = value.match(
				new RegExp(`^${name}\\((.*)\\s*,\\s*(.*)\\)$`)
			);
			if (!matched) throw new Error(err);

			const k = parseCssString(matched[1]);
			const v = parseCssString(matched[2]);
			return [k, v];
		})
	);
};

/** extracts "foo" from: foo, "foo" or 'foo' */
const parseCssString = (value: string) => {
	const matched = value.match(/^['"]?([^'"]+)['"]?$/);
	return matched ? matched[1] : value;
};

export default exportedPlugin;
