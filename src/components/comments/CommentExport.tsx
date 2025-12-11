'use client';

import { useState, useCallback } from 'react';
import type { Comment } from '@/types';

export type ExportFormat = 'json' | 'txt' | 'pdf';

export interface CommentExportProps {
  comments: Comment[];
  orderTitle: string;
  orderId: string;
}

/**
 * Formats a date for display in exports
 */
function formatDate(date: Date | string): string {
  return new Date(date).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Exports comments to JSON format
 */
export function exportToJSON(comments: Comment[], orderTitle: string): string {
  const exportData = {
    orderTitle,
    exportedAt: new Date().toISOString(),
    totalComments: comments.length,
    comments: comments.map(c => ({
      id: c.id,
      author: c.author,
      content: c.content,
      isSystem: c.isSystem,
      parentId: c.parentId,
      reactions: c.reactions,
      createdAt: c.createdAt,
      editedAt: c.editedAt,
    })),
  };
  return JSON.stringify(exportData, null, 2);
}

/**
 * Exports comments to plain text format
 */
export function exportToTXT(comments: Comment[], orderTitle: string): string {
  const lines: string[] = [
    `Комментарии к заказу: ${orderTitle}`,
    `Экспортировано: ${formatDate(new Date())}`,
    `Всего комментариев: ${comments.length}`,
    '',
    '='.repeat(60),
    '',
  ];

  // Sort comments chronologically
  const sorted = [...comments].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  for (const comment of sorted) {
    const prefix = comment.isSystem ? '[СИСТЕМА]' : `[${comment.author}]`;
    const edited = comment.editedAt ? ' (изменено)' : '';
    
    lines.push(`${prefix} ${formatDate(comment.createdAt)}${edited}`);
    
    if (comment.parentId) {
      lines.push('  ↳ Ответ на комментарий');
    }
    
    // Indent content
    const contentLines = comment.content.split('\n');
    for (const line of contentLines) {
      lines.push(`  ${line}`);
    }
    
    // Add reactions if any
    const reactions = comment.reactions || {};
    const reactionEntries = Object.entries(reactions).filter(([_, users]) => users.length > 0);
    if (reactionEntries.length > 0) {
      const reactionStr = reactionEntries
        .map(([emoji, users]) => `${emoji} ${users.length}`)
        .join(' ');
      lines.push(`  Реакции: ${reactionStr}`);
    }
    
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Exports comments to PDF format (generates HTML that can be printed to PDF)
 */
export function exportToPDF(comments: Comment[], orderTitle: string): string {
  const sorted = [...comments].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const commentsHtml = sorted.map(comment => {
    const isSystem = comment.isSystem;
    const edited = comment.editedAt ? '<span style="color: #888; font-style: italic;"> (изменено)</span>' : '';
    const replyIndicator = comment.parentId ? '<div style="color: #888; font-size: 12px;">↳ Ответ на комментарий</div>' : '';
    
    const reactions = comment.reactions || {};
    const reactionEntries = Object.entries(reactions).filter(([_, users]) => users.length > 0);
    const reactionsHtml = reactionEntries.length > 0
      ? `<div style="margin-top: 8px; color: #666;">${reactionEntries.map(([emoji, users]) => `${emoji} ${users.length}`).join(' ')}</div>`
      : '';

    return `
      <div style="margin-bottom: 16px; padding: 12px; border: 1px solid #ddd; border-radius: 8px; ${isSystem ? 'background: #f5f5f5;' : ''}">
        <div style="font-weight: bold; color: ${isSystem ? '#666' : '#333'};">
          ${isSystem ? '🔧 Система' : comment.author}
          <span style="font-weight: normal; color: #888; margin-left: 8px;">${formatDate(comment.createdAt)}</span>
          ${edited}
        </div>
        ${replyIndicator}
        <div style="margin-top: 8px; white-space: pre-wrap;">${escapeHtml(comment.content)}</div>
        ${reactionsHtml}
      </div>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Комментарии - ${escapeHtml(orderTitle)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
    .meta { color: #666; margin-bottom: 20px; }
  </style>
</head>
<body>
  <h1>Комментарии к заказу: ${escapeHtml(orderTitle)}</h1>
  <div class="meta">
    <p>Экспортировано: ${formatDate(new Date())}</p>
    <p>Всего комментариев: ${comments.length}</p>
  </div>
  ${commentsHtml}
</body>
</html>
  `.trim();
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Downloads content as a file
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function CommentExport({ comments, orderTitle, orderId }: CommentExportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = useCallback(async (format: ExportFormat) => {
    setExporting(true);
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const baseFilename = `comments-${orderId}-${timestamp}`;

      switch (format) {
        case 'json': {
          const content = exportToJSON(comments, orderTitle);
          downloadFile(content, `${baseFilename}.json`, 'application/json');
          break;
        }
        case 'txt': {
          const content = exportToTXT(comments, orderTitle);
          downloadFile(content, `${baseFilename}.txt`, 'text/plain');
          break;
        }
        case 'pdf': {
          const content = exportToPDF(comments, orderTitle);
          // Open in new window for printing to PDF
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            printWindow.document.write(content);
            printWindow.document.close();
            printWindow.print();
          }
          break;
        }
      }
    } finally {
      setExporting(false);
      setIsOpen(false);
    }
  }, [comments, orderTitle, orderId]);


  if (comments.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={exporting}
        className="flex items-center gap-1 px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        {exporting ? 'Экспорт...' : 'Экспорт'}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 py-1">
          <button
            onClick={() => handleExport('json')}
            className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
          >
            <span className="text-lg">📄</span>
            JSON
          </button>
          <button
            onClick={() => handleExport('txt')}
            className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
          >
            <span className="text-lg">📝</span>
            Текст (TXT)
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
          >
            <span className="text-lg">📑</span>
            PDF (печать)
          </button>
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
