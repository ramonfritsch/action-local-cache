import path from 'path';

import * as core from '@actions/core';

const { GITHUB_REPOSITORY, RUNNER_TOOL_CACHE } = process.env;
const CWD = process.cwd();

type Vars = {
	cacheDir: string;
	paths: Array<{
		path: string;
		cache: string;
		target: string;
	}>;
};

function getInputAsArray(name: string): string[] {
	return (
		core
			.getInput(name)
			.split('\n')
			// .map(s => s.replace(/^!\s+/, "!").trim())
			.filter((x) => x !== '')
	);
}

export const getVars = (): Vars => {
	if (!RUNNER_TOOL_CACHE) {
		throw new TypeError('Expected RUNNER_TOOL_CACHE environment variable to be defined.');
	}

	if (!GITHUB_REPOSITORY) {
		throw new TypeError('Expected GITHUB_REPOSITORY environment variable to be defined.');
	}

	if (!core.getInput('path')) {
		throw new TypeError('path is required but was not provided.');
	}

	const options = {
		key: core.getInput('key') || 'no-key',
		paths: getInputAsArray('path'),
	};

	const cacheDir = path.join(RUNNER_TOOL_CACHE, GITHUB_REPOSITORY, options.key);

	return {
		cacheDir,
		paths: options.paths.map((p) => ({
			path: p,
			cache: path.join(cacheDir, p),
			target: path.resolve(CWD, p),
		})),
	};
};
