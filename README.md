# CT Annotation tool

Annotation tool for cancer nodules on lung CT images. Is based on React JS (frontend) and Bacthflow + RadIO (Python backend)

## Install

Annotator has submodules so use `--recursive` flag to clone repository.

```
git clone https://github.com/analysiscenter/ct_annotation --recursive
```

## Run backend

Define path to your blocs dataset with images in `ct_annotation/backend/config/server_config.json`. Then start server:
```
cd ct_annotation
python3 backend/server.py
```

## Run frontend

```
yarn install
yarn start
```
