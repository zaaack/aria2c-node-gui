import child from 'child_process'
import os from 'os'
import fs from 'fs'
import path from 'path'
import fetch, {} from 'node-fetch'
import notifier from 'node-notifier'

function watchDownloadStatus(port: number) {
  let taskLen = 0
  setInterval(() => {
    fetch(`http://127.0.0.1:${port}/jsonrpc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'json',
      },
      body: `{
        "jsonrpc":"2.0",
        "method":"aria2.tellStopped",
        "id":"aria2c-gui-rs",
        "params":[
            -1,
            1000,
            [
                "gid",
                "files"
            ]
        ]
      }`
    })
    .then(res => res.json())
    .then(data => {
      console.log('rpcResJson:', data, taskLen)
      let len = data.result.length
      if (len > taskLen) {
        data.result
          .slice(0, len - taskLen)
          .map(task => {
            if (task.files.length > 0) {
              const file = task.files[0]
              const filename = path.basename(file.path)
              notifier.notify({
                title: `下载完成: ${filename}`,
                message: file.path,
              })
            }
          })
      }
      taskLen = len
    })
    .catch(console.error)
  }, 7000)
}

export default function startAria2c(port: number, downloadDir = `${os.homedir()}/Downloads` ) {
  const process = child.spawn('aria2c', [
    '--enable-rpc',
    `--rpc-listen-port=${port}`,
    '--rpc-allow-origin-all'
  ], {
    cwd: downloadDir
  })
  watchDownloadStatus(port)
  return process
}
