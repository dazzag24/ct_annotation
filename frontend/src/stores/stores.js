import Server from './server'
import CT_Store from './ct_store'
import Store_3D from './store_3d'
import Store_2D from './store_2d'
import LoginStore from './login_store.js'

const server = new Server()
server.init()
const ct_store = new CT_Store(server)
const store_3d = new Store_3D()
const store_2d = new Store_2D()
const lstore = new LoginStore(server)

export { server, ct_store, store_3d, store_2d, lstore }
