import { Schema, model } from 'mongoose';
import { NginxDomain } from '../interfaces/NginxInterface';

const schema = new Schema<NginxDomain>(
  {
    domain: { type: String, required: true, trim: true, lowercase: true, unique: true },
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service', required: false, default: null },
    port: { type: Number, required: false, min: 1, max: 65535, default: null },
    sslEnabled: { type: Boolean, required: true, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = String(ret._id);
        ret.serviceId = ret.serviceId ? String(ret.serviceId) : null;
        delete ret._id;
        return ret;
      },
    },
  },
);

schema.index({ domain: 1 }, { unique: true });

export const NginxSchema = model<NginxDomain>('NginxDomain', schema);
