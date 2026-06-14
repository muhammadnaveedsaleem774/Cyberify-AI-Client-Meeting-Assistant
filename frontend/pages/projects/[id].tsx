import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import api from '../../lib/api';
import ProjectForm from '../../components/forms/ProjectForm';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { PageSkeleton } from '../../components/ui/Skeleton';

export default function ProjectDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [project, setProject] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    api.get(`/api/projects/${id}`).then((r) => { if (mounted) setProject(r.data.data); }).catch(() => {}).finally(() => mounted && setLoading(false));
    api.get(`/api/files/project/${id}`).then((r) => { if (mounted) setFiles(r.data.files || []); }).catch(() => {});
    return () => { mounted = false; };
  }, [id]);

  const update = async (payload: any) => {
    await api.put(`/api/projects/${id}`, payload);
    const res = await api.get(`/api/projects/${id}`);
    setProject(res.data.data);
  };

  const remove = async () => {
    if (!confirm('Delete project?')) return;
    await api.delete(`/api/projects/${id}`);
    router.push('/projects');
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    form.append('projectId', String(id));
    setUploading(true);
    setProgress(0);
    try {
      const res = await api.post('/api/files/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (evt) => {
          if (evt.total) setProgress(Math.round((evt.loaded / evt.total) * 100));
        }
      });
      setFiles((prev) => [res.data.file, ...prev]);
    } catch (_) {
      alert('Upload failed');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const deleteFile = async (fileId: string) => {
    if (!confirm('Delete file?')) return;
    await api.delete(`/api/files/${fileId}`);
    setFiles((prev) => prev.filter((f) => f._id !== fileId));
  };

  const downloadFile = (fileId: string) => {
    window.open(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/files/${fileId}/download`, '_blank');
  };

  if (loading) return <DashboardLayout><PageSkeleton /></DashboardLayout>;
  if (!project) return <DashboardLayout><EmptyState title="Project not found" subtitle="This project may have been deleted or is outside your workspace." /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="page-title">{project.name}</h1>
            <p className="page-subtitle">Project details, metadata, and client files.</p>
          </div>
          <Button onClick={remove} variant="danger">Delete</Button>
        </div>

        <Card>
          <CardHeader title="Project Settings" subtitle="Keep project information current for analysis and reporting." />
          <CardBody>
            <ProjectForm initial={project} onSubmit={update} submitLabel="Update" />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Files" subtitle="Upload and manage source material for this project." />
          <CardBody>
            <div className="mb-4">
              <input
                type="file"
                onChange={handleFile}
                className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100 dark:text-slate-300 dark:file:bg-blue-950 dark:file:text-blue-300"
              />
              {uploading && <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">Uploading... {progress}%</div>}
            </div>

            {files.length === 0 && <EmptyState title="No files yet" subtitle="Attach briefs, proposals, or client documents to keep the project context close." />}
            {files.length > 0 && (
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {files.map((f) => (
                  <div key={f._id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="font-medium text-slate-950 dark:text-white">{f.originalName}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{f.mimeType} - {(f.size / 1024).toFixed(1)} KB</div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => downloadFile(f._id)} variant="secondary">Download</Button>
                      <Button onClick={() => deleteFile(f._id)} variant="danger">Delete</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </DashboardLayout>
  );
}
