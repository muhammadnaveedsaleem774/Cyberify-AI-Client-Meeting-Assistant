import FileModel, { IFile } from '../models/file.model';

export type SaveFileDTO = {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  storageProvider?: 'local' | 's3';
  projectId?: string;
  workspaceId: string;
  uploadedBy: string;
};

export async function saveFile(dto: SaveFileDTO) {
  return FileModel.create(dto as Partial<IFile>);
}

export async function listFilesByProject(projectId: string, workspaceId: string) {
  return FileModel.find({ projectId, workspaceId }).lean();
}

export default { saveFile, listFilesByProject };
