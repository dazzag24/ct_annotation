import Server from './server'
import CT_Store from './ct_store'

const server = new Server()
server.init()
const ct_store = new CT_Store(server)

export { server, ct_store }
