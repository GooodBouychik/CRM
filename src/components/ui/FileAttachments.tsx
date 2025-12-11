'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  fetchAttachments, 
  uploadAttachment, 
  deleteAttachment, 
  getAttachmentUrl,
  type Attachment 
} from '@/lib/api';
import type { ParticipantName } from '@/types';

interface FileAttachmentsProps {
  orderId: string;
  currentUser: ParticipantName;
  onError?: (message: string) => void;
  onSuccess?: (message: string) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return '🖼️';
  if (['pdf'].includes(ext)) return '📄';
  if (['doc', 'docx'].includes(ext)) return '📝';
  if (['xls', 'xlsx'].includes(ext)) return '📊';
  if (['zip', 'rar', '7z'].includes(ext)) return '📦';
  if (['mp4', 'mov', 'avi'].includes(ext)) return '🎬';
  if (['mp3', 'wav', 'ogg'].includes(ext)) return '🎵';
  return '📎';
}

export function FileAttachments({ orderId, currentUser, onError, onSuccess }: FileAttachmentsProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load attachments
  useEffect(() => {
    async function loadAttachments() {
      try {
        const data = await fetchAttachments(orderId);
        setAttachments(data);
      } catch (err) {
        onError?.(err instanceof Error ? err.message : 'Failed to load attachments');
      } finally {
        setLoading(false);
      }
    }
    loadAttachments();
  }, [orderId, onError]);

  // Handle file upload
  const handleUpload = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setUploading(true);
    try {
      for (const file of fileArray) {
        const attachment = await uploadAttachment(orderId, file, currentUser);
        setAttachments(prev => [attachment, ...prev]);
      }
      onSuccess?.(`${fileArray.length} файл(ов) загружено`);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  }, [orderId, currentUser, onError, onSuccess]);

  // Handle delete
  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Удалить файл?')) return;
    
    try {
      await deleteAttachment(id);
      setAttachments(prev => prev.filter(a => a.id !== id));
      onSuccess?.('Файл удалён');
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Failed to delete file');
    }
  }, [onError, onSuccess]);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files);
    }
  }, [handleUpload]);

  // File input change handler
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUpload(e.target.files);
      e.target.value = ''; // Reset input
    }
  }, [handleUpload]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
          ${isDragging 
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }
          ${uploading ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileInputChange}
          className="hidden"
        />
        {uploading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500"></div>
            <span className="text-gray-500">Загрузка...</span>
          </div>
        ) : (
          <div className="text-gray-500 dark:text-gray-400">
            <span className="text-2xl">📎</span>
            <p className="mt-1 text-sm">
              Перетащите файлы сюда или <span className="text-primary-500">выберите</span>
            </p>
          </div>
        )}
      </div>

      {/* Attachment list */}
      {attachments.length > 0 && (
        <ul className="space-y-2">
          {attachments.map((attachment) => (
            <li
              key={attachment.id}
              className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg group"
            >
              <span className="text-xl">{getFileIcon(attachment.filename)}</span>
              <div className="flex-1 min-w-0">
                <a
                  href={getAttachmentUrl(attachment.fileUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-primary-500 truncate block"
                  title={attachment.filename}
                >
                  {attachment.filename}
                </a>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatFileSize(attachment.fileSize)} • {attachment.uploadedBy} • {new Date(attachment.uploadedAt).toLocaleDateString('ru-RU')}
                </p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <a
                  href={getAttachmentUrl(attachment.fileUrl)}
                  download={attachment.filename}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                  title="Скачать"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </a>
                <button
                  onClick={() => handleDelete(attachment.id)}
                  className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded"
                  title="Удалить"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {attachments.length === 0 && !loading && (
        <p className="text-sm text-gray-400 text-center py-2">Нет прикреплённых файлов</p>
      )}
    </div>
  );
}
