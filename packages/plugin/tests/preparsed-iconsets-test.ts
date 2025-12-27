import { getCSSRulesForPlugin } from '../lib/plugins/preparsed.js';

describe('Preparsed icon sets', () => {
	it('Loads icon set from iconSets map for string prefixes', () => {
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

		const rules = getCSSRulesForPlugin({
			prefixes: ['custom-icon-prefix'],
			iconSets: {
				'custom-icon-prefix': customIconSet,
			},
		});

		expect(rules['.custom-icon-prefix--home']).toBeDefined();
	});
});
