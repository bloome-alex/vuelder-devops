import { Schema, model } from 'mongoose';
import { Template } from '../interfaces/TemplateInterface';

const TemplateEnvironmentSchema = new Schema(
  {
    key: { type: String, required: true, trim: true },
    defaultValue: { type: String, trim: true },
    required: { type: Boolean, required: true, default: false },
    secret: { type: Boolean, required: true, default: false },
  },
  { _id: false },
);

const TemplatePortSchema = new Schema(
  {
    hostPort: { type: Number, required: true, min: 1, max: 65535 },
    containerPort: { type: Number, required: true, min: 1, max: 65535 },
    protocol: { type: String, enum: ['tcp', 'udp'], required: true, default: 'tcp' },
  },
  { _id: false },
);

const TemplateVolumeSchema = new Schema(
  {
    source: { type: String, required: true, trim: true },
    target: { type: String, required: true, trim: true },
    readOnly: { type: Boolean, required: true, default: false },
  },
  { _id: false },
);

const schema = new Schema<Template>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    image: { type: String, required: true, trim: true },
    tag: { type: String, trim: true },
    environment: { type: [TemplateEnvironmentSchema], default: [] },
    ports: { type: [TemplatePortSchema], default: [] },
    volumes: { type: [TemplateVolumeSchema], default: [] },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete (ret as { _id?: unknown })._id;
        return ret;
      },
    },
  },
);

schema.index({ name: 1 }, { unique: true });

export const TemplateSchema = model<Template>('Template', schema);
