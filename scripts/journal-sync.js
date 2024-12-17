"use strict";

import * as Constants from "./constants.js";
import { ensurePath, idToFileName, saveJson, validPath } from "./files.js";
import * as Logger from './logger.js';
import { loadSettings } from "./settings.js";

export function buildIndex() {
	const journalEntries = {},
		rootFolder = {
			depth: 0,
			folders: [],
			entries: []
		},
		folders = {
			'': rootFolder
		};

	for(const folder of game.journal.folders) {
		folders[folder.id] = {
			id: folder.id,
			name: folder.name,
			depth: folder.depth,
			sort: folder.sort,
			sorting: folder.sorting,
			folders: folder.children.map(child => child.folder.id),
			entries: []
		};

		if(folder.depth == 1)
			rootFolder.folders.push(folder.id);
	}

	for(const entry of game.journal) {
		const stats = entry._stats || {},
			folderId = (entry.folder && entry.folder.id) || '',
			folder = folders[folderId];

		journalEntries[entry.id] = {
			id: entry.id,
			name: entry.name,
			flags: entry.flags,
			ownership: entry.ownership,
			folder: folderId,
			sort: entry.sort,
			stats: {
				createdTime: stats.createdTime,
				lastModifiedBy: stats.lastModifiedBy,
				modifiedTime: stats.modifiedTime
			}
		};

		if(folder)
			folder.entries.push(entry.id);
	}

	return {
		entries: journalEntries,
		folders: folders
	};
}

export async function saveEntry(entry, path) {
	const fileName = idToFileName(entry.id);

	return await saveJson(entry, path, fileName);
}

export async function startExport() {
	//game.user.isGM
	ui.notifications.info(`Starting ${Constants.MODULE_TITLE} export`);

	const { worldPath } = loadSettings();
	const journalPath = validPath(worldPath + "journal");
	Logger.log(`Starting export to ${journalPath}`);

	if(!await ensurePath(journalPath)) {
		Logger.log("Failed to create export path. Aborting.");
		return;
	}

	for(const entry of game.journal) {
		Logger.log(`Exporting entry ${entry.id} (${entry.name})`);
		await saveEntry(entry, journalPath);
	}

	Logger.log("Building index");
	const journalIndex = buildIndex();
	await saveJson(journalIndex, journalPath, "_index.json");

	ui.notifications.info(`${Constants.MODULE_TITLE} export complete`);
}