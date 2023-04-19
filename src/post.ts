import { setFailed } from '@actions/core'
import { mkdirP, mv, rmRF } from '@actions/io'

import { getVars } from './lib/getVars'
import { isErrorLike } from './lib/isErrorLike'
import log from './lib/log'

async function post(): Promise<void> {
  try {
    const { cacheDir, paths } = getVars()

    await mkdirP(cacheDir)

	// Move files back to cache directory
	await Promise.all(paths.map(async ({ cache, target }) => {
		await rmRF(cache)
		await mv(target, cache, { force: true })	
	}))
  } catch (error: unknown) {
    log.trace(error)
    setFailed(isErrorLike(error) ? error.message : `unknown error: ${error}`)
  }
}

void post()
