const fs = require('fs-extra')
const shell = require('shelljs')
const path = require('path')

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
shell.exec('nodec ./lib/index.js')
