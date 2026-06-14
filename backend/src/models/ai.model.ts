import mongoose, { Schema, Document } from 'mongoose';

export interface IGeneratedTask {
  title: string;
  description?: string;
  priority?: 'Low' | 'Medium' | 'High';
  assignee?: string;
  dueDate?: Date | string;
}

export interface IAIRiskAnalysis {
  missingRequirements: string[];
  ambiguousRequirements: string[];
  potentialRisks: string[];
}

export interface IAIAnalysis extends Document {
  meetingId: mongoose.Types.ObjectId | string;
  workspaceId: mongoose.Types.ObjectId | string;
  createdBy: mongoose.Types.ObjectId | string;
  summary?: string;
  functionalRequirements?: string[];
  userRoles?: string[];
  requirements?: string[];
  roles?: string[];
  entities?: string[];
  timeline?: string[];
  tasks?: IGeneratedTask[];
  risks?: string[];
  riskAnalysis?: IAIRiskAnalysis;
  createdAt: Date;
  updatedAt: Date;
}

const GeneratedTaskSchema = new Schema<IGeneratedTask>(
  {
    title: { type: String, required: true },
    description: { type: String },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    assignee: { type: String },
    dueDate: { type: Schema.Types.Date }
  },
  { _id: false }
);

const AIAnalysisSchema = new Schema<IAIAnalysis>(
  {
    meetingId: { type: Schema.Types.ObjectId, required: true, ref: 'Meeting', index: true },
    workspaceId: { type: Schema.Types.ObjectId, required: true, ref: 'Workspace', index: true },
    createdBy: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    summary: { type: String },
    functionalRequirements: { type: [String], default: [] },
    userRoles: { type: [String], default: [] },
    requirements: { type: [String], default: [] },
    roles: { type: [String], default: [] },
    entities: { type: [String], default: [] },
    timeline: { type: [String], default: [] },
    tasks: { type: [GeneratedTaskSchema], default: [] },
    risks: { type: [String], default: [] },
    riskAnalysis: {
      missingRequirements: { type: [String], default: [] },
      ambiguousRequirements: { type: [String], default: [] },
      potentialRisks: { type: [String], default: [] }
    }
  },
  { timestamps: true }
);

const AIAnalysisModel = mongoose.models.AIAnalysis || mongoose.model<IAIAnalysis>('AIAnalysis', AIAnalysisSchema);
export default AIAnalysisModel;
