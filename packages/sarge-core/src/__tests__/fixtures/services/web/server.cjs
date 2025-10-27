const http = require('http')
const port = process.env.PORT ? Number(process.env.PORT) : 4010
const server = http.createServer((req, res) => {
  if (req.url === '/health') { res.statusCode = 200; res.end('ok'); return }
  res.statusCode = 200; res.end('web')
})
server.listen(port, '127.0.0.1', () => console.log('web up', port))
