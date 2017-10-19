import child from 'child_process'
import path from 'path'
import fs from 'fs-extra'
import os from 'os'
/**
 * node-packer actually support spawn child processes, but doesn't support node-notifier's *.app vendor for macos, so we copy the whole folder manually by monkey patch.
 */

function redirectPaths(
  dirs: string[],
  distDir: string = path.resolve(os.tmpdir())
) {
  dirs = dirs.map(p => path.resolve(p))
  return function (file) {
    // ignore global command, in this case is aria2c
    if (!file.includes('/') && !file.includes('\\')) {
      return file
    }
    file = path.resolve(file)
    const dirNeedCopy = dirs.find(p => file.startsWith(p))
    if (dirNeedCopy) {
      const dirName = path.basename(dirNeedCopy)
      const newDir = path.join(distDir, dirName)
      if (!fs.existsSync(newDir)) {
        fs.copySync(dirNeedCopy, newDir)
      }
      console.log('patch', dirNeedCopy, newDir, file.replace(dirNeedCopy, newDir))
      return file.replace(dirNeedCopy, newDir)
    }
    return file
  }
}

const patchFile = redirectPaths([path.join(__dirname, '../node_modules/node-notifier/vendor')])

;['spawn', 'spawnSync', 'execFile', 'execFileSync'].forEach(method => {
  const _oldMethod = child[method]
  child[method] = function (file, ...args) {
    console.log('before', method, file)
    const newFile = patchFile(file)
    console.log('after', method, newFile)
    return _oldMethod.call(this, newFile, ...args)
  }
})
