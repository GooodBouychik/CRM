'use client';

import { useState, useCallback } from 'react';
import { useUser } from '@/providers/UserProvider';
import { 
  createClientNote, 
  updateClientNote, 
  deleteClientNote,
  type ClientNote 
} from '@/lib/api';

export interface ClientNotesProps {
  clientName: string;
  notes: ClientNote[];
  onNotesUpdate: (notes: ClientNote[]) => void;
}

export function ClientNotes({ clientName, notes, onNotesUpdate }: ClientNotesProps) {
  const { currentUser } = useUser();
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleAddNote = useCallback(async () => {
    if (!newNoteContent.trim() || !currentUser) return;
    
    setIsSubmitting(true);
    try {
      const newNote = await createClientNote(clientName, {
        content: newNoteContent.trim(),
        author: currentUser,
      });
      onNotesUpdate([newNote, ...notes]);
      setNewNoteContent('');
    } catch (err) {
      console.error('Failed to create note:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [clientName, newNoteContent, currentUser, notes, onNotesUpdate]);

  const handleStartEdit = useCallback((note: ClientNote) => {
    setEditingNoteId(note.id);
    setEditContent(note.content);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingNoteId(null);
    setEditContent('');
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingNoteId || !editContent.trim()) return;
    
    setIsSubmitting(true);
    try {
      const updatedNote = await updateClientNote(editingNoteId, editContent.trim());
      onNotesUpdate(notes.map(n => n.id === editingNoteId ? updatedNote : n));
      setEditingNoteId(null);
      setEditContent('');
    } catch (err) {
      console.error('Failed to update note:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [editingNoteId, editContent, notes, onNotesUpdate]);

  const handleDelete = useCallback(async (noteId: string) => {
    setIsSubmitting(true);
    try {
      await deleteClientNote(noteId);
      onNotesUpdate(notes.filter(n => n.id !== noteId));
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Failed to delete note:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [notes, onNotesUpdate]);

  return (
    <div className="rounded-xl bg-surface-50 border border-surface-200 p-6">
      <h2 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
        <span>📝</span>
        Заметки о клиенте
      </h2>

      {/* Add new note */}
      <div className="mb-4">
        <textarea
          value={newNoteContent}
          onChange={(e) => setNewNoteContent(e.target.value)}
          placeholder="Добавить заметку о клиенте..."
          className="w-full px-4 py-3 rounded-lg border border-surface-200 bg-surface-100 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-500 resize-none"
          rows={3}
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={handleAddNote}
            disabled={!newNoteContent.trim() || isSubmitting}
            className="px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <span>➕</span>
            Добавить заметку
          </button>
        </div>
      </div>

      {/* Notes list */}
      {notes.length === 0 ? (
        <div className="text-center py-8 text-gray-500 animate-fade-in">
          <span className="text-4xl mb-3 block">📝</span>
          <p className="text-gray-400 mb-1">Нет заметок о клиенте</p>
          <p className="text-sm text-gray-500">Добавьте заметку о предпочтениях или особенностях</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div
              key={note.id}
              className="p-4 rounded-lg bg-surface-100 border border-surface-200"
            >
              {editingNoteId === note.id ? (
                /* Edit mode */
                <div>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-surface-200 bg-surface-50 text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent-500 resize-none"
                    rows={3}
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1.5 text-gray-400 hover:text-gray-200 transition-colors"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={!editContent.trim() || isSubmitting}
                      className="px-3 py-1.5 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors disabled:opacity-50"
                    >
                      Сохранить
                    </button>
                  </div>
                </div>
              ) : (
                /* View mode */
                <>
                  <p className="text-gray-200 whitespace-pre-wrap">{note.content}</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-surface-200">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>{note.author}</span>
                      <span>•</span>
                      <span>{formatDate(note.createdAt)}</span>
                      {note.updatedAt && (
                        <>
                          <span>•</span>
                          <span className="text-gray-600">изменено</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEdit(note)}
                        className="p-1.5 rounded hover:bg-surface-200 text-gray-500 hover:text-gray-300 transition-colors"
                        title="Редактировать"
                      >
                        ✏️
                      </button>
                      {deleteConfirmId === note.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(note.id)}
                            disabled={isSubmitting}
                            className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                          >
                            Удалить
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-1 text-xs text-gray-400 hover:text-gray-200 transition-colors"
                          >
                            Отмена
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(note.id)}
                          className="p-1.5 rounded hover:bg-surface-200 text-gray-500 hover:text-red-400 transition-colors"
                          title="Удалить"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ClientNotes;
