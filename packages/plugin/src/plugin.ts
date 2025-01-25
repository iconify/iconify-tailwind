import plugin from 'tailwindcss/plugin';
import { getDynamicCSSRules } from './plugins/dynamic.js';
import type { DynamicIconifyPluginOptions } from './helpers/options.js';

const exportedPlugin = plugin.withOptions((params: unknown) => {
	return ({ matchComponents }) => {
		// Clean up options
		const options: DynamicIconifyPluginOptions = {};
		Object.entries(params ?? {}).forEach(([key, value]) => {
			switch (key) {
				case 'prefix':
					if (typeof value === 'string') {
						options.prefix = value;
					}
					break;

				case 'overrideOnly':
				case 'override-only':
				case 'overrideonly':
					if (value === true) {
						options.overrideOnly = true;
					}
					break;

				case 'scale':
					if (typeof value === 'number') {
						options.scale = value;
					}
					break;
			}
		});

		const prefix = options.prefix || 'icon';
		return ({ matchComponents }) => {
			matchComponents({
				[prefix]: (icon: string) => {
					try {
						return getDynamicCSSRules(icon);
					} catch (err) {
						// Log error, but do not throw it
						console.warn((err as Error).message);
						return {};
					}
				},
			});
		};
	};
});

export default exportedPlugin;
