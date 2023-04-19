import { setFailed, setOutput } from '@actions/core'
import { cp, mkdirP } from '@actions/io/'
import { exists } from '@actions/io/lib/io-util'
import fsPath from 'path'
import { getVars } from './lib/getVars'
import { isErrorLike } from './lib/isErrorLike'
import log from './lib/log'

async function main(): Promise<void> {
  try {
    const { cacheDir, paths } = getVars()

	const cacheHits: string[] = []
	const cacheMisses: string[] = []

	await Promise.all(paths.map(async ({ path, cache, target }) => {
		if (await exists(cache)) {
			await mkdirP(fsPath.dirname(target))
			// Copy files from cache, leave them in cache dir in case
			// the action doesn't finish properly (and post.ts doesn't run)
			await cp(cache, target, { recursive: true, force: true })

			cacheHits.push(path)
		} else {
			cacheMisses.push(path)
		}
	}))

	if (cacheHits.length) {
		log.info(`Cache found and restored to ${cacheHits.join(', ')}`)
	}

	if (cacheMisses.length) {
		log.info(`Skipping: cache not found for ${cacheMisses.join(', ')}.`)
	}

	setOutput('cache-hit', cacheHits.length > 0 && cacheMisses.length === 0)
  } catch (error: unknown) {
    console.trace(error)
    setFailed(isErrorLike(error) ? error.message : `unknown error: ${error}`)
  }
}

void main()
