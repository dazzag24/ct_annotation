import React from 'react'
import { inject, observer } from 'mobx-react'
import { Component } from 'react'

function bounds (size, slice, depth) {
  if (size <= depth) {
    return [0, size]
  }
  if (slice < depth) {
    return [0, depth]
  }
  return [slice - depth, slice]
}

function makeCanvas (image, shape, normalTo, slice, p, mipDepth = 1) {
  const canvas = document.createElement('canvas')
  switch (normalTo) {
    case 'X':
      var width = shape[1]
      var height = shape[0]
      break
    case 'Y':
      width = shape[2]
      height = shape[0]
      break
    case 'Z':
      width = shape[2]
      height = shape[1]
      break
    default:
      throw 'Unknown value of normalTo'
  }
  canvas.width = width
  canvas.height = height
  var ctx = canvas.getContext('2d')
  var imgData = ctx.createImageData(width, height)
  var data = imgData.data
  switch (normalTo) {
    case 'X':
      var [low, high] = bounds(shape[2], slice, mipDepth)
      for (var i = 0; i < shape[0]; i++) {
        for (var j = 0; j < shape[1]; j++) {
          var vals = []
          for (var k = low; k < high; k++) {
            vals.push(image[shape[1] * shape[2] * i + k * shape[1] + j] % 256)
          }
          var val = Math.max(...vals)
          data[shape[1] * 4 * i + 4 * j] = val
          data[shape[1] * 4 * i + 4 * j + 1] = val
          data[shape[1] * 4 * i + 4 * j + 2] = val
          data[shape[1] * 4 * i + 4 * j + 3] = adjustAlpha(val, p)
        }
      }
      break
    case 'Y':
      [low, high] = bounds(shape[1], slice, mipDepth)
      for (var i = 0; i < shape[0]; i++) {
        for (var j = 0; j < shape[2]; j++) {
          var vals = []
          for (var k = low; k < high; k++) {
            vals.push(image[shape[1] * shape[2] * i + k + shape[2] * j] % 256)
          }
          var val = Math.max(...vals)
          data[shape[2] * 4 * i + 4 * j] = val
          data[shape[2] * 4 * i + 4 * j + 1] = val
          data[shape[2] * 4 * i + 4 * j + 2] = val
          data[shape[2] * 4 * i + 4 * j + 3] = adjustAlpha(val, p)
        }
      }
      break
    case 'Z':
      [low, high] = bounds(shape[0], slice, mipDepth)
      for (var i = 0; i < shape[1] * shape[2]; i++) {
        var vals = []
        for (var k = low; k < high; k++) {
          vals.push(image[shape[1] * shape[2] * k + i] % 256)
        }
        var val = Math.max(...vals)
        data[4 * i] = val
        data[4 * i + 1] = val
        data[4 * i + 2] = val
        data[4 * i + 3] = adjustAlpha(val, p)
      }
      break
    default:
      throw 'Unknown value of normalTo'
  }
  ctx.putImageData(imgData, 0, 0)
  return canvas
}

function makeCrop (image, sliceX, sliceY, sliceZ,
  shape, spacing, radius, threshold) {
  const factor = Math.max(...multArrays(shape, spacing))
  const ofX = shape[2] * spacing[2] / (factor * 2)
  const ofY = shape[1] * spacing[1] / (factor * 2)
  const ofZ = shape[0] * spacing[0] / (factor * 2)
  const dX = shape[2] - 1
  const dY = shape[1] - 1
  const dZ = shape[0] - 1

  const radiusI = Math.floor(radius / spacing[2])
  const radiusJ = Math.floor(radius / spacing[1])
  const radiusK = Math.floor(radius / spacing[0])

  var geometry = new THREE.Geometry()
  for (var i = sliceX - radiusI; i <= sliceX + radiusI; i++) {
    for (var j = sliceY - radiusJ; j <= sliceY + radiusJ; j++) {
      for (var k = sliceZ - radiusK; k <= sliceZ + radiusK; k++) {
        var val = image[shape[2] * shape[1] * k + i * shape[1] + j] % 256
        var v = new THREE.Vector3(
          -ofY * (1 - 2 * j / dY),
          ofX * (1 - 2 * i / dX),
          ofZ * (1 - 2 * k / dZ))
        if (val > threshold) {
          geometry.colors.push(new THREE.Color(val / 255, val / 255, val / 255))
          geometry.vertices.push(v)
        }
      }
    }
  }
  return geometry
}

