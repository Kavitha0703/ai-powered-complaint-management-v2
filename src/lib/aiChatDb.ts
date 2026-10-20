import { supabase } from "./supabase";

export interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: number;
  suggestedCategory?: string;
  suggestedSeverity?: string;
  quickActions?: string[];
  suggestedQueries?: string[];
  file?: {
    name: string;
    type: string;
    size: number;
    extractedText?: string;
  };
  physicalLocation?: any;
  structuredData?: any;
  detectedLanguage?: string;
  originalComplaint?: string;
  translatedComplaint?: string;
  aiAnalysis?: any;
}

export interface ChatThread {
  id: string;
  title: string;
  timestamp: number;
  is_pinned?: boolean;
  messages: ChatMessage[];
}

// Track whether custom ai_conversations table exists in the current Supabase schema cache
let hasAiConvosTable: boolean | null = null;

async function checkAiConvosTableSupport(): Promise<boolean> {
  if (hasAiConvosTable !== null) return hasAiConvosTable;
  try {
    const { error } = await supabase.from("ai_conversations").select("id").limit(1);
    if (error && (error.code === "PGRST205" || error.message?.includes("schema cache"))) {
      hasAiConvosTable = false;
    } else {
      hasAiConvosTable = true;
    }
  } catch {
    hasAiConvosTable = false;
  }
  return hasAiConvosTable;
}

/**
 * Fetch all conversations for the authenticated user, ordered by creation/update time (newest first).
 */
export async function fetchUserConversations(userId: string): Promise<ChatThread[]> {
  if (!userId) return [];

  const useDedicated = await checkAiConvosTableSupport();

  try {
    if (useDedicated) {
      const { data: convos, error } = await supabase
        .from("ai_conversations")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!convos || convos.length === 0) return [];

      return convos.map((c: any) => ({
        id: c.id,
        title: c.title || "Conversation",
        timestamp: new Date(c.created_at || c.updated_at || Date.now()).getTime(),
        is_pinned: !!c.is_pinned,
        messages: []
      }));
    } else {
      // Authoritative Supabase persistence using team_channels filtered by user & ai_assistant
      const { data: channels, error } = await supabase
        .from("team_channels")
        .select("*")
        .eq("created_by", userId)
        .eq("description", "ai_assistant")
        .neq("status", "archived")
        .order("created_at", { ascending: false });

      if (error) {
        if (error.code !== "PGRST205") console.warn("fetchUserConversations error:", error.message);
        return [];
      }

      if (!channels || channels.length === 0) return [];

      return channels.map((c: any) => ({
        id: c.id,
        title: c.name || "Conversation",
        timestamp: new Date(c.created_at || Date.now()).getTime(),
        is_pinned: !!c.is_pinned,
        messages: []
      }));
    }
  } catch (err: any) {
    console.warn("fetchUserConversations fallback:", err?.message || err);
    return [];
  }
}

/**
 * Fetch complete message history for a specific conversation in chronological order (oldest first).
 */
