import { setFailed, setOutput } from '@actions/core'
import { cp, mkdirP } from '@actions/io/'
import { exists } from '@actions/io/lib/io-util'

import path from 'path'
import { getVars } from './lib/getVars'
import { isErrorLike } from './lib/isErrorLike'
import log from './lib/log'

async function main(): Promise<void> {
  try {
    const { cacheDir, targetPath, options } = getVars()

    if (await exists(cacheDir)) {
		await Promise.all(paths.map(async ({ cache, target }) => {
			await mkdirP(path.dirname(target))
			// Copy files from cache, leave them in cache dir in case
			// the action doesn't finish properly (and post.ts doesn't run)
			await cp(cache, target, { force: true })
		}))
	
      log.info(`Cache found and restored to ${options.paths.join(', ')}`)
      setOutput('cache-hit', true)
    } else {
      log.info(`Skipping: cache not found for ${options.paths.join(', ')}.`)
      setOutput('cache-hit', false)
    }
  } catch (error: unknown) {
    console.trace(error)
    setFailed(isErrorLike(error) ? error.message : `unknown error: ${error}`)
  }
}

void main()
