import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { Plugin } from 'vite'

const filePath = resolve(process.cwd(), 'src/design-overrides.json')
const fonts = new Set(['eden', 'noto-sans', 'noto-serif', 'gowun-dodum', 'gowun-batang', 'nanum-gothic', 'gaegu'])
const selectorPattern = /^body(?: > [a-z][a-z0-9-]*:nth-of-type\([1-9][0-9]*\))+$/

type Entry = { path: string; selector: string; text: string; font: string; size: number; weight: number }

function isEntry(value: unknown): value is Entry {
  if (!value || typeof value !== 'object') return false
  const entry = value as Record<string, unknown>
  return typeof entry.path === 'string' && /^\/[a-zA-Z0-9/_-]*$/.test(entry.path) && entry.path.length <= 120
    && typeof entry.selector === 'string' && entry.selector.length <= 600 && selectorPattern.test(entry.selector)
    && typeof entry.text === 'string' && entry.text.length <= 100
    && typeof entry.font === 'string' && fonts.has(entry.font)
    && typeof entry.size === 'number' && Number.isInteger(entry.size) && entry.size >= 8 && entry.size <= 120
    && typeof entry.weight === 'number' && Number.isInteger(entry.weight) && entry.weight >= 100 && entry.weight <= 900 && entry.weight % 100 === 0
}

async function readEntries(): Promise<Entry[]> {
  const entries: unknown = JSON.parse(await readFile(filePath, 'utf8'))
  return Array.isArray(entries) ? entries.filter(isEntry) : []
}

function respond(res: import('node:http').ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(body))
}

export function localDesignModePlugin(): Plugin {
  return {
    name: 'local-design-mode',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__design/overrides', async (req, res) => {
        const host = req.headers.host ?? ''
        const remote = req.socket.remoteAddress ?? ''
        const origin = req.headers.origin
        const localHost = /^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(host)
        const localRemote = remote === '::1' || remote === '127.0.0.1' || remote === '::ffff:127.0.0.1'
        if (!localHost || !localRemote || (origin && new URL(origin).host !== host)) {
          respond(res, 403, { error: 'Local access only' })
          return
        }

        try {
          if (req.method === 'GET') {
            respond(res, 200, await readEntries())
            return
          }
          if (req.method !== 'POST') {
            respond(res, 405, { error: 'Method not allowed' })
            return
          }

          let body = ''
          for await (const chunk of req) {
            body += chunk.toString()
            if (body.length > 4096) {
              respond(res, 413, { error: 'Request too large' })
              return
            }
          }
          const input: unknown = JSON.parse(body)
          if (!input || typeof input !== 'object') {
            respond(res, 400, { error: 'Invalid request' })
            return
          }
          const payload = input as { action?: unknown; entry?: unknown; path?: unknown; selector?: unknown }
          const entries = await readEntries()
          let next: Entry[]
          if (payload.action === 'save' && isEntry(payload.entry)) {
            const entry = payload.entry
            next = entries.filter((item) => item.path !== entry.path || item.selector !== entry.selector)
            next.push(entry)
          } else if (payload.action === 'delete' && typeof payload.path === 'string' && typeof payload.selector === 'string'
            && /^\/[a-zA-Z0-9/_-]*$/.test(payload.path) && selectorPattern.test(payload.selector)) {
            next = entries.filter((item) => item.path !== payload.path || item.selector !== payload.selector)
          } else {
            respond(res, 400, { error: 'Invalid design selection' })
            return
          }
          if (next.length > 300) {
            respond(res, 413, { error: 'Too many changes' })
            return
          }
          await writeFile(filePath, `${JSON.stringify(next, null, 2)}\n`, 'utf8')
          respond(res, 200, next)
        } catch (error) {
          server.ssrFixStacktrace(error as Error)
          respond(res, 500, { error: 'Could not save design changes' })
        }
      })
    },
  }
}
