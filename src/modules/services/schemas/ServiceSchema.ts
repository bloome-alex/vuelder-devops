import { Schema, model } from 'mongoose';
import { Service } from '../interfaces/ServiceInterface';

const ServiceEnvironmentSchema = new Schema(
  {
    key: { type: String, required: true, trim: true },
    value: { type: String, trim: true },
  },
  { _id: false },
);

const ServicePortSchema = new Schema(
  {
    hostPort: { type: Number, required: true, min: 1, max: 65535 },
    containerPort: { type: Number, required: true, min: 1, max: 65535 },
    protocol: { type: String, enum: ['tcp', 'udp'], required: true, default: 'tcp' },
  },
  { _id: false },
);

const ServiceVolumeSchema = new Schema(
  {
    source: { type: String, required: true, trim: true },
    target: { type: String, required: true, trim: true },
    readOnly: { type: Boolean, required: true, default: false },
  },
  { _id: false },
);

const schema = new Schema<Service>(
  {
    name: { type: String, required: true, trim: true },
    template: { type: String, required: true, trim: true },
    environment: { type: [ServiceEnvironmentSchema], default: [] },
    ports: { type: [ServicePortSchema], default: [] },
    volumes: { type: [ServiceVolumeSchema], default: [] },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = String(ret._id);
        ret.template = String(ret.template);
        delete ret._id;
        return ret;
      },
    },
  },
);

schema.index({ name: 1 }, { unique: true });

export const ServiceSchema = model<Service>('Service', schema);
