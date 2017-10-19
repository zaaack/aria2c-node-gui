const fs = require('fs-extra')
const shell = require('shelljs')
const path = require('path')

shell.exec('npm run build')
const pack = path.join(__dirname, '../pack')

shell.rm('-R', path.join(pack, 'lib'), path.join(pack, 'static/dist'))

fs.ensureDirSync(path.join(pack, 'lib'))
fs.ensureDirSync(path.join(pack, 'static/dist'))

shell.cd(path.join(__dirname, '..'))
shell.cp('-R', './lib/*.js', path.join(pack, 'lib'))
shell.cp('-R', './static/dist', path.join(pack, 'static'))

const pkg = require('../package.json')
pkg.devDependencies = {}
fs.outputFileSync(path.join(pack, 'package.json'), JSON.stringify(pkg, null, 2))

shell.cd(pack)
shell.exec('yarn')

// clean traybin
function cleanTrayBins() {
  const baseDir = './node_modules/systray/traybin/'

  shell.cp('-fR', '../node_modules/systray/traybin/', path.dirname(baseDir))

  const releaseBins =
    fs.readdirSync(baseDir)
      .filter(file => !file.includes('release'))
      .map(file => path.join(baseDir, file))
  const macBin = path.join(baseDir, 'tray_darwin_release')
  const linuxBin = path.join(baseDir, 'tray_linux_release')
  const winBin = path.join(baseDir, 'tray_windows_release.exe')
  const unusedBins = [
    ...releaseBins,
  ]
  switch(process.platform) {
    case 'win32':
      unusedBins.push(macBin, linuxBin)
      break
    case 'linux':
      unusedBins.push(winBin, macBin)
      break
    case 'darwin':
      unusedBins.push(winBin, linuxBin)
      break
  }
  console.log('pwd', shell.pwd())
  console.log('rm', unusedBins)
  shell.rm(...unusedBins)
}

cleanTrayBins()

shell.exec(`nodec ./lib/index.js -o ../dist/aria2c-gui-${process.platform}`)
