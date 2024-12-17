"use strict";
import * as Constants from "./constants.js"
import { validPath } from "./files.js";
import * as Logger from './logger.js';

/**
 * The module title
 */
export const title = Constants.MODULE_TITLE + " settings";

/**
 * Some generic path references that might be useful later in the application's windows
 */
export const path = {
	root: `modules/${Constants.MODULE_NAME}/`
};

/**
 * For each setting, there is are two corresponding entries in the language file to retrieve the translations for
 * - the setting name
 * - the hint displayed beneath the setting's name in the "Configure Game Settings" dialog.
 *
 * Given your Constants.MODULE_NAME is 'my-module' and your setting's name is 'EnableCritsOnly', then you will need to create to language entries:
 * {
 *  "my-module.EnableCritsOnly.Name": "Enable critical hits only",
 *  "my-module.EnableCritsOnly.Hint": "Players will only hit if they crit, and otherwise miss automatically *manic laughter*"
 * }
 *
 * The naming scheme is:
 * {
 *  "[Constants.MODULE_NAME].[SETTING_NAME].Name": "[TEXT]",
 *  "[Constants.MODULE_NAME].[SETTING_NAME].Hint": "[TEXT]"
 * }
 */
const settings = [
	{
		name: "ExportPath",
		scope: "world",
		default: "world-sync/",
		type: String,
		onChange: settingChanged
	},
	/*{
		name: "JournalEditorLink",
		scope: "world",
		default: "",
		type: String,
		onChange: settingChanged
	},*/
	{
		name: "EnableTracing",
		scope: "world",
		default: false,
		type: Boolean,
		onChange: loadSettings
	},
	/*{
		name: "SkipJournalFolders",
		scope: "world",
		default: "",
		type: String,
		onChange: settingChanged
	},
	{
		name: "SkipJournalEntries",
		scope: "world",
		default: "",
		type: String,
		onChange: settingChanged
	},
	{
		name: "ImportWorldPath",
		scope: "world",
		default: "",
		type: String,
		onChange: settingChanged
	},*/
	{
		name: "ExportWorldPath",
		scope: "world",
		default: "[WORLD_ID]",
		type: String,
		onChange: settingChanged
	},
];

export function loadSettings() {
	Logger.logTrace("Loading settings");

	Logger.enableTracing(game.settings.get(Constants.MODULE_NAME, "EnableTracing"));

	const exportPath = validPath(game.settings.get(Constants.MODULE_NAME, "ExportPath"));
	return {
		exportPath: exportPath,
		worldPath: validPath(exportPath + game.settings.get(Constants.MODULE_NAME, "ExportWorldPath")),
	};
}

export async function registerSettings() {
	settings.forEach(setting => {
		let options = {
			name: game.i18n.localize(`${Constants.MODULE_NAME}.${setting.name}.Name`),
			hint: game.i18n.localize(`${Constants.MODULE_NAME}.${setting.name}.Hint`),
			scope: setting.scope,
			config: true,
			default: setting.default,
			type: setting.type,
			onChange: setting.onChange
		};
		switch(setting.default) {
			case "[WORLD_ID]":
				options.default = game.world.id;
				break;
		}
		if(setting.choices)
			options.choices = setting.choices;
		game.settings.register(Constants.MODULE_NAME, setting.name, options);
	});
}

function settingChanged() {
	Logger.logTrace("Settings changed");
}