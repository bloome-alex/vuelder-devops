import { Schema, model } from 'mongoose';
import { IImageRecord } from '../interfaces/ImagesInterface';

const schema = new Schema<IImageRecord>(
  {
    repository: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    createdAt: { type: String, default: null },
    digest: { type: String, default: null },
    size: { type: Number, default: null },
    syncedAt: { type: Date, required: true, default: Date.now },
  },
  {
    versionKey: false,
    toJSON: {
      transform: (_doc, ret) => {
        delete (ret as { _id?: unknown })._id;
        return ret;
      },
    },
  },
);

schema.index({ repository: 1, name: 1 }, { unique: true });

export const ImageSchema = model<IImageRecord>('Image', schema);
