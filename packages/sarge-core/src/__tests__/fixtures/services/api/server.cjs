const http = require('http')
const port = process.env.PORT ? Number(process.env.PORT) : 4011
const server = http.createServer((req, res) => {
  if (req.url === '/health') { res.statusCode = 200; res.end('ok'); return }
  res.statusCode = 200; res.end('api')
})
server.listen(port, '127.0.0.1', () => console.log('api up', port))
