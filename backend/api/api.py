import logging

from .api_base import BaseNamespace
from .controller import CtController


def create_namespace(server_config):
    logger = logging.getLogger("server." + __name__)
    logger.info("Creating namespace")
    namespace = CtNamespace("/api")
    controller = CtController(**server_config)
    namespace.controller = controller
    logger.info("Namespace created")
    return namespace


class CtNamespace(BaseNamespace):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    def on_CT_GET_LIST(self, data, meta):
        self._safe_call(self.controller.get_list, data, meta, "CT_GET_LIST", "CT_GOT_LIST")

    def on_CT_GET_ITEM_DATA(self, data, meta):
        self._safe_call(self.controller.get_item_data, data, meta, "CT_GET_ITEM_DATA", "CT_GOT_ITEM_DATA")

    def on_CT_GET_INFERENCE(self, data, meta):
        self._safe_call(self.controller.get_inference, data, meta, "CT_GET_INFERENCE", "CT_GOT_INFERENCE")
