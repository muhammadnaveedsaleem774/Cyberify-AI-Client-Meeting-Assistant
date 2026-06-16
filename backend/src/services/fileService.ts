import FileModel, { IFile } from '../models/file.model';
import MeetingModel from '../models/meeting.model';
import ProjectModel from '../models/project.model';
import { assertBelongsToWorkspace } from '../utils/assertWorkspaceOwnership';

export type SaveFileDTO = {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  storageProvider?: 'local' | 's3';
  projectId?: string;
  meetingId?: string;
  workspaceId: string;
  uploadedBy: string;
};

export async function assertFileLinksBelongToWorkspace(dto: { projectId?: string; meetingId?: string; workspaceId: string }) {
  await Promise.all([
    dto.projectId
      ? assertBelongsToWorkspace(ProjectModel, dto.projectId, dto.workspaceId, 'Project')
      : Promise.resolve(),
    dto.meetingId
      ? assertBelongsToWorkspace(MeetingModel, dto.meetingId, dto.workspaceId, 'Meeting')
      : Promise.resolve()
  ]);
}

export async function saveFile(dto: SaveFileDTO) {
  await assertFileLinksBelongToWorkspace(dto);
  return FileModel.create(dto as Partial<IFile>);
}

export async function listFilesByProject(projectId: string, workspaceId: string) {
  return FileModel.find({ projectId, workspaceId }).lean();
}

export default { saveFile, listFilesByProject };
