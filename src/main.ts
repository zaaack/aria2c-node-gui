import child, { ChildProcess } from 'child_process'
import path from 'path'
import os from 'os'
import fs from 'fs-extra'
import Koa from 'koa'
import KoaRouter from 'koa-router'
import koaStatic from 'koa-static'
import opn from 'opn'
import koaNunjucks from 'koa-nunjucks-2'
import getPort from 'get-port'
import startAria2c from './aria2c'
import SysTray from 'systray'

let pOpn = file =>
  new Promise((resolve, reject) =>
    opn(file, err =>
      err
        ? resolve()
        : reject(err)))
const router = new KoaRouter()

interface IRouterContext extends KoaRouter.IRouterContext {
  render: (tpl: string, state?: {}) => Promise<any>
}

router.get('/', async (ctx: IRouterContext, next) => {
  ctx.render('index', {
    static_path: path.resolve(__dirname, '../static/dist')
  })
})

router.get('/api/open', async (ctx, next) => {
  try {
    pOpn(ctx.query.file)
    ctx.body = {status: 'ok'}
  } catch (err) {
    ctx.body = {status: 'failed', error: err.message}
  }
  return next()
})

router.get('*', koaStatic(path.resolve(__dirname, '../static/dist'), {
  index: true,
  maxage: 30 * 3600 * 1000,
}))

const app = new Koa()
app.use(koaNunjucks({
  ext: 'html',
  path: path.join(__dirname, '../static/dist'),
  nunjucksConfig: {
    trimBlocks: true
  }
}))
app.use(router.routes())
app.use(router.allowedMethods())

async function main() {
  const rpcPort = await getPort({port: 6800})
  const webUIPort = await getPort({port: 23156})

  async function openUrl() {
    await pOpn(`http://127.0.0.1:${webUIPort}/#!/settings/rpc/set/http/127.0.0.1/${rpcPort}/jsonrpc`)
  }

  const icon = fs.readFileSync(path.join(__dirname, `../static/dist/icon.${process.platform === 'win32' ? 'ico' : 'png'}`))
  const tray = new SysTray({
    menu: {
      icon: icon.toString('base64'),
      title: '',
      tooltip: 'Aria2c-Node-GUI',
      items: [{
        title: '打开',
        tooltip: '打开',
        checked: false,
        enabled: true,
      }, {
        title: '退出',
        tooltip: '退出',
        checked: false,
        enabled: true,
      }]
    }
  })

  tray.onClick(action => {
    switch (action.seq_id) {
      case 0:
        openUrl()
        break
      case 1:
        tray.kill()
    }
  })
  // Fix aria2c cannot exit
  tray.onExit((code, signal) => {
    setTimeout(() =>
    process.exit(0), 1000)
  })

  startAria2c(rpcPort)
  app.listen(webUIPort, '127.0.0.1')
  openUrl()
}

main().catch(console.error)
