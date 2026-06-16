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
  const [downloading, setDownloading] = useState<Record<string, boolean>>({});
  const [downloadError, setDownloadError] = useState<string | null>(null);

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

  const handleDownload = async (fileId: string, filename: string) => {
    setDownloadError(null);
    setDownloading((prev) => ({ ...prev, [fileId]: true }));
    try {
      const response = await api.get(`/api/files/${fileId}/download`, {
        responseType: 'blob'
      });
      const url = URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename || 'download');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      setDownloadError('Download failed. Please try again.');
      window.setTimeout(() => setDownloadError(null), 4500);
    } finally {
      setDownloading((prev) => {
        const next = { ...prev };
        delete next[fileId];
        return next;
      });
    }
  };

  if (loading) return <DashboardLayout><PageSkeleton /></DashboardLayout>;
  if (!project) return <DashboardLayout><EmptyState title="Project not found" subtitle="This project may have been deleted or is outside your workspace." /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {downloadError && (
          <div className="fixed right-4 top-20 z-50 max-w-sm rounded-xl border border-red-200 bg-white p-4 text-sm font-medium text-red-700 shadow-lg dark:border-red-900/60 dark:bg-slate-950 dark:text-red-300">
            {downloadError}
          </div>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-3 inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300">
              Project workspace
            </div>
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
            <div className="mb-5 rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-950/40">
              <div className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Upload project document</div>
              <input
                type="file"
                onChange={handleFile}
                className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100 dark:text-slate-300 dark:file:bg-blue-950 dark:file:text-blue-300"
              />
              {uploading && (
                <div className="mt-3">
                  <div className="text-sm text-slate-500 dark:text-slate-400">Uploading... {progress}%</div>
                  <div className="mt-2 h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                    <div className="h-full rounded-full bg-blue-600" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}
            </div>

            {files.length === 0 && <EmptyState title="No files yet" subtitle="Attach briefs, proposals, or client documents to keep the project context close." />}
            {files.length > 0 && (
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {files.map((f) => (
                  <div key={f._id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">DOC</div>
                      <div className="min-w-0">
                      <div className="font-medium text-slate-950 dark:text-white">{f.originalName}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{f.mimeType} - {(f.size / 1024).toFixed(1)} KB</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleDownload(f._id, f.originalName)}
                        variant="secondary"
                        loading={Boolean(downloading[f._id])}
                        disabled={Boolean(downloading[f._id])}
                      >
                        {downloading[f._id] ? 'Downloading...' : 'Download'}
                      </Button>
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
