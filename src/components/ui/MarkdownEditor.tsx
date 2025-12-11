'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { ParticipantName } from '@/types';
import { PARTICIPANT_COLORS } from '@/stores/presenceStore';

export interface CursorPosition {
  line: number;
  column: number;
}

export interface RemoteCursor {
  userName: ParticipantName;
  position: CursorPosition | null;
}

interface MarkdownEditorProps {
  value: string;
  onSave: (value: string) => void;
  placeholder?: string;
  // Collaborative cursor props
  orderId?: string;
  currentUser?: ParticipantName;
  remoteCursors?: RemoteCursor[];
  onCursorMove?: (position: CursorPosition | null) => void;
}

// Simple markdown to HTML converter for preview
function parseMarkdown(text: string): string {
  if (!text) return '';
  
  let html = text
    // Escape HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-3 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold mt-4 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Code blocks
    .replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 dark:bg-gray-700 p-2 rounded my-2 overflow-x-auto"><code>$1</code></pre>')
    // Inline code
    .replace(/`(.+?)`/g, '<code class="bg-gray-100 dark:bg-gray-700 px-1 rounded">$1</code>')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
    // Line breaks
    .replace(/\n/g, '<br />');
  
  // Wrap consecutive list items
  html = html.replace(/(<li[^>]*>.*?<\/li>(<br \/>)?)+/g, (match) => {
    return '<ul class="list-disc my-2">' + match.replace(/<br \/>/g, '') + '</ul>';
  });
  
  return html;
}

export function MarkdownEditor({ 
  value, 
  onSave, 
  placeholder,
  orderId,
  currentUser,
  remoteCursors = [],
  onCursorMove,
}: MarkdownEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [showPreview, setShowPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  // Calculate cursor position from textarea selection
  const getCursorPosition = useCallback((): CursorPosition | null => {
    const textarea = textareaRef.current;
    if (!textarea) return null;
    
    const text = textarea.value.substring(0, textarea.selectionStart);
    const lines = text.split('\n');
    return {
      line: lines.length,
      column: lines[lines.length - 1].length + 1,
    };
  }, []);

  // Handle cursor movement
  const handleCursorChange = useCallback(() => {
    if (onCursorMove && isEditing) {
      const position = getCursorPosition();
      onCursorMove(position);
    }
  }, [onCursorMove, isEditing, getCursorPosition]);

  const handleSave = () => {
    setIsEditing(false);
    setShowPreview(false);
    if (onCursorMove) {
      onCursorMove(null); // Clear cursor on save
    }
    if (editValue !== value) {
      onSave(editValue);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
    setShowPreview(false);
    if (onCursorMove) {
      onCursorMove(null); // Clear cursor on cancel
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel();
    }
    // Ctrl+Enter to save
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    }
  };

  // Filter active remote cursors (those with positions)
  const activeCursors = remoteCursors.filter(
    (c) => c.position !== null && c.userName !== currentUser
  );

  if (isEditing) {
    return (
      <div className="border border-primary-500 rounded-lg overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-2 py-1 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <button
            type="button"
            onClick={() => setShowPreview(false)}
            className={`px-2 py-0.5 text-sm rounded ${!showPreview ? 'bg-white dark:bg-gray-600 shadow' : ''}`}
          >
            Редактор
          </button>
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className={`px-2 py-0.5 text-sm rounded ${showPreview ? 'bg-white dark:bg-gray-600 shadow' : ''}`}
          >
            Превью
          </button>
          <div className="flex-1" />
          {/* Show active remote cursors */}
          {activeCursors.length > 0 && (
            <div className="flex items-center gap-1 mr-2">
              {activeCursors.map((cursor) => (
                <div
                  key={cursor.userName}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs"
                  style={{ 
                    backgroundColor: `${PARTICIPANT_COLORS[cursor.userName]}20`,
                    color: PARTICIPANT_COLORS[cursor.userName],
                  }}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ backgroundColor: PARTICIPANT_COLORS[cursor.userName] }}
                  />
                  {cursor.userName}
                </div>
              ))}
            </div>
          )}
          <span className="text-xs text-gray-400">Ctrl+Enter для сохранения</span>
        </div>
        
        {showPreview ? (
          <div
            className="p-3 min-h-[150px] prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: parseMarkdown(editValue) || '<span class="text-gray-400">Нет содержимого</span>' }}
          />
        ) : (
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={editValue}
              onChange={(e) => {
                setEditValue(e.target.value);
                handleCursorChange();
              }}
              onKeyDown={handleKeyDown}
              onKeyUp={handleCursorChange}
              onClick={handleCursorChange}
              onSelect={handleCursorChange}
              className="w-full p-3 min-h-[150px] bg-white dark:bg-gray-800 focus:outline-none resize-y font-mono text-sm"
              autoFocus
              placeholder={placeholder}
            />
            {/* Remote cursor indicators overlay */}
            {activeCursors.length > 0 && (
              <div className="absolute top-0 left-0 right-0 pointer-events-none">
                {activeCursors.map((cursor) => (
                  <RemoteCursorIndicator
                    key={cursor.userName}
                    cursor={cursor}
                    text={editValue}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Actions */}
        <div className="flex justify-end gap-2 px-2 py-1 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
          <button
            type="button"
            onClick={handleCancel}
            className="px-3 py-1 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-3 py-1 text-sm bg-primary-500 text-white rounded hover:bg-primary-600"
          >
            Сохранить
          </button>
        </div>
      </div>
    );
  }

  // Display mode
  if (value) {
    return (
      <div
        onClick={() => setIsEditing(true)}
        className="cursor-pointer p-3 rounded-lg border border-transparent hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 prose prose-sm dark:prose-invert max-w-none"
        title="Click to edit"
        dangerouslySetInnerHTML={{ __html: parseMarkdown(value) }}
      />
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className="cursor-pointer p-3 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-400"
      title="Click to edit"
    >
      {placeholder || 'Click to add description...'}
    </div>
  );
}


// Remote cursor indicator component
interface RemoteCursorIndicatorProps {
  cursor: RemoteCursor;
  text: string;
}

function RemoteCursorIndicator({ cursor, text }: RemoteCursorIndicatorProps) {
  if (!cursor.position) return null;
  
  const { line, column } = cursor.position;
  const lines = text.split('\n');
  
  // Calculate approximate position
  // Note: This is a simplified calculation - in production you'd want to measure actual character widths
  const lineHeight = 20; // Approximate line height in pixels
  const charWidth = 8; // Approximate character width for monospace font
  const padding = 12; // Textarea padding
  
  const top = padding + (line - 1) * lineHeight;
  const left = padding + (column - 1) * charWidth;
  
  const color = PARTICIPANT_COLORS[cursor.userName];
  
  return (
    <div
      className="absolute transition-all duration-100"
      style={{
        top: `${top}px`,
        left: `${left}px`,
      }}
    >
      {/* Cursor line */}
      <div
        className="w-0.5 h-5 animate-pulse"
        style={{ backgroundColor: color }}
      />
      {/* User label */}
      <div
        className="absolute -top-5 left-0 px-1 py-0.5 text-xs text-white rounded whitespace-nowrap"
        style={{ backgroundColor: color }}
      >
        {cursor.userName}
      </div>
    </div>
  );
}
