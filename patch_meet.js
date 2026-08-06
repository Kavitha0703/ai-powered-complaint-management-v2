const fs = require('fs');
let code = fs.readFileSync('src/lib/google/meet.ts', 'utf8');

const importSupabase = `import { supabase } from "../../supabase.ts";\n`;

// Add getSupabaseProviderToken
const getSupabaseProviderToken = `
export async function getSupabaseProviderToken(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.provider_token) {
      return session.provider_token;
    }
  } catch (e) {
    console.warn("Failed to get supabase session", e);
  }
  return null;
}
`;

code = importSupabase + code;
code = code.replace('export async function createGoogleMeet(title?: string, explicitToken?: string): Promise<string | null> {', getSupabaseProviderToken + '\nexport async function createGoogleMeet(title?: string, explicitToken?: string): Promise<string | null> {');

code = code.replace('const accessToken = explicitToken || getStoredGoogleToken();', 'const accessToken = explicitToken || getStoredGoogleToken() || await getSupabaseProviderToken();');

fs.writeFileSync('src/lib/google/meet.ts', code);