export async function fetchConversationMessages(conversationId: string): Promise<ChatMessage[]> {
  if (!conversationId) return [];

  const useDedicated = await checkAiConvosTableSupport();

  try {
    if (useDedicated) {
      const { data: msgs, error } = await supabase
        .from("ai_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      if (!msgs || msgs.length === 0) return [];

      return msgs.map((m: any) => {
        let parsed: any = {};
        try {
          parsed = typeof m.content === "string" ? JSON.parse(m.content) : m.content;
        } catch {
          parsed = { text: m.content };
        }
        return {
          id: m.id,
          sender: m.role === "assistant" || m.role === "model" ? "assistant" : "user",
          text: parsed.text || m.content || "",
          timestamp: new Date(m.created_at || Date.now()).getTime(),
          suggestedCategory: parsed.suggestedCategory,
          suggestedSeverity: parsed.suggestedSeverity,
          quickActions: parsed.quickActions,
          suggestedQueries: parsed.suggestedQueries,
          file: parsed.file,
          physicalLocation: parsed.physicalLocation,
          structuredData: parsed.structuredData,
          detectedLanguage: parsed.detectedLanguage,
          originalComplaint: parsed.originalComplaint,
          translatedComplaint: parsed.translatedComplaint,
          aiAnalysis: parsed.aiAnalysis
        };
      });
    } else {
      // Authoritative Supabase persistence using team_messages
      const { data: msgs, error } = await supabase
        .from("team_messages")
        .select("*")
        .eq("channel_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) {
        if (error.code !== "PGRST205") console.warn("fetchConversationMessages error:", error.message);
        return [];
      }

      if (!msgs || msgs.length === 0) return [];

      return msgs.map((m: any) => {
        const meta = m.attachments || {};
        return {
          id: m.id,
          sender: (m.sender_id === "assistant" || m.sender_name === "Workplace Hub AI Assistant") ? "assistant" : "user",
          text: m.text || "",
          timestamp: new Date(m.created_at || Date.now()).getTime(),
          suggestedCategory: meta.suggestedCategory,
          suggestedSeverity: meta.suggestedSeverity,
          quickActions: meta.quickActions,
          suggestedQueries: meta.suggestedQueries,
          file: meta.file,
          physicalLocation: meta.physicalLocation,
          structuredData: meta.structuredData,
          detectedLanguage: meta.detectedLanguage,
          originalComplaint: meta.originalComplaint,
          translatedComplaint: meta.translatedComplaint,
          aiAnalysis: meta.aiAnalysis
        };
      });
    }
  } catch (err: any) {
    console.warn("fetchConversationMessages fallback:", err?.message || err);
    return [];
  }
}

/**
 * Save or update a conversation in Supabase
 */
export async function saveConversation(
  conversation: { id: string; title: string; is_pinned?: boolean; timestamp: number },
  userId: string,
  isAdmin: boolean = false
): Promise<void> {
  if (!conversation.id || !userId) return;

  const useDedicated = await checkAiConvosTableSupport();

  try {
    if (useDedicated) {
      await supabase.from("ai_conversations").upsert({
        id: conversation.id,
        user_id: userId,
        title: conversation.title,
        is_pinned: !!conversation.is_pinned,
        is_admin_record: isAdmin,
        created_at: new Date(conversation.timestamp).toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: "id" });
    } else {
      await supabase.from("team_channels").upsert({
        id: conversation.id,
        name: conversation.title,
        description: "ai_assistant",
        created_by: userId,
        status: "active",
        is_pinned: !!conversation.is_pinned,
        created_at: new Date(conversation.timestamp).toISOString()
      }, { onConflict: "id" });
    }
  } catch (err: any) {
    console.warn("saveConversation DB error:", err?.message || err);
  }
}

/**
 * Save a single message to Supabase
 */
export async function saveMessage(
  msg: ChatMessage,
  conversationId: string,
  userId: string,
  userName: string = "User"
): Promise<void> {
  if (!msg.id || !conversationId) return;

  const useDedicated = await checkAiConvosTableSupport();

  try {
    if (useDedicated) {
      const contentPayload = {
        text: msg.text,
        suggestedCategory: msg.suggestedCategory,
        suggestedSeverity: msg.suggestedSeverity,
        quickActions: msg.quickActions,
        suggestedQueries: msg.suggestedQueries,
        file: msg.file,
        physicalLocation: msg.physicalLocation,
        structuredData: msg.structuredData,
        detectedLanguage: msg.detectedLanguage,
        originalComplaint: msg.originalComplaint,
        translatedComplaint: msg.translatedComplaint,
        aiAnalysis: msg.aiAnalysis
      };

      await supabase.from("ai_messages").upsert({
        id: msg.id,
        conversation_id: conversationId,
        role: msg.sender,
        content: JSON.stringify(contentPayload),
        created_at: new Date(msg.timestamp || Date.now()).toISOString()
      }, { onConflict: "id" });
    } else {
      const attachments = {
        suggestedCategory: msg.suggestedCategory,
        suggestedSeverity: msg.suggestedSeverity,
        quickActions: msg.quickActions,
        suggestedQueries: msg.suggestedQueries,
        file: msg.file,
        physicalLocation: msg.physicalLocation,
        structuredData: msg.structuredData,
        detectedLanguage: msg.detectedLanguage,
        originalComplaint: msg.originalComplaint,
        translatedComplaint: msg.translatedComplaint,
        aiAnalysis: msg.aiAnalysis
      };

      await supabase.from("team_messages").upsert({
        id: msg.id,
        channel_id: conversationId,
        sender_id: msg.sender === "assistant" ? "assistant" : userId,
        sender_name: msg.sender === "assistant" ? "Workplace Hub AI Assistant" : userName,
        text: msg.text || "",
        created_at: new Date(msg.timestamp || Date.now()).toISOString(),
        is_edited: false,
        is_pinned: false,
        message_status: "read",
        attachments
      }, { onConflict: "id" });
    }
  } catch (err: any) {
    console.warn("saveMessage DB error:", err?.message || err);
  }
}

/**
 * Update conversation title in the database
 */
export async function updateConversationTitle(conversationId: string, newTitle: string): Promise<void> {
  if (!conversationId || !newTitle) return;

  const useDedicated = await checkAiConvosTableSupport();

  try {
    if (useDedicated) {
      await supabase
        .from("ai_conversations")
        .update({ title: newTitle, updated_at: new Date().toISOString() })
        .eq("id", conversationId);
    } else {
      await supabase
        .from("team_channels")
        .update({ name: newTitle })
        .eq("id", conversationId);
    }
  } catch (err: any) {
    console.warn("updateConversationTitle error:", err?.message || err);
  }
}

/**
 * Update conversation pin status in the database
 */
export async function updateConversationPin(conversationId: string, isPinned: boolean): Promise<void> {
  if (!conversationId) return;

  const useDedicated = await checkAiConvosTableSupport();

  try {
    if (useDedicated) {
      await supabase
        .from("ai_conversations")
        .update({ is_pinned: isPinned, updated_at: new Date().toISOString() })
        .eq("id", conversationId);
    } else {
      await supabase
        .from("team_channels")
        .update({ is_pinned: isPinned })
        .eq("id", conversationId);
    }
  } catch (err: any) {
    console.warn("updateConversationPin error:", err?.message || err);
  }
}

/**
 * Delete a conversation and all its messages from the database
 */
export async function deleteConversation(conversationId: string): Promise<void> {
  if (!conversationId) return;

  const useDedicated = await checkAiConvosTableSupport();

  try {
    if (useDedicated) {
      await supabase.from("ai_messages").delete().eq("conversation_id", conversationId);
      await supabase.from("ai_conversations").delete().eq("id", conversationId);
    } else {
      await supabase.from("team_messages").delete().eq("channel_id", conversationId);
      await supabase.from("team_channels").delete().eq("id", conversationId);
    }
  } catch (err: any) {
    console.warn("deleteConversation error:", err?.message || err);
  }
}