function adjustAlpha (alpha, p) {
  return 255 * p + alpha * (1 - p)
}

function multArrays (a, b) {
  if (a.length !== b.length) {
    throw 'Arrays have different length'
  }
  var res = []
  for (var i = 0; i < a.length; i++) {
    res.push(a[i] * b[i])
  }
  return res
}

function convertCoord (p, ofs, ds) {
  let [ofX, ofY, ofZ] = ofs
  let [dX, dY, dZ] = ds
  return [-ofY * (1 - 2 * p[0] / dY),
    ofX * (1 - 2 * p[1] / dX),
    ofZ * (1 - 2 * p[2] / dZ)]
}

function invertCoord (p, ofs, ds) {
  let [ofX, ofY, ofZ] = ofs
  let [dX, dY, dZ] = ds
  return [Math.round(dY * (1 + p.x / ofY) / 2),
    Math.round(dX * (1 - p.y / ofX) / 2),
    Math.round(dZ * (1 - p.z / ofZ) / 2)]
}

function handleEditNodule (nodule) {
  if (nodule.name.includes('onEdit')) {
    nodule.name = nodule.name.slice(6)
    if (nodule.name.includes('Green')) {
      nodule.material.color.setHex(0x009900)
    }
    if (nodule.name.includes('Red')) {
      nodule.material.color.setHex(0x990000)
    }
  } else {
    nodule.name = 'onEdit' + nodule.name
    nodule.material.color.setHex(0x000099)
  }
}

const noduleDefaultRadius = 5
const noduleDefaultOpacity = 0.45

@inject("ct_store")
@inject("store_2d")
@inject("store_3d")
@observer
export default class VolumeView extends Component {
  constructor (props) {
    super(props)
    let store = this.props.store_3d.get(this.props.id)
    this.state = store.state
    this.showY = store.showY
    this.showZ = store.showZ
    this.showX = store.showX
    this.showNodules = store.showNodules
    this.enableZoom = store.enableZoom
    this.layout3 = store.layout3
    this.changeNodule = store.changeNodule
    this.setRadius = store.setRadius
    this.setOpacity = store.setOpacity

    this.start = this.start.bind(this)
    this.stop = this.stop.bind(this)
    this.animate = this.animate.bind(this)
  }

  update2DSlices() {
    let shape = this.props.ct_store.get(this.props.id).shape
    let sliceZ = this.state.sliceZ
    let sliceX = this.state.sliceX
    let sliceY = this.state.sliceY
    this.props.store_2d.setSlices(this.props.id, [shape[0] - sliceZ, sliceX, sliceY])
  }

