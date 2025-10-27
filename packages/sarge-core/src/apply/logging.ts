export function formatLog(service: string, stream: string, data: Buffer | string) {
  const msg = typeof data === 'string' ? data : data.toString('utf8')
  return JSON.stringify({ ts: Date.now(), service, stream, msg }) + '\n'
}
