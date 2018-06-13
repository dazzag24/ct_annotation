import keyMirror from 'fbjs/lib/keyMirror'

const SocketIOEvents = {
  CONNECTING: 'connecting',
  CONNECT: 'connect',
  CONNECT_ERROR: 'connect_error',
  DISCONNECT: 'disconnect',
  RECONNECTING: 'reconnecting',
  RECONNECT: 'reconnect'
}

const ServerEvents = keyMirror({
  SERVER_READY: null
})

const CT_Requests = keyMirror({
  CT_GET_LIST: null,
  CT_GET_ITEM_DATA: null,
  CT_GET_INFERENCE: null,
  UPDATE_PATIENT_LIST: null,
  GET_AUTH_STATUS: null
})

const CT_Responses = keyMirror({
  CT_GOT_LIST: null,
  CT_GOT_ITEM_DATA: null,
  CT_GOT_INFERENCE: null,
  GOT_AUTH_STATUS: null
})

const CT_API = { CT_Responses, CT_Requests }

const API_Requests = Object.assign({}, CT_Requests)
const API_Responses = Object.assign({}, CT_Responses)

const API_Events = Object.assign({}, API_Requests, API_Responses)

const Events = Object.assign({}, SocketIOEvents, ServerEvents, API_Events)

export { Events, SocketIOEvents, ServerEvents, API_Events, API_Responses, API_Requests, CT_Responses }
