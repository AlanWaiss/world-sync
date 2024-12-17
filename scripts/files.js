"use strict";

import * as Logger from './logger.js';

const VALID_FILE_NAME = /^(?!\.)(?!com[0-9]$)(?!con$)(?!lpt[0-9]$)(?!nul$)(?!prn$)[^\|\*\?\\:<>/$"]*[^\.\|\*\?\\:<>/$"]+$/;

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

export async function saveJson(data, path, fileName) {
	try {
		const file = new File([JSON.stringify(data, null, "\t")], fileName, {type: "application/json"});

		await FilePicker.upload("data", path, file, {}, { notify: true });

		return `${path}${fileName}`;
	}
	catch(x) {
		ui.notifications.error(`Failed to save file ${path}${fileName}: ${x.message}.`);
		Logger.logError(`Error saving file ${path}${fileName}: `, x);
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