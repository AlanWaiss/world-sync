"use strict";

import { ensurePath, saveJson } from "./files.js";
import * as Logger from './logger.js';

export function buildIndex() {
	const userIndex = {};

	for(const user of game.users) {
		userIndex[user.id] = {
			id: user.id,
			name: user.name,
			role: user.role
		}
		console.log(user);
	}

	return userIndex;
}

export async function startExport(settings) {
	const start = new Date();
	const { worldPath } = settings;
	Logger.log(`Starting user export to ${worldPath}`);
	
	if(!await ensurePath(worldPath)) {
		Logger.log("Failed to create export path. Aborting.");
		return;
	}

	const userIndex = buildIndex();
	await saveJson(userIndex, worldPath, "_users.json");
	
	Logger.log(`Export complete in ${new Date() - start}ms`);
}