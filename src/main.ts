import { setFailed, setOutput } from '@actions/core';
import { cp, mkdirP } from '@actions/io';
import { exists, isDirectory } from '@actions/io/lib/io-util';
import fsPath from 'path';
import util from 'util';
import { getVars } from './lib/getVars';
import { isErrorLike } from './lib/isErrorLike';
import log from './lib/log';

const exec = util.promisify(require('child_process').exec);

(async () => {
	try {
		const { cacheDir, paths } = getVars();

		const cacheHits: string[] = [];
		const cacheMisses: string[] = [];

		await Promise.all(
			paths.map(async ({ path, cache, target }) => {
				if (await exists(cache)) {
					await mkdirP(fsPath.dirname(target));

					// Copy files from cache, leave them in cache dir in case
					// the action doesn't finish properly (and post.ts doesn't run)
					if (process.platform === 'linux' || process.platform === 'darwin') {
						const isDir = await isDirectory(cache);
						const cacheWithTrailingSlash =
							isDir && !cache.endsWith('/') ? cache + '/' : cache;

						// This is faster, only for linux/mac
						await exec(
							`cp ${isDir ? '-a' : ''} ${cacheWithTrailingSlash}${
								isDir ? '.' : ''
							} ${target}`,
						);
					} else {
						await cp(cache, target, { recursive: true, force: true });
					}

					cacheHits.push(path);
				} else {
					cacheMisses.push(path);
				}
			}),
		);

		if (cacheHits.length) {
			log.info(`Cache found and restored to ${cacheHits.join(', ')}`);
		}

		if (cacheMisses.length) {
			log.info(`Skipping: cache not found for ${cacheMisses.join(', ')}.`);
		}

		setOutput('cache-hit', cacheHits.length > 0 && cacheMisses.length === 0);
	} catch (error: unknown) {
		console.trace(error);
		setFailed(isErrorLike(error) ? error.message : `unknown error: ${error}`);
	}
})();
