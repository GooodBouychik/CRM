'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { ParticipantName } from '@/types';
import { uploadAttachment, getAttachmentUrl, type Attachment } from '@/lib/api';

interface PendingFile {
  file: File;
  preview?: string;
}

interface CommentInputProps {
  orderId: string;
  currentUser: ParticipantName;
  parentId?: string | null;
  onSubmit: (content: string, parentId?: string | null, attachmentIds?: string[]) => Promise<void>;
  onCancel?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  onError?: (message: string) => void;
}

const PARTICIPANTS: ParticipantName[] = ['Никита', 'Саня', 'Ксюша'];

// Utility function to detect @mentions in text
export function detectMentions(content: string): ParticipantName[] {
  // Use a pattern that matches @name followed by non-word character or end of string
  // Note: \b doesn't work correctly with Cyrillic characters in JS regex
  const mentionPattern = /@(Никита|Саня|Ксюша)(?=[\s,.:;!?\-\n]|$)/g;
  const matches = content.match(mentionPattern);
  if (!matches) return [];
  
  const mentioned = matches.map(m => m.slice(1) as ParticipantName);
  // Return unique mentions
  return Array.from(new Set(mentioned));
}

export function CommentInput({
  orderId,
  currentUser,
  parentId = null,
  onSubmit,
  onCancel,
  placeholder = 'Напишите комментарий... (Ctrl+Enter для отправки)',
  autoFocus = false,
  onError,
}: CommentInputProps) {
  const [content, setContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [uploadedAttachments, setUploadedAttachments] = useState<Attachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mentionStartRef = useRef<number | null>(null);


  // Draft auto-save key
  const draftKey = `comment-draft-${orderId}${parentId ? `-${parentId}` : ''}`;

  // Load draft from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) {
      setContent(savedDraft);
    }
  }, [draftKey]);

  // Save draft to localStorage on content change
  useEffect(() => {
    if (content.trim()) {
      localStorage.setItem(draftKey, content);
    } else {
      localStorage.removeItem(draftKey);
    }
  }, [content, draftKey]);

  // Clear draft after successful submit
  const clearDraft = useCallback(() => {
    localStorage.removeItem(draftKey);
  }, [draftKey]);

  // File upload handler
  const handleFileSelect = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    // Add files to pending list with previews for images
    const newPendingFiles: PendingFile[] = fileArray.map(file => {
      const pending: PendingFile = { file };
      if (file.type.startsWith('image/')) {
        pending.preview = URL.createObjectURL(file);
      }
      return pending;
    });
    setPendingFiles(prev => [...prev, ...newPendingFiles]);

    // Upload files immediately
    for (const file of fileArray) {
      try {
        const attachment = await uploadAttachment(orderId, file, currentUser);
        setUploadedAttachments(prev => [...prev, attachment]);
        // Remove from pending
        setPendingFiles(prev => prev.filter(p => p.file !== file));
      } catch (err) {
        onError?.(err instanceof Error ? err.message : 'Ошибка загрузки файла');
        setPendingFiles(prev => prev.filter(p => p.file !== file));
      }
    }
  }, [orderId, currentUser, onError]);

  // Remove uploaded attachment
  const removeAttachment = useCallback((attachmentId: string) => {
    setUploadedAttachments(prev => prev.filter(a => a.id !== attachmentId));
  }, []);

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
      handleFileSelect(e.dataTransfer.files);
    }
  }, [handleFileSelect]);

  // Filter participants for mention autocomplete
  const filteredParticipants = PARTICIPANTS.filter(
    (name) => name.toLowerCase().includes(mentionFilter.toLowerCase())
  );

  // Handle text change and detect @ for mentions
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;
    setContent(value);

    // Check for @ mention trigger
    const textBeforeCursor = value.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      // Check if there's no space after @ (still typing mention)
      if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
        setShowMentions(true);
        setMentionFilter(textAfterAt);
        mentionStartRef.current = lastAtIndex;
        setMentionIndex(0);
        return;
      }
    }
    
    setShowMentions(false);
    mentionStartRef.current = null;
  };

  // Insert mention at cursor position
  const insertMention = (name: ParticipantName) => {
    if (mentionStartRef.current === null || !textareaRef.current) return;

    const before = content.slice(0, mentionStartRef.current);
    const after = content.slice(textareaRef.current.selectionStart);
    const newContent = `${before}@${name} ${after}`;
    
    setContent(newContent);
    setShowMentions(false);
    mentionStartRef.current = null;
    
    // Focus back to textarea
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = before.length + name.length + 2; // +2 for @ and space
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };


  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+Enter to submit
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleSubmit();
      return;
    }

    // Handle mention navigation
    if (showMentions && filteredParticipants.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex((prev) => (prev + 1) % filteredParticipants.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex((prev) => (prev - 1 + filteredParticipants.length) % filteredParticipants.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(filteredParticipants[mentionIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowMentions(false);
        return;
      }
    }
  };

  // Submit handler
  const handleSubmit = async () => {
    const trimmedContent = content.trim();
    const hasContent = trimmedContent || uploadedAttachments.length > 0;
    if (!hasContent || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const attachmentIds = uploadedAttachments.map(a => a.id);
      await onSubmit(trimmedContent, parentId, attachmentIds.length > 0 ? attachmentIds : undefined);
      setContent('');
      setUploadedAttachments([]);
      setPendingFiles([]);
      clearDraft();
      setShowPreview(false);
    } catch (err) {
      // Error handling is done by parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  // Simple markdown preview renderer
  const renderPreview = (text: string) => {
    let html = text
      // Escape HTML
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // Bold
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Code
      .replace(/`(.+?)`/g, '<code class="bg-gray-100 dark:bg-gray-700 px-1 rounded">$1</code>')
      // Mentions - highlight
      .replace(/@(Никита|Саня|Ксюша)/g, '<span class="text-primary-500 font-medium">@$1</span>')
      // Line breaks
      .replace(/\n/g, '<br />');
    
    return html;
  };

  return (
    <div className="relative">
      {/* Tabs for Write/Preview */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-2">
        <button
          type="button"
          onClick={() => setShowPreview(false)}
          className={`px-3 py-1 text-sm ${
            !showPreview
              ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Написать
        </button>
        <button
          type="button"
          onClick={() => setShowPreview(true)}
          className={`px-3 py-1 text-sm ${
            showPreview
              ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Предпросмотр
        </button>
      </div>


      {/* Content area */}
      {showPreview ? (
        <div
          className="min-h-[100px] p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          dangerouslySetInnerHTML={{ __html: renderPreview(content) || '<span class="text-gray-400">Нет содержимого</span>' }}
        />
      ) : (
        <div 
          className={`relative ${isDragging ? 'ring-2 ring-primary-500 ring-offset-2' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoFocus={autoFocus}
            rows={3}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none"
          />

          {/* Drag overlay */}
          {isDragging && (
            <div className="absolute inset-0 bg-primary-50 dark:bg-primary-900/30 border-2 border-dashed border-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-primary-600 dark:text-primary-400 font-medium">Отпустите для загрузки</span>
            </div>
          )}

          {/* Mention autocomplete dropdown */}
          {showMentions && filteredParticipants.length > 0 && (
            <div className="absolute left-0 bottom-full mb-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 min-w-[150px]">
              {filteredParticipants.map((name, index) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => insertMention(name)}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    index === mentionIndex ? 'bg-gray-100 dark:bg-gray-700' : ''
                  }`}
                >
                  @{name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Uploaded attachments preview */}
      {(uploadedAttachments.length > 0 || pendingFiles.length > 0) && (
        <div className="flex flex-wrap gap-2 mt-2">
          {uploadedAttachments.map(attachment => (
            <div
              key={attachment.id}
              className="flex items-center gap-2 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm"
            >
              <span>📎</span>
              <a
                href={getAttachmentUrl(attachment.fileUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-500 hover:underline truncate max-w-[150px]"
              >
                {attachment.filename}
              </a>
              <button
                type="button"
                onClick={() => removeAttachment(attachment.id)}
                className="text-gray-400 hover:text-red-500"
              >
                ×
              </button>
            </div>
          ))}
          {pendingFiles.map((pending, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm opacity-50"
            >
              <div className="animate-spin h-3 w-3 border-2 border-primary-500 border-t-transparent rounded-full"></div>
              <span className="truncate max-w-[150px]">{pending.file.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-3">
          {/* File upload button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            title="Прикрепить файл"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
            className="hidden"
          />
          <div className="text-xs text-gray-400 dark:text-gray-500">
            Markdown: **жирный**, *курсив*, `код` | @упоминание
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Отмена
            </button>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={(!content.trim() && uploadedAttachments.length === 0) || isSubmitting}
            className="px-4 py-1 bg-primary-500 text-white rounded text-sm hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Отправка...' : 'Отправить'}
          </button>
        </div>
      </div>
    </div>
  );
}
