import re

with open('src/pages/AdminTeamChat.tsx', 'r') as f:
    code = f.read()

# Replace loadWorkspaceRooms
code = re.sub(
    r'const loadWorkspaceRooms = \(\) => \{.*?\};',
    '''const loadWorkspaceRooms = async () => {
    try {
      const { data, error } = await supabase.from('team_channels').select('*').neq('status', 'archived');
      if (error) {
         if (error.code === 'PGRST205') console.error("SCHEMA MISSING. Run supabase_team_chat.sql");
         return;
      }
      setRooms(data || []);
    } catch(e) {}
  };''',
    code,
    flags=re.DOTALL
)

# Replace saveRoomsToStorage
code = re.sub(
    r'const saveRoomsToStorage = \(updatedRooms: ChatRoom\[\]\) => \{.*?\};',
    '''const saveRoomsToStorage = async (updatedRooms: ChatRoom[]) => {
    // Deprecated for direct Supabase calls, keeping signature for safety if missed
  };''',
    code,
    flags=re.DOTALL
)

# Replace loadWorkspaceMessages
code = re.sub(
    r'const loadWorkspaceMessages = \(\) => \{.*?\};',
    '''const loadWorkspaceMessages = async () => {
    try {
      const { data, error } = await supabase.from('team_messages').select('*').order('created_at', { ascending: true });
      if (error) return;
      setMessages(data || []);
    } catch(e) {}
  };''',
    code,
    flags=re.DOTALL
)

with open('src/pages/AdminTeamChat.tsx', 'w') as f:
    f.write(code)
print("Initial replacements done")
