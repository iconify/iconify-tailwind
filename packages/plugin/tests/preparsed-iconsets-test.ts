import { getCSSRulesForPlugin } from '../lib/plugins/preparsed.js';

const customIconSet = {
	prefix: 'custom-icon-prefix',
	icons: {
		home: {
			body: '<path d="M0 0h24v24H0z" fill="currentColor"/>',
			width: 24,
			height: 24,
		},
	},
};

describe('Preparsed icon sets', () => {
	it('Loads icon set from iconSets map for string prefixes', () => {
		const rules = getCSSRulesForPlugin({
			prefixes: ['custom-icon-prefix'],
			iconSets: {
				'custom-icon-prefix': customIconSet,
			},
		});

		expect(rules['.custom-icon-prefix--home']).toBeDefined();
	});

	it('Loads custom and standard icon sets together', () => {
		const rules = getCSSRulesForPlugin({
			prefixes: ['custom-icon-prefix', 'mdi-light'],
			iconSets: {
				'custom-icon-prefix': customIconSet,
			},
		});

		expect(rules['.custom-icon-prefix--home']).toBeDefined();
		expect(rules['.mdi-light--home']).toBeDefined();
	});
});