  componentWillUpdate (nextProps, nextState) {
    const shape = this.props.ct_store.get(this.props.id).shape
    const spacing = this.props.ct_store.get(this.props.id).spacing

    const factor = Math.max(...multArrays(this.props.ct_store.get(this.props.id).shape, this.props.ct_store.get(this.props.id).spacing))
    const ofX = shape[2] * spacing[2] / (factor * 2)
    const ofY = shape[1] * spacing[1] / (factor * 2)
    const ofZ = shape[0] * spacing[0] / (factor * 2)
    const dX = shape[2] - 1
    const dY = shape[1] - 1
    const dZ = shape[0] - 1
    const unitSize = 2 * ofX / (shape[2] * spacing[2])

    if (nextState.viewMode2D) {
      this.controls.enableRotate = false
      this.crop.visible = false
      this.cropFrame.visible = false
      this.planeZMaterial.transparent = false
      this.planeXMaterial.transparent = false
      this.planeYMaterial.transparent = false
      var real = convertCoord([nextState.sliceY, nextState.sliceX, nextState.sliceZ],
        [ofX, ofY, ofZ], [dX, dY, dZ])
      switch (nextState.plane) {
        case 1:
          const canvasZ = makeCanvas(this.props.ct_store.get(this.props.id).image,
            this.props.ct_store.get(this.props.id).shape, 'Z', nextState.sliceZ, 1, nextState.mipDepth)
          const textureZ = new THREE.Texture(canvasZ)
          textureZ.needsUpdate = true
          this.planeZMaterial.map = textureZ
          this.planeZMaterial.needsUpdate = true
          this.meshZ.position.set(0, 0, ofZ)
          for (var i = 0; i < this.noduleCenters.length; i++) {
            var p = this.noduleCenters[i]
            var cnt = convertCoord(p, [ofX, ofY, ofZ], [dX, dY, dZ])
            this.nodules[i].scale.x = this.nodules[i].scale.y = Math.max(0.0001,
              (p[3] / noduleDefaultRadius) * (p[3] * unitSize - Math.abs(cnt[2] - real[2])) / (p[3] * unitSize))
            this.nodules[i].scale.z = (p[3] / noduleDefaultRadius)
            cnt[2] = ofZ
            this.nodules[i].position.set(...cnt)
          }
          break
        case 2:
          const canvasX = makeCanvas(this.props.ct_store.get(this.props.id).image,
            this.props.ct_store.get(this.props.id).shape, 'X', nextState.sliceX, 1, nextState.mipDepth)
          const textureX = new THREE.Texture(canvasX)
          textureX.needsUpdate = true
          this.planeXMaterial.map = textureX
          this.planeXMaterial.needsUpdate = true
          this.meshX.position.set(0, ofX, 0)
          for (var i = 0; i < this.noduleCenters.length; i++) {
            var p = this.noduleCenters[i]
            var cnt = convertCoord(p, [ofX, ofY, ofZ], [dX, dY, dZ])
            this.nodules[i].scale.z = this.nodules[i].scale.x = Math.max(0.0001,
              (p[3] / noduleDefaultRadius) * (p[3] * unitSize - Math.abs(cnt[1] - real[1])) / (p[3] * unitSize))
            this.nodules[i].scale.y = (p[3] / noduleDefaultRadius)
            cnt[1] = ofX
            this.nodules[i].position.set(...cnt)
          }
          break
        case 3:
          const canvasY = makeCanvas(this.props.ct_store.get(this.props.id).image,
            this.props.ct_store.get(this.props.id).shape, 'Y', nextState.sliceY, 1, nextState.mipDepth)
          const textureY = new THREE.Texture(canvasY)
          textureY.needsUpdate = true
          this.planeYMaterial.map = textureY
          this.planeYMaterial.needsUpdate = true
          this.meshY.position.set(ofY, 0, 0)
          for (var i = 0; i < this.noduleCenters.length; i++) {
            var p = this.noduleCenters[i]
            var cnt = convertCoord(p, [ofX, ofY, ofZ], [dX, dY, dZ])
            this.nodules[i].scale.y = this.nodules[i].scale.z = Math.max(0.0001,
              (p[3] / noduleDefaultRadius) * (p[3] * unitSize - Math.abs(cnt[0] - real[0])) / (p[3] * unitSize))
            this.nodules[i].scale.x = (p[3] / noduleDefaultRadius)
            cnt[0] = ofY
            this.nodules[i].position.set(...cnt)
          }
          break
        default:
          throw 'Invalid plane id'
      }
      return
    } else {
      this.controls.enableRotate = true
      this.crop.visible = true
      this.cropFrame.visible = true
      for (var i = 0; i < this.noduleCenters.length; i++) {
        var p = this.noduleCenters[i]
        this.nodules[i].position.set(-ofY * (1 - 2 * p[0] / dY),
          ofX * (1 - 2 * p[1] / dX),
          ofZ * (1 - 2 * p[2] / dZ))
        this.nodules[i].scale.x = this.nodules[i].scale.y = this.nodules[i].scale.z = (p[3] / noduleDefaultRadius)
      }
      this.planeZMaterial.transparent = true
      this.planeXMaterial.transparent = true
      this.planeYMaterial.transparent = true
    }

    if (nextState.sliceZ !== this.state.sliceZ ||
      nextState.alphaP !== this.state.alphaP ||
      this.state.viewMode2D) {
      const canvasZ = makeCanvas(this.props.ct_store.get(this.props.id).image, this.props.ct_store.get(this.props.id).shape, 'Z', nextState.sliceZ, nextState.alphaP)
      const textureZ = new THREE.Texture(canvasZ)
      textureZ.needsUpdate = true
      this.planeZMaterial.map = textureZ
      this.planeZMaterial.needsUpdate = true
      this.meshZ.position.set(0, 0, ofZ * (1 - 2 * nextState.sliceZ / dZ))
    }

    if (nextState.sliceX !== this.state.sliceX ||
      nextState.alphaP !== this.state.alphaP ||
      this.state.viewMode2D) {
      const canvasX = makeCanvas(this.props.ct_store.get(this.props.id).image, this.props.ct_store.get(this.props.id).shape, 'X', nextState.sliceX, nextState.alphaP)
      const textureX = new THREE.Texture(canvasX)
      textureX.needsUpdate = true
      this.planeXMaterial.map = textureX
      this.planeXMaterial.needsUpdate = true
      this.meshX.position.set(0, ofX * (1 - 2 * nextState.sliceX / dX), 0)
    }

    if (nextState.sliceY !== this.state.sliceY ||
      nextState.alphaP !== this.state.alphaP ||
      this.state.viewMode2D) {
      const canvasY = makeCanvas(this.props.ct_store.get(this.props.id).image, this.props.ct_store.get(this.props.id).shape, 'Y', nextState.sliceY, nextState.alphaP)
      const textureY = new THREE.Texture(canvasY)
      textureY.needsUpdate = true
      this.planeYMaterial.map = textureY
      this.planeYMaterial.needsUpdate = true
      this.meshY.position.set(-ofY * (1 - 2 * nextState.sliceY / dY), 0, 0)
    }

    if (nextState.radius === 0) {
      this.cropFrame.visible = false
      this.crop.visible = false
    } else {
      if (nextState.radius !== this.state.radius ||
        nextState.threshold !== this.state.threshold ||
        nextState.sliceZ !== this.state.sliceZ ||
        nextState.sliceY !== this.state.sliceY ||
        nextState.sliceX !== this.state.sliceX) {
        this.cropFrame.visible = true
        this.crop.visible = true
        const cropGeometry = makeCrop(this.props.ct_store.get(this.props.id).image,
          nextState.sliceX, nextState.sliceY, nextState.sliceZ,
          this.props.ct_store.get(this.props.id).shape, this.props.ct_store.get(this.props.id).spacing, nextState.radius, nextState.threshold
        )
        this.crop.geometry = cropGeometry
        const cubeGeometry = new THREE.BoxGeometry(
          2 * nextState.radius / factor,
          2 * nextState.radius / factor,
          2 * nextState.radius / factor
        )
        const cubeEdges = new THREE.EdgesGeometry(cubeGeometry)
        this.cropFrame.geometry = cubeEdges
        this.cropFrame.position.set(
          -ofY * (1 - 2 * nextState.sliceY / dY),
          ofX * (1 - 2 * nextState.sliceX / dX),
          ofZ * (1 - 2 * nextState.sliceZ / dZ)
        )
      }
    }
    this.update2DSlices()
  }

