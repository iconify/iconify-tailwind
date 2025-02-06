import type { IconifyJSON } from '@iconify/types';

// Source for icon set: icon set, filename, or synchronous callback that loads icon set
export type IconifyIconSetSource = IconifyJSON | string | (() => IconifyJSON);

/**
 * Common options
 */
export interface CommonIconifyPluginOptions {
	// Custom icon sets
	// Value can be loaded icon set or callback that loads icon set
	iconSets?: Record<string, IconifyIconSetSource>;
}

/**
 * Options for dynamic class names
 */
export interface DynamicIconifyPluginOptions
	extends CommonIconifyPluginOptions {
	// Class prefix
	prefix?: string;

	// Include icon-specific selectors only
	overrideOnly?: boolean;

	// Sets the default height/width value (ex. scale: 2 = 2em)
	scale?: number;
}

/**
 * Types for main Iconify plugin
 */

// Icons to include: array of names or callback
export type IconsListOption = string[] | ((name: string) => boolean);

// Source filename or icon set
type IconSetSource = string | IconifyJSON;

// Full icon set options
interface IconSetOptions {
	// Prefix, required if `source` is not set
	// If both `source` and `prefix` are set, `prefix` will be used
	prefix?: string;

	// Source
	source?: IconSetSource;

	// Icons to load
	icons?: IconsListOption;

	// Customise callback. If set, it will be used instead of global customise callback
	customise?: (content: string, name: string) => string;
}

// Array of icon sets to load
type IconifyPluginListOptions = (string | IconSetOptions)[];

/**
 * Options for main Iconify plugin
 */
export interface PreparsedIconifyPluginOptions
	extends CommonIconifyPluginOptions {
	// Icon selector, should contain "{prefix}" and "{name}" variables
	// Defaults to ".{prefix}--{name}"
	iconSelector?: string;

	// Selector for mask, defaults to ".iconify"
	// If empty string, mask selector will not be generated
	maskSelector?: string;

	// Selector for background, defaults to ".iconify-color"
	// If empty string, background selector will not be generated
	backgroundSelector?: string;

	// Variable name that contains icon, defaults to "svg"
	varName?: string;

	// Scale for icons, defaults to 1
	scale?: number;

	// Make icons square, defaults to true
	square?: boolean;

	// Prefixes to load
	prefixes?: IconifyPluginListOptions;
}
