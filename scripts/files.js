"use strict";

import * as Logger from './logger.js';
import { removeListItems } from './utils.js';

const REMOVE_FILE = "_remove.json";

const REMOVE_FILE_PROCESSED = "_remove_processed.json";

const VALID_FILE_NAME = /^(?!\.)(?!com[0-9]$)(?!con$)(?!lpt[0-9]$)(?!nul$)(?!prn$)[^\|\*\?\\:<>/$"]*[^\.\|\*\?\\:<>/$"]+$/;

class DeletedFiles {
	constructor(exportPath) {
		this.exportPath = exportPath;
	}
	files = null;
	async removeFile(filePath) {
		if(!this.files) {
			this.files = (await loadJson(this.exportPath, REMOVE_FILE)) || [];
			if(this.files.length > 0) {
				const removedFiles = await loadJson(this.exportPath, REMOVE_FILE_PROCESSED);
				if(removedFiles && removedFiles.length > 0) {
					removeListItems(this.files, removedFiles);
				}
			}
		}
		this.files.push(filePath);
		await saveJson(this.files, this.exportPath, REMOVE_FILE);
	}
	static #instance = null;
	static getInstance(exportPath) {
		if(!DeletedFiles.#instance || DeletedFiles.#instance.exportPath !== exportPath)
			DeletedFiles.#instance = new DeletedFiles(exportPath);
		
		return DeletedFiles.#instance;
	}
}

function combinePath(...paths) {
	let path = paths[0] || '';
	for(let i = 1; i < paths.length; i++) {
		if(!paths[i])
			continue;
		
		const nextPath = paths[i];
		if(!path.endsWith('/'))
			path += '/';
		path += nextPath.startsWith('/') ? nextPath.substring(1) : nextPath;
	}
	return path;
}

export async function ensurePath(path) {
	const parts = path.split("/");
	let currentPath = "";
	for(const part of parts) {
		if(!part)
			continue;
		currentPath += part + "/";
		try {
			await FilePicker.createDirectory("data", currentPath);
		}
		catch(x) {
			if(!x.toString().includes("EEXIST")) {
				Logger.logError(`Error creating directory ${currentPath}: `, x);
				return false;
			}
		}
	}
	return true;
}

/** Since IDs are case-sensitive, alphanumerics, prefix all upper-case letters with _ so that the file name will be unique on a case-insensitive file system */
export function idToFileName(id, extension = ".json") {
	return id.replace(/[A-Z]/g, (upper) => `_${upper}`) + extension;
}

export const isValidFileName = (filename) => VALID_FILE_NAME.test(filename);

/** Load json from the specified file. fileName is optional to keep it consistent with saveJson, but allow having the entire path together. */
export async function loadJson(path, fileName) {
	if(fileName)
		path = combinePath(path, fileName);
	const response = await fetch(path);
	if(!response.ok) {
		if(404 === response.status)
			return null;

		throw new Error(`Failed to load file ${path}: ${response.statusText}`);
	}
	return await response.json();
}

export async function removeFile(exportPath, path, fileName) {
	//There is no way to remove or rename a file, so we're just going to save a file indicating that it should be removed
	const deletedFiles = DeletedFiles.getInstance(exportPath);
	await deletedFiles.removeFile(combinePath(path, fileName));
}

export async function saveJson(data, path, fileName) {
	const filePath = combinePath(path, fileName);
	try {
		const file = new File([JSON.stringify(data, null, "\t")], fileName, {type: "application/json"});

		await FilePicker.upload("data", path, file, {}, { notify: false });

		return combinePath(path, fileName);
	}
	catch(x) {
		ui.notifications.error(`WorldSync failed to save file ${filePath}: ${x.message}.`);
		Logger.logError(`Error saving file ${filePath}: `, x);
	}

	return '';
}

export function validPath(path) {
	let validPath = path.replace(/\\/g, "/");
	if(!validPath.endsWith("/")) {
		validPath += "/";
	}
	return validPath;
}