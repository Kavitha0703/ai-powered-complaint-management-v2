import { supabase } from './supabase';

export interface ChatChannel {
  id: string;
  name: string;
  type: string;
  created_by: string;
  created_at: string;
  status: string;
}

export interface ChatChannelMember {
  channel_id: string;
  user_id: string;
  role: string;
  is_hidden: boolean;
  last_read_at: string;
  unread_count?: number;
}

export interface ChatMessage {
  id: string;
  channel_id: string;
  sender_id: string;
  sender_name: string;
  text: string;
  created_at: string;
  is_edited?: boolean;
  is_pinned?: boolean;
  deleted_for?: string[];
  message_status?: "sent" | "delivered" | "read";
  is_voice_note?: boolean;
  voice_duration?: number;
  audio_url?: string;
  call_summary?: any;
  attachments?: any;
  reply_to?: any;
  reactions?: any;
}

export async function fetchChannels(userId: string) {
  const { data, error } = await supabase
    .from('team_channels')
    .select(`
      *,
      members:team_channel_members(*)
    `)
    .eq('status', 'active');
  
  if (error) {
    console.error("fetchChannels error", error);
    return [];
  }
  
  // Filter where user is member and not hidden
  return data.filter(c => {
    const member = c.members.find((m: any) => m.user_id === userId);
    return member && !member.is_hidden;
  });
}

export async function fetchMessages(channelId: string) {
  const { data, error } = await supabase
    .from('team_messages')
    .select('*')
    .eq('channel_id', channelId)
    .order('created_at', { ascending: true });
    
  if (error) {
    console.error("fetchMessages error", error);
    return [];
  }
  return data;
}

export async function sendMessage(msg: any) {
  const { data, error } = await supabase.from('team_messages').insert([msg]).select();
  if (error) throw error;
  return data[0];
}

export async function updateMessage(msgId: string, updates: any) {
  const { data, error } = await supabase.from('team_messages').update(updates).eq('id', msgId).select();
  if (error) throw error;
  return data ? data[0] : null;
}

export async function hideChannel(channelId: string, userId: string) {
  await supabase.from('team_channel_members').update({ is_hidden: true }).eq('channel_id', channelId).eq('user_id', userId);
}

export async function markChannelRead(channelId: string, userId: string) {
  await supabase.from('team_channel_members').update({ last_read_at: new Date().toISOString() }).eq('channel_id', channelId).eq('user_id', userId);
}