  componentDidMount () {
    const width = window.innerWidth
    const height = window.innerHeight
    const shape = this.props.ct_store.get(this.props.id).shape
    const spacing = this.props.ct_store.get(this.props.id).spacing

    const factor = Math.max(...multArrays(shape, spacing))
    const ofX = shape[2] * spacing[2] / (factor * 2)
    const ofY = shape[1] * spacing[1] / (factor * 2)
    const ofZ = shape[0] * spacing[0] / (factor * 2)
    const dX = shape[2] - 1
    const dY = shape[1] - 1
    const dZ = shape[0] - 1
    const unitSize = 2 * ofX / (shape[2] * spacing[2])

    var nodules = []
    var noduleCenters = []
    var planes = []

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer({ antialias: true })

    const frameGeometry = new THREE.BoxGeometry(2 * ofX, 2 * ofY, 2 * ofZ)
    const frameEdges = new THREE.EdgesGeometry(frameGeometry)
    const frameLine = new THREE.LineSegments(frameEdges, new THREE.LineBasicMaterial({ color: 0xffffff }))
    scene.add(frameLine)

    const cropGeometry = makeCrop(this.props.ct_store.get(this.props.id).image,
      this.state.sliceX, this.state.sliceY, this.state.sliceZ,
      this.props.ct_store.get(this.props.id).shape, this.props.ct_store.get(this.props.id).spacing, this.state.radius, this.state.threshold)
    const cropMaterial = new THREE.PointsMaterial({
      size: 10,
      sizeAttenuation: false,
      vertexColors: THREE.VertexColors
    })
    const crop = new THREE.Points(cropGeometry, cropMaterial)
    scene.add(crop)

    const cubeGeometry = new THREE.BoxGeometry(
      2 * this.state.radius / factor,
      2 * this.state.radius / factor,
      2 * this.state.radius / factor)
    const cubeEdges = new THREE.EdgesGeometry(cubeGeometry)
    const cropFrame = new THREE.LineSegments(cubeEdges, new THREE.LineBasicMaterial({ color: 0xffffff }))
    cropFrame.position.set(
      -ofY * (1 - 2 * this.state.sliceY / dY),
      ofX * (1 - 2 * this.state.sliceX / dX),
      ofZ * (1 - 2 * this.state.sliceZ / dZ))
    scene.add(cropFrame)

    const canvasZ = makeCanvas(this.props.ct_store.get(this.props.id).image, shape, 'Z', this.state.sliceZ, this.state.alphaP)
    const textureZ = new THREE.Texture(canvasZ)
    textureZ.needsUpdate = true
    const planeZ = new THREE.PlaneGeometry(2 * ofX, 2 * ofY, 1, 1)
    const planeZMaterial = new THREE.MeshBasicMaterial({
      map: textureZ,
      side: THREE.DoubleSide,
      transparent: true
    })
    planeZMaterial.needsUpdate = true
    planeZMaterial.visible = this.showZ
    const meshZ = new THREE.Mesh(planeZ, planeZMaterial)
    meshZ.position.set(0, 0, ofZ * (1 - 2 * this.state.sliceZ / dZ))
    meshZ.name = 'sliceZ'
    scene.add(meshZ)
    planes.push(meshZ)

    const canvasX = makeCanvas(this.props.ct_store.get(this.props.id).image, shape, 'X', this.state.sliceX, this.state.alphaP)
    const textureX = new THREE.Texture(canvasX)
    textureX.needsUpdate = true
    const planeX = new THREE.PlaneGeometry(2 * ofY, 2 * ofZ, 1, 1)
    const planeXMaterial = new THREE.MeshBasicMaterial({
      map: textureX,
      side: THREE.DoubleSide,
      transparent: true
    })
    planeXMaterial.needsUpdate = true
    planeXMaterial.visible = this.showX
    const meshX = new THREE.Mesh(planeX, planeXMaterial)
    meshX.position.set(0, ofX * (1 - 2 * this.state.sliceX / dX), 0)
    meshX.rotation.set(Math.PI / 2, 0, 0)
    meshX.name = 'sliceX'
    scene.add(meshX)
    planes.push(meshX)

    const canvasY = makeCanvas(this.props.ct_store.get(this.props.id).image, shape, 'Y', this.state.sliceY, this.state.alphaP)
    const textureY = new THREE.Texture(canvasY)
    textureY.needsUpdate = true
    const planeY = new THREE.PlaneGeometry(2 * ofX, 2 * ofZ, 1, 1)
    const planeYMaterial = new THREE.MeshBasicMaterial({
      map: textureY,
      side: THREE.DoubleSide,
      transparent: true
    })
    planeYMaterial.needsUpdate = true
    planeYMaterial.visible = this.showY
    const meshY = new THREE.Mesh(planeY, planeYMaterial)
    meshY.position.set(-ofY * (1 - 2 * this.state.sliceY / dY), 0, 0)
    meshY.rotation.set(Math.PI / 2, -Math.PI / 2, 0)
    meshY.name = 'sliceY'
    scene.add(meshY)
    planes.push(meshY)

    for (var i = 0; i < this.state.nodules.length; i++) {
      var nd = this.state.nodules[i].slice()
      nd[0] = this.props.ct_store.get(this.props.id).shape[0] - nd[0]
      var sphereGeometry = new THREE.SphereGeometry(noduleDefaultRadius * unitSize, 128, 128)
      var sphereMaterial = new THREE.MeshBasicMaterial({
        color: 0x009900,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: noduleDefaultOpacity
      })
      var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
      sphere.position.set(
        -ofY * (1 - 2 * nd[2] / dY),
        ofX * (1 - 2 * nd[1] / dX),
        ofZ * (1 - 2 * nd[0] / dZ))
      sphere.scale.set(
        nd[3] / noduleDefaultRadius,
        nd[3] / noduleDefaultRadius,
        nd[3] / noduleDefaultRadius)
      sphere.name = 'nodeGreen' + i.toString()
      scene.add(sphere)
      nodules.push(sphere)
      noduleCenters.push([nd[2], nd[1], nd[0], nd[3]])
    }

    var gui = new dat.GUI({ autoPlace: false } )
    gui.domElement.id = 'gui';
    gui.width = 280
    var folderGeneral = gui.addFolder('Режима просмотра')
    var folderSlice = gui.addFolder('Положение среза')
    var folder3D = gui.addFolder('Настройки 3D')
    var folder2D = gui.addFolder('Настройки 2D')
    var folderEdit = gui.addFolder('Редактирование разметки')
    folder3D.open()
    folderGeneral.open()
    folderSlice.open()
    folderEdit.open()

    var viewMode = folderGeneral.add(this.state, 'viewMode2D').name('2D')
    viewMode.onChange(function (value) {
      that.setState({ viewMode2D: value })
      if (value) {
        folder3D.close()
        folder2D.open()
        if (that.state.plane === 1) {
          camera.position.set(0, 0, 2 - ofZ)
        }
        if (that.state.plane === 2) {
          camera.position.set(0, 2 - ofX, 0)
        }
        if (that.state.plane === 3) {
          camera.position.set(2 - ofY, 0, 0)
        }
        showZ.setValue(this.state.showZ)
        showX.setValue(this.state.showX)
        showY.setValue(this.state.showY)
      } else {
        folder3D.open()
        folder2D.close()
        zoom.setValue(true)
      }
    })
    var showNodules = folderGeneral.add(this, 'showNodules').name('Разметка')
    showNodules.onChange(function (value) {
      for (var i = 0; i < nodules.length; i++) {
        nodules[i].visible = value
      }
    })
    var sliderZ = folderSlice.add(this.state, 'sliceZ').min(0).max(dZ).step(1).name('Z')
    let that = this
    sliderZ.onChange(function (value) {
      that.setState({sliceZ: value})
    })
    var sliderX = folderSlice.add(this.state, 'sliceX').min(0).max(dX).step(1).name('X')
    sliderX.onChange(function (value) {
      that.setState({sliceX: value})
    })
    var sliderY = folderSlice.add(this.state, 'sliceY').min(0).max(dY).step(1).name('Y')
    sliderY.onChange(function (value) {
      that.setState({sliceY: value})
    })
    var threshold = folder3D.add(this.state, 'threshold').min(1).max(256).step(1).name('Порог видимости')
    threshold.onChange(function (value) {
      that.setState({threshold: value})
    })
    var radius = folder3D.add(this.state, 'radius').min(0).max(25).step(1).name('Радиус сегмента')
    radius.onChange(function (value) {
      that.setState({radius: value})
    })
    var alphaP = folder3D.add(this.state, 'alphaP').min(0).max(1).step(0.05).name('Непрозрачность')
    alphaP.onChange(function (value) {
      that.setState({alphaP: value})
    })
    var plane = folder2D.add(this.state, 'plane').min(1).max(3).step(1).name('Проекция')
    plane.onChange(function (value) {
      if (value === 1) {
        camera.position.set(0, 0, 2 - ofZ)
      }
      if (value === 2) {
        camera.position.set(0, 2 - ofX, 0)
      }
      if (value === 3) {
        camera.position.set(2 - ofY, 0, 0)
      }
      that.setState({plane: value})
    })
    var showZ = folder3D.add(this, 'showZ').name('Срез Z')
    showZ.onChange(function (value) {
      planeZMaterial.visible = value
    })
    var showX = folder3D.add(this, 'showX').name('Срез X')
    showX.onChange(function (value) {
      planeXMaterial.visible = value
    })
    var showY = folder3D.add(this, 'showY').name('Срез Y')
    showY.onChange(function (value) {
      planeYMaterial.visible = value
    })
    var mipDepth = folder2D.add(this.state, 'mipDepth').min(1).max(32).step(1).name('Глубина')
    mipDepth.onChange(function (value) {
      that.setState({mipDepth: value})
    })
    var zoom = folder2D.add(this, 'enableZoom').name('Масштабирование')
    zoom.onChange(function (value) {
      controls.enableZoom = value
    })
    var setRadius = folderEdit.add(this, 'setRadius').min(1).max(32).step(1).name('Радиус')
    setRadius.onChange(function (value) {
      if (that.changeNodule) {
        var scale = value / noduleDefaultRadius
        that.changeNodule.scale.x = scale
        that.changeNodule.scale.y = scale
        that.changeNodule.scale.z = scale
        var num = parseInt(that.changeNodule.name.replace(/[^0-9]/g, ''))
        noduleCenters[num][3] = value
      }
    })
    var setOpacity = folderEdit.add(this, 'setOpacity').min(0).max(1).step(0.05).name('Непрозрачность')
    setOpacity.onChange(function (value) {
      if (that.changeNodule) {
        that.changeNodule.material.opacity = value
      }
    })

    function onMouseSingleClick (event) {
      if (that.state.viewMode2D && event.button === 0) {
        return
      }
      event.preventDefault()
      var vector = new THREE.Vector3((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1, 0.5)
      vector.unproject(camera)
      var ray = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize())
      var intersects = ray.intersectObjects(nodules)
      if (intersects.length > 0) {
        // intersects[ 0 ].object.material.color.setHex( Math.random() * 0xffffff );
        if (event.button === 0) {
          var point = intersects[0].object.position
          sliderZ.setValue(Math.round((1 - point.z / ofZ) * dZ / 2))
          sliderX.setValue(Math.round(dY - (1 + point.y / ofY) * dY / 2))
          sliderY.setValue(Math.round(dX - (1 - point.x / ofX) * dX / 2))
        }
      }
      var intersects = ray.intersectObjects(planes)
      if (intersects.length > 0) {
        if (event.button === 2) {
          var sphereGeometry = new THREE.SphereGeometry(noduleDefaultRadius * unitSize, 128, 128)
          var sphereMaterial = new THREE.MeshBasicMaterial({
            color: 0x990000,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: noduleDefaultOpacity
          })
          var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
          for (var i = 0; i < intersects.length; i++) {
            if (intersects[i].object.material.visible) {
              sphere.position.set(...intersects[i].point)
              var sliceNums = invertCoord(intersects[i].point, [ofX, ofY, ofZ], [dX, dY, dZ])
              if (intersects[i].object.name === 'sliceZ') {
                sliceNums[2] = that.state.sliceZ
              }
              if (intersects[i].object.name === 'sliceX') {
                sliceNums[1] = that.state.sliceX
              }
              if (intersects[i].object.name === 'sliceY') {
                sliceNums[0] = that.state.sliceY
              }
              break
            }
          }
          sliceNums.push(noduleDefaultRadius)
          noduleCenters.push(sliceNums)
          sphere.name = 'nodeRed' + that.state.nCount.toString()
          scene.add(sphere)
          nodules.push(sphere)

          if (that.changeNodule === null) {
            handleEditNodule(sphere)
            that.changeNodule = sphere
            setRadius.setValue(noduleDefaultRadius)
            setOpacity.setValue(sphere.material.opacity)
          } else {
            handleEditNodule(that.changeNodule)
            handleEditNodule(sphere)
            that.changeNodule = sphere
            setRadius.setValue(noduleDefaultRadius)
            setOpacity.setValue(sphere.material.opacity)
          }
          that.setState({nCount: that.state.nCount + 1})
        }
        for (var i = 0; i < intersects.length; i++) {
        }
      }
    }

    function onMouseDoubleClick (event) {
      event.preventDefault()
      var vector = new THREE.Vector3((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1, 0.5)
      vector.unproject(camera)
      var ray = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize())
      var intersects = ray.intersectObjects(nodules)
      if (intersects.length > 0) {
        // intersects[ 0 ].object.material.color.setHex( 0x0000ff )
        if (that.changeNodule === null) {
          handleEditNodule(intersects[ 0 ].object)
          that.changeNodule = intersects[ 0 ].object
          setRadius.setValue(intersects[ 0 ].object.scale.x * noduleDefaultRadius)
          setOpacity.setValue(intersects[ 0 ].object.material.opacity)
        } else {
          if (that.changeNodule !== intersects[ 0 ].object) {
            handleEditNodule(that.changeNodule)
            handleEditNodule(intersects[ 0 ].object)
            that.changeNodule = intersects[ 0 ].object
            setRadius.setValue(intersects[ 0 ].object.scale.x * noduleDefaultRadius)
            setOpacity.setValue(intersects[ 0 ].object.material.opacity)
          } else {
            handleEditNodule(intersects[ 0 ].object)
            that.changeNodule = null
            setRadius.setValue(noduleDefaultRadius)
            setOpacity.setValue(noduleDefaultOpacity)
          }
        }
      } else {
        if (that.changeNodule) {
          handleEditNodule(that.changeNodule)
          that.changeNodule = null
          setRadius.setValue(noduleDefaultRadius)
          setOpacity.setValue(noduleDefaultOpacity)
        }
      }
    }

    renderer.setClearColor('#000000')
    renderer.setSize(width, height)
    document.addEventListener('mousedown', onMouseSingleClick, false)
    document.addEventListener('dblclick', onMouseDoubleClick, false)
    document.addEventListener('wheel', onWheel, false)

    window.addEventListener('resize', onWindowResize, false)
    function onWindowResize () {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    function onWheel (e) {
      var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)))
      if (that.state.plane === 1) {
        var value = sliderZ.getValue()
        sliderZ.setValue(value - delta)
      }
      if (that.state.plane === 2) {
        var value = sliderX.getValue()
        sliderX.setValue(value - delta)
      }
      if (that.state.plane === 3) {
        var value = sliderY.getValue()
        sliderY.setValue(value - delta)
      }
    }

    camera.position.set(-1, 1, 2)
    const controls = new THREE.OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 1
    controls.screenSpacePanning = false
    controls.minDistance = -5
    controls.maxDistance = 10
    controls.enablePan = false

    this.scene = scene
    this.camera = camera
    this.renderer = renderer
    this.cropFrame = cropFrame
    this.crop = crop
    this.frameLine = frameLine
    this.meshZ = meshZ
    this.meshX = meshX
    this.meshY = meshY
    this.planeZMaterial = planeZMaterial
    this.planeXMaterial = planeXMaterial
    this.planeYMaterial = planeYMaterial
    this.controls = controls
    this.nodules = nodules
    this.planes = planes
    this.noduleCenters = noduleCenters

    this.mount.appendChild(this.renderer.domElement)
    this.mount.appendChild(gui.domElement)
    this.start()
  }

  componentWillUnmount () {
    this.props.store_3d.update(this.props.id, this)
    this.stop()
    this.mount.removeChild(this.renderer.domElement)
  }

  start () {
    if (!this.frameId) {
      this.frameId = requestAnimationFrame(this.animate)
    }
  }

  stop () {
    cancelAnimationFrame(this.frameId)
  }

  animate () {
    this.controls.update()
    this.frameId = window.requestAnimationFrame(this.animate)
    this.renderScene()
  }

  renderScene () {
    this.renderer.render(this.scene, this.camera)
  }

  render () {
    const self = this
    return (
      <div 
        ref={(mount) => { this.mount = mount }} />
    )
  }
}
