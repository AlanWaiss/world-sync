import * as Constants from './constants.js';
import * as Logger from './logger.js';
import { startExport as userExport } from './user-sync.js';
import { saveEntry, startExport as journalExport } from './journal-sync.js';
import { loadSettings, registerSettings } from './settings.js';

async function journalUpdated(entry) {
	const settings = loadSettings();
	await saveEntry(entry, settings);
}

Hooks.once('init', async function() {
	Logger.log(`Initializing ${Constants.MODULE_NAME}`);

	// Register custom module settings
	await registerSettings();

	loadSettings();

	globalThis.WorldSync = {
		exportJournal: async function() {
			const settings = loadSettings();
			await journalExport(settings);
		},
		exportUsers: async function() {
			const settings = loadSettings();
			await userExport(settings);
		},
		start: async function() {
			ui.notifications.info(`Starting ${Constants.MODULE_TITLE} export`);

			const settings = loadSettings();
			await userExport(settings);
			await journalExport(settings);

			ui.notifications.info(`${Constants.MODULE_TITLE} export complete`);
		}
	};
});

Hooks.on('createJournalEntry', async function(journalEntry, options, userId) {
	Logger.logTrace("Hook.createJournalEntry", journalEntry, options, userId);
});

Hooks.on('openJournalEntry', async function(journalEntry, options, userId) {
	Logger.logTrace("Hook.openJournalEntry", journalEntry, options, userId);
});

Hooks.on('updateJournalEntry', async function(journalEntry, data, options, userId) {
	Logger.logTrace("Hook.updateJournalEntry", journalEntry, data, options, userId);
});

Hooks.on('createJournalEntryPage', async function(journalEntryPage, options, userId) {
	Logger.logTrace("Hook.createJournalEntryPage", journalEntryPage, options, userId);
	if(journalEntryPage.parent && journalEntryPage.parent.pages)
		await journalUpdated(journalEntryPage.parent);
});

Hooks.on('deleteJournalEntryPage', async function(journalEntryPage, data, options, userId) {
	Logger.logTrace("Hook.deleteJournalEntryPage", journalEntryPage, data, options, userId);
	if(journalEntryPage.parent && journalEntryPage.parent.pages)
		await journalUpdated(journalEntryPage.parent);
});

Hooks.on('updateJournalEntryPage', async function(journalEntryPage, data, options, userId) {
	Logger.logTrace("Hook.updateJournalEntryPage", journalEntryPage, data, options, userId);
	if(journalEntryPage.parent && journalEntryPage.parent.pages)
		await journalUpdated(journalEntryPage.parent);
});