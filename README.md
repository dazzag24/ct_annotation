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

## Structure of repo

``
├── backend
│   ├── api                           
│   │   ├── api_base.py                 Base server API (independent from CT specific)
│   │   ├── api.py                      How to connect requests and methods
│   │   ├── controller.py               Methods to process requests
│   │   ├── __init__.py
│   │   └── radio                       Submodule
│   ├── config
│   │   ├── logger_config.json          Logger config
│   │   └── server_config.json          Path to logger config and blosc dataset
│   ├── requirements.txt                Dependencies
│   └── server.py                       Core file, run Flask server
├── frontend
│   ├── css                             Styles
│   │   ├── main.css
│   │   └── react-toggle.css
│   ├── package.json                    Dependencies
│   ├── src
│   │   ├── components                  React components
│   │   │   ├── 2dView.jsx
│   │   │   ├── 3dView.jsx
│   │   │   ├── App.jsx
│   │   │   ├── CTItemPage.jsx
│   │   │   ├── CTPage.jsx
│   │   │   ├── CTSliceViewer.jsx
│   │   │   ├── DragDrop.jsx
│   │   │   ├── EditInline.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── MenuPage.jsx
│   │   │   └── ViewerLayers.jsx
│   │   ├── index.html                 Initial "dummy" page
│   │   ├── index.js                   Run App
│   │   └── stores                     Stores for data from backend
│   │       ├── const.js
│   │       ├── ct_store.js
│   │       ├── server.js
│   │       ├── store_2d.js
│   │       ├── store_3d.js
│   │       └── stores.js
│   ├── three                          Methods for 3D mode
│   │   ├── dat.gui.min.js
│   │   ├── OrbitControls.js
│   │   ├── Projector.js
│   │   └── three.js
│   ├── webpack.config.js
│   └── yarn.lock
└── README.md
```
