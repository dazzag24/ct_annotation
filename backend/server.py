import os
import json
import logging
import logging.config
import argparse

from flask import Flask
from flask_socketio import SocketIO

from api.api import create_namespace


def get_server_config(server_config_path, required_keys):
    with open(server_config_path, encoding="utf-8") as server_config:
        server_config = json.load(server_config)
    key_diff = set(server_config) - required_keys
    if key_diff:
        raise KeyError("{} keys are not found in the server config".format(sorted(key_diff)))
    server_config = {key: server_config[key] for key in required_keys}
    return server_config


def get_logger_config(logger_config_path):
    with open(logger_config_path, encoding="utf-8") as logger_config:
        logger_config = json.load(logger_config)
    return logger_config


def get_configs():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    default_config_path = os.path.join(current_dir, "config", "server_config.json")
    parser = argparse.ArgumentParser(description="A backend for an CT demo.")
    parser.add_argument("-c", "--config", help="A path to a json file with server configuration.",
                        default=default_config_path)
    args = parser.parse_args()

    REQUIRED_KEYS = {
        "ct_path",
        "model_path",
        "logger_config_path",
        "only_selected"}

    server_config = get_server_config(args.config, REQUIRED_KEYS)
    logger_config_path = server_config.pop("logger_config_path")
    logger_config = get_logger_config(logger_config_path)
    return server_config, logger_config


def create_logger(logger_config):
    logging.config.dictConfig(logger_config)
    logger = logging.getLogger("server")
    logger.info("Logger created")
    return logger


def main():
    server_config, logger_config = get_configs()
    logger = create_logger(logger_config)
    namespace = create_namespace(server_config)

    app = Flask(__name__)
    socketio = SocketIO(app)
    socketio.on_namespace(namespace)

    logger.info("Server launched")
    socketio.run(app, host="0.0.0.0", port=9090)


if __name__ == "__main__":
    main()
