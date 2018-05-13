import os
import sys
import numpy as np
import pandas as pd


CURRENT_PATH = os.path.dirname(os.path.abspath(__file__))
from radio import CTImagesMaskedBatch as CTIMB
from radio.dataset import FilesIndex, Pipeline, Dataset, V, B
from radio.dataset.models.tf import TfModel
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"

# item demonstration
RENDER_SHAPE = (32, 64, 64)

# inference
SHAPE = (256, 384, 384)
SPACING = (1.7, 1., 1.)

RENDER_SPACING = np.array(USPACING_SHAPE) / np.array(RENDER_SHAPE) * np.array(SPACING)

# xip parameters
XIP_PARAMS = dict(mode='max', depth=6, stride=2, channels=3)

def get_pixel_coords(nodules):
    """ Get nodules info in pixel coords from nodules recarray.
    """
    coords = (nodules.nodule_center - nodules.origin) / nodules.spacing
    diams = np.ceil(nodules.nodule_size / nodules.spacing)
    nodules = np.rint(np.hstack([coords, diams])).astype(np.int)
    return nodules


class CtController:
    def __init__(self, ct_path, model_path):
        # associate controller with a dataset of ct-scans
        if isinstance(ct_path, str):
            ct_path = [ct_path]
        paths = []
        for path in ct_path:
            paths.extend(p for p in glob.glob(path))
        paths = sorted(paths)
        if not paths:
            raise ValueError("A list of paths to CT-scans cannot be empty!")

        # set names for scans
        key_len = len(str(len(paths)))
        self.ct_dict = {str(i + 1).zfill(key_len): f for i, f in enumerate(paths)}

        # set up scan-rendering pipeline
        BATCH_SIZE = 1
        self.ppl_render_scan = (Pipeline()
                                .load(fmt='blosc', components=['images', 'spacing', 'origin'])
                                .unify_spacing(shape=RENDER_SHAPE, spacing=RENDER_SPACING, padding=0) # assume scans are normalized
                                .run(batch_size=BATCH_SIZE, shuffle=False, drop_last=False, n_epochs=1, lazy=True))

        # inference pipeline
        self.ppl_predict_scan = (Pipeline()
                                 .init_model('static', TfModel, name='xipnet', config=dict(load=True, path=model_path))
                                 .load(fmt='blosc')
                                 .unify_spacing(shape=SHAPE, spacing=SPACING, padding=0) # assume the scans are normalized
                                 .init_variables(('predictions', 'nodules_true', 'nodules_predicted'))
                                 .fetch_nodules_from_mask()
                                 .update_variable('nodules_true', B('nodules'))
                                 .predict_model('xipnet', save_to=V('predictions'),
                                                feed_dict=dict(images=C(CTIMB.xip_component,
                                                                        component='images', **XIP_PARAMS)))
                                 .call(CTIMB.unxip_predictions, predictions=V('predictions'), squeeze=True, **XIP_PARAMS,
                                       component='masks')
                                 .fetch_nodules_from_mask()
                                 .update_variable('nodules_predicted', B('nodules'))
                                 .run(batch_size=BATCH_SIZE, shuffle=False, drop_last=False, n_epochs=1, lazy=True))

    def build_item_ds(self, data):
        item_id = data.get('id')
        path = self.ct_dict.get(item_id)
        return Dataset(path=path, batch_class=CTIMB, dirs=True)

    def get_list(self, data, meta):
        ct_list = [dict(name='Patient ' + key, id=key) for key in sorted(self.ct_dict)]
        return dict(data=ct_list, meta=meta)

    def get_item_data(self, data, meta):
        item_ds = self.build_item_ds(data)
        bch = (item_ds >> self.ppl_render_scan).next_batch()
        item_data = dict(image=bch.images.tolist())
        return dict(data={**item_data, **data}, meta=meta)

    def get_inference(self, data, meta):
        # perform inference
        print('START PREDICTING')
        item_ds = self.build_item_ds(data)
        predict = (self.ppl_render_scan >> item_ds)
        _ = (item_ds >> predict).next_batch()

        # nodules in pixel coords
        nodules_true = get_pixel_coords(predict.get_variable('nodules_true'))
        nodules_predicted = get_pixel_coords(predict.get_variable('nodules_predicted'))
        item_data = dict(nodules_true=nodules_true.tolist(), nodules_predicted=nodules_predicted.tolist())

        # update and fetch data dict
        print('DONE PREDICTING')
        res = dict(data={**item_data, **data}, meta=meta)
        return res
