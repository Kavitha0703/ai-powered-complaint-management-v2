import { supabase } from "./supabase";

export const getRooms = async () => {
  const { data, error } = await supabase.from('team_channels').select('*');
  if (error) {
     if (error.code === 'PGRST205') console.warn('Supabase DB missing team_channels schema');
     return null;
  }
  return data.map((c: any) => ({
    id: c.id,
    name: c.name,
    description: c.description || '',
    is_archived: c.status === 'archived',
    is_pinned: c.is_pinned,
    created_at: c.created_at,
    created_by: c.created_by,
    deleted_by_user: c.deleted_by_user || []
  }));
};

export const getMessages = async () => {
  const { data, error } = await supabase.from('team_messages').select('*').order('created_at', { ascending: true });
  if (error) return null;
  return data.map((m: any) => ({
    id: m.id,
    room_id: m.channel_id,
    sender_id: m.sender_id,
    sender_name: m.sender_name,
    text: m.text,
    created_at: m.created_at,
    time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    is_edited: m.is_edited,
    deleted_for: m.deleted_for || [],
    call_summary: m.call_summary,
    attachments: m.attachments,
    reply_to: m.reply_to,
    reactions: m.reactions || {},
    is_pinned: m.is_pinned,
    message_status: m.message_status || 'read',
    is_voice_note: m.is_voice_note,
    voice_duration: m.voice_duration,
    audio_url: m.audio_url
  }));
};

export const saveRoom = async (room: any) => {
  await supabase.from('team_channels').upsert({
    id: room.id,
    name: room.name,
    description: room.description,
    status: room.is_archived ? 'archived' : 'active',
    is_pinned: room.is_pinned || false,
    created_by: room.created_by,
    deleted_by_user: room.deleted_by_user || []
  }, { onConflict: 'id' });
};

export const deleteRoom = async (roomId: string) => {
  await supabase.from('team_channels').delete().eq('id', roomId);
};

export const saveMessage = async (msg: any) => {
  await supabase.from('team_messages').upsert({
    id: msg.id,
    channel_id: msg.room_id,
    sender_id: msg.sender_id,
    sender_name: msg.sender_name,
    text: msg.text,
    created_at: msg.created_at || new Date().toISOString(),
    is_edited: msg.is_edited || false,
    deleted_for: msg.deleted_for || [],
    call_summary: msg.call_summary,
    attachments: msg.attachments,
    reply_to: msg.reply_to,
    reactions: msg.reactions,
    is_pinned: msg.is_pinned || false,
    message_status: msg.message_status,
    is_voice_note: msg.is_voice_note,
    voice_duration: msg.voice_duration,
    audio_url: msg.audio_url
  }, { onConflict: 'id' });
};

export const deleteMessage = async (msgId: string) => {
  await supabase.from('team_messages').delete().eq('id', msgId);
};
