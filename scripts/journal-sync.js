"use strict";

import { ensurePath, idToFileName, loadJson, removeFile, saveJson, validPath } from "./files.js";
import * as Logger from './logger.js';
import { removeListItem } from './utils.js';

const INDEX_FILE = "_index.json";

let _index;

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
		indexJournalEntry(folders, journalEntries, entry);
	}

	return _index = {
		entries: journalEntries,
		folders: folders
	};
}

export async function deleteEntry(entry, settings) {
	const journalPath = await getJournalPath(settings),
		{ exportPath } = settings,
		fileName = idToFileName(entry.id),
		folderId = (entry.folder && entry.folder.id) || '',
		journalIndex = await getIndex(journalPath),
		folder = journalIndex.folders[folderId];

	await removeFile(exportPath, journalPath, fileName);

	if(folder)
		removeListItem(folder.entries, entry.id);
	delete journalIndex.entries[entry.id];
	await saveJson(journalIndex, journalPath, INDEX_FILE);
}

async function getIndex(journalPath) {
	if(!_index)
		_index = (await loadIdex(journalPath)) || buildIndex();

	return _index;
}

async function getJournalPath(settings) {
	const { worldPath } = settings,
		journalPath = validPath(worldPath + "journal");

	if(!await ensurePath(journalPath)) {
		return null;
	}

	return journalPath;
}

function indexJournalEntry(folders, journalEntries, entry) {
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

	if(folder && !folder.entries.includes(entry.id))
		folder.entries.push(entry.id);
}

async function loadIdex(journalPath) {
	try {
		return _index = await loadJson(journalPath, INDEX_FILE);
	} catch(err) {
		Logger.error(`Failed to load journal index: ${err}`);
	}
}

async function _saveEntry(entry, path) {
	const fileName = idToFileName(entry.id);

	return await saveJson(entry, path, fileName);
}

export async function saveEntry(entry, settings) {
	const journalPath = await getJournalPath(settings),
		entryPath = await _saveEntry(entry, journalPath),
		journalIndex = await getIndex(journalPath);

	indexJournalEntry(journalIndex.folders, journalIndex.entries, entry);
	await saveJson(journalIndex, journalPath, INDEX_FILE);

	return entryPath;
}

export async function startExport(settings) {
	//game.user.isGM

	const start = new Date();
	const journalPath = await getJournalPath(settings);

	if(!journalPath) {
		Logger.log("Failed to create export path. Aborting.");
		return;
	}

	Logger.log(`Starting journal export to ${journalPath}`);

	for(const entry of game.journal) {
		Logger.log(`Exporting entry ${entry.id} (${entry.name})`);
		await _saveEntry(entry, journalPath);
	}

	Logger.log("Building index");
	const journalIndex = buildIndex();
	await saveJson(journalIndex, journalPath, INDEX_FILE);

	Logger.log(`Export complete in ${new Date() - start}ms`);
}