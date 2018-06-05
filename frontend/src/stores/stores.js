import Server from './server'
import CT_Store from './ct_store'
import Store_3D from './store_3d'

const server = new Server()
server.init()
const ct_store = new CT_Store(server)
const store_3d = new Store_3D()

export { server, ct_store, store_3d }
