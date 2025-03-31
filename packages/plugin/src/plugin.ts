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

			case 'forceBrackets':
			case 'force-brackets':
			case 'forcebrackets': {
				dynamicOptions.forceBrackets = getBooleanValue(value, dynamicOptions.forceBrackets ?? true);
				return;
			}

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
			let values = undefined;
			if(dynamicOptions.forceBrackets === false){
				const target = {};

				const handler = {
					get(target, prop, receiver) {
						if(!prop.includes('--'))
							return undefined;
						if(prop.startsWith('-'))
							prop = prop.substring(1);
						if(prop.startsWith('['))
							prop = prop.substring(1);
						if(prop.endsWith(']'))
							prop = prop.substring(0, prop.length - 1);
						return prop;
					}
				};
				values = new Proxy(target, handler);
			}

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
			},{
				values
			});
		}

		// Preparsed options
		if (preparsedOptions.prefixes) {
			addComponents(getCSSComponentsForPlugin(preparsedOptions));
			addUtilities(getCSSRulesForPlugin(preparsedOptions));
		}
	};
});

export default exportedPlugin;
