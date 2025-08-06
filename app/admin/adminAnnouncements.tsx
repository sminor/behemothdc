'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabaseClient';
import Button from '@/components/Button';
import { FaPlus, FaTrash, FaSave, FaTimes, FaEye, FaEyeSlash } from 'react-icons/fa';

type Announcement = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  author?: string;
  page?: string[];
};

const availablePages = ['home', 'events', 'leagues', 'locations', 'stats'];

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [editingIds, setEditingIds] = useState<Set<string>>(new Set());
  const [editedDataMap, setEditedDataMap] = useState<Record<string, Partial<Announcement>>>({});
  const [showPreviewMap, setShowPreviewMap] = useState<Record<string, boolean>>({});
  const [authorName, setAuthorName] = useState<string>('');

  useEffect(() => {
    const fetchUserAndName = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id;

      if (userId) {
        const { data: userInfo, error } = await supabase
          .from('authorized_users')
          .select('name')
          .eq('id', userId)
          .single();

        if (!error && userInfo?.name) setAuthorName(userInfo.name);
      }
    };

    const fetchAnnouncements = async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) console.error('Error loading announcements:', error.message);
      else {
        const transformed = (data || []).map((a) => ({
          ...a,
          page: a.page ? a.page.split(',').map((s: string) => s.trim()) : [],
        }));
        setAnnouncements(transformed);
      }
    };

    fetchUserAndName();
    fetchAnnouncements();
  }, []);

  const handleEdit = (id: string) => {
    setEditingIds((prev) => new Set(prev).add(id));
    const announcement = announcements.find((a) => a.id === id);
    setEditedDataMap((prev) => ({ ...prev, [id]: { ...announcement } }));
    setShowPreviewMap((prev) => ({ ...prev, [id]: false }));
  };

  const handleChange = (id: string, field: keyof Announcement, value: string | string[]) => {
    setEditedDataMap((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const handlePageToggle = (id: string, page: string) => {
    setEditedDataMap((prev) => {
      const currentPages = prev[id]?.page || [];
      const updatedPages = currentPages.includes(page)
        ? currentPages.filter((p) => p !== page)
        : [...currentPages, page];
      return {
        ...prev,
        [id]: { ...prev[id], page: updatedPages },
      };
    });
  };

  const handleSave = async (id: string) => {
    const edited = editedDataMap[id];
    if (!edited.title || !edited.content) {
      alert('Title and content are required.');
      return;
    }

    const updatedData = {
      ...edited,
      author: authorName,
      created_at: new Date().toISOString(),
      page: (edited.page || []).join(','),
    };

    if (id.startsWith('new-')) {
      const { id: _, ...insertData } = updatedData;
      const { error } = await supabase.from('announcements').insert([insertData]);
      if (error) {
        console.error('Insert error:', error.message);
        return;
      }
    } else {
      const { error } = await supabase
        .from('announcements')
        .update(updatedData)
        .eq('id', id);
      if (error) {
        console.error('Update error:', error.message);
        return;
      }
    }

    const { data: refreshed, error: fetchError } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) console.error('Refresh error:', fetchError.message);
    else {
      const transformed = (refreshed || []).map((a) => ({
        ...a,
        page: a.page ? a.page.split(',').map((s: string) => s.trim()) : [],
      }));
      setAnnouncements(transformed);
    }

    setEditingIds((prev) => {
      const copy = new Set(prev);
      copy.delete(id);
      return copy;
    });

    setEditedDataMap((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });

    setShowPreviewMap((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
  };

  const handleCancel = (id: string) => {
    setEditingIds((prev) => {
      const copy = new Set(prev);
      copy.delete(id);
      return copy;
    });

    setEditedDataMap((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });

    setShowPreviewMap((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) {
      console.error('Delete error:', error.message);
      return;
    }

    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    setEditingIds((prev) => {
      const copy = new Set(prev);
      copy.delete(id);
      return copy;
    });
    setEditedDataMap((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
    setShowPreviewMap((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
  };

  const handleAddNew = () => {
    const newId = `new-${Date.now()}`;
    setEditingIds((prev) => new Set(prev).add(newId));
    setEditedDataMap((prev) => ({
      ...prev,
      [newId]: {
        id: newId,
        title: '',
        content: '',
        author: authorName,
        page: [],
      },
    }));
    setShowPreviewMap((prev) => ({ ...prev, [newId]: false }));
  };

  const isEditing = (id: string) => editingIds.has(id);
  const getEdited = (id: string) =>
    isEditing(id) ? editedDataMap[id] : announcements.find((a) => a.id === id)!;

  return (
    <section className="p-4">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
        <h2 className="text-xl font-semibold">Manage Announcements</h2>
        <Button className="w-auto" onClick={handleAddNew} icon={<FaPlus />} iconPosition="left">
          Add New Announcement
        </Button>
      </div>

      <div className="space-y-6">
        {announcements.map((a) => {
          const id = a.id;
          const announcement = getEdited(id);
          const active = announcement.page && announcement.page.length > 0;
          const preview = showPreviewMap[id] ?? false;

          return (
            <div
              key={id}
              className="bg-[var(--color11)] p-4 rounded-lg border-l-4 border-[var(--card-highlight)] shadow-md"
            >
              {!isEditing(id) ? (
                <div onClick={() => handleEdit(id)} className="cursor-pointer space-y-1">
                  <h3 className="text-lg font-semibold">{announcement.title}</h3>
                  <p className="text-sm text-[var(--card-text)]">
                    {new Date(announcement.created_at ?? '').toLocaleString()} - {announcement.author}
                  </p>
                  {active && (
                    <span
                      className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded cursor-help"
                      title={`Visible on: ${announcement.page?.join(', ')}`}
                    >
                      Active
                    </span>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[var(--card-text)] mb-1">Title</label>
                    <input
                      type="text"
                      value={announcement.title}
                      onChange={(e) => handleChange(id, 'title', e.target.value)}
                      className="w-full p-2 rounded-md border border-[var(--form-border)] bg-[var(--form-background)] text-[var(--select-text)] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[var(--card-text)] mb-1">Content</label>
                    {preview ? (
                      <div
                        className="prose prose-invert max-w-none p-4 bg-[var(--form-background)] rounded-md border border-[var(--form-border)]"
                        dangerouslySetInnerHTML={{ __html: announcement.content || '' }}
                      />
                    ) : (
                      <textarea
                        value={announcement.content}
                        onChange={(e) => handleChange(id, 'content', e.target.value)}
                        className="w-full p-2 rounded-md border border-[var(--form-border)] bg-[var(--form-background)] text-[var(--select-text)] focus:outline-none resize-none overflow-hidden"
                        ref={(el) => {
                          if (el) {
                            el.style.height = 'auto';
                            el.style.height = `${el.scrollHeight}px`;
                          }
                        }}
                        onInput={(e) => {
                          const target = e.target as HTMLTextAreaElement;
                          target.style.height = 'auto';
                          target.style.height = `${target.scrollHeight}px`;
                        }}
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-[var(--card-text)] mb-1">Display On Pages</label>
                    <div className="flex flex-wrap gap-4">
                      {availablePages.map((page) => (
                        <label key={page} className="flex items-center gap-2 text-[var(--card-text)]">
                          <input
                            type="checkbox"
                            checked={announcement.page?.includes(page) || false}
                            onChange={() => handlePageToggle(id, page)}
                            className="h-5 w-5 border border-[var(--form-border)] rounded accent-[var(--form-checkbox-checked)] focus:outline-none"
                          />
                          {page.charAt(0).toUpperCase() + page.slice(1)}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 flex-wrap mt-2">
                    <Button
                      className="w-auto px-4 py-2 text-sm"
                      onClick={() => setShowPreviewMap((prev) => ({ ...prev, [id]: !preview }))}
                      icon={preview ? <FaEyeSlash /> : <FaEye />}
                      iconPosition="left"
                    >
                      {preview ? 'Hide Preview' : 'Preview'}
                    </Button>
                    <Button
                      className="w-auto px-4 py-2 text-sm"
                      onClick={() => handleSave(id)}
                      icon={<FaSave />}
                      iconPosition="left"
                    >
                      Save
                    </Button>
                    <Button
                      className="w-auto px-4 py-2 text-sm"
                      onClick={() => handleCancel(id)}
                      icon={<FaTimes />}
                      iconPosition="left"
                    >
                      Cancel
                    </Button>
                    {!id.startsWith('new-') && (
                      <Button
                        className="w-auto px-4 py-2 text-sm bg-[var(--color5)] text-white"
                        onClick={() => handleDelete(id)}
                        icon={<FaTrash />}
                        iconPosition="left"
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
