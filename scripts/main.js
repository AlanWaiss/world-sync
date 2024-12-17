import * as Constants from './constants.js';
import * as Logger from './logger.js';
import { startExport } from './journal-sync.js';
import { loadSettings, registerSettings } from './settings.js';

Hooks.once('init', async function() {
	Logger.log(`Initializing ${Constants.MODULE_NAME}`);

	// Register custom module settings
	await registerSettings();

	await loadSettings();

	globalThis.StartWorldSync = async function() {
		await startExport();
	};
});