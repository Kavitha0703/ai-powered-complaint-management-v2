const fs = require('fs');
let code = fs.readFileSync('api/_app.ts', 'utf8');

const cacheDeclaration = `const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
let globalCache: any = {
  notices: null,
  noticesFetchedAt: 0,
  feedback: null,
  feedbackFetchedAt: 0
};
`;

if (!code.includes('CACHE_TTL_MS')) {
  code = code.replace(
    'const app = express();',
    cacheDeclaration + 'const app = express();'
  );
}

const dbFetchRegex = /if \(supabase\) {[\s\S]*?console\.timeEnd\("Parallel DB Fetch"\);/;

const newDbFetch = `if (supabase) {
      const now = Date.now();
      
      if (intent === "user_query" && systemContext?.userProfile?.id) {
        const fetchPromises = [
          supabase.from("tickets").select("id, issue_type, severity, description, status, created_at").eq("user_id", systemContext.userProfile.id).order("created_at", { ascending: false }).limit(10)
        ];
        
        if (!globalCache.notices || now - globalCache.noticesFetchedAt > CACHE_TTL_MS) {
          fetchPromises.push(supabase.from("notices").select("id, title, message, created_at").order("created_at", { ascending: false }).limit(5));
        } else {
          fetchPromises.push(Promise.resolve({ data: globalCache.notices }));
        }

        const [ticketsRes, noticesRes] = await Promise.all(fetchPromises);
        fetchedTickets = ticketsRes.data || [];
        fetchedNotices = noticesRes.data || [];
        
        if (now - globalCache.noticesFetchedAt > CACHE_TTL_MS && noticesRes.data) {
          globalCache.notices = noticesRes.data;
          globalCache.noticesFetchedAt = now;
        }
      } else if (intent === "admin_query" || intent === "admin_analytics") {
        const limit = intent === "admin_analytics" ? 100 : 20;
        const fetchPromises = [
          supabase.from("tickets").select("id, issue_type, severity, description, status, created_at").order("created_at", { ascending: false }).limit(limit)
        ];

        if (!globalCache.notices || now - globalCache.noticesFetchedAt > CACHE_TTL_MS) {
          fetchPromises.push(supabase.from("notices").select("id, title, message, created_at").order("created_at", { ascending: false }).limit(5));
        } else {
          fetchPromises.push(Promise.resolve({ data: globalCache.notices }));
        }

        if (!globalCache.feedback || now - globalCache.feedbackFetchedAt > CACHE_TTL_MS) {
          fetchPromises.push(supabase.from("feedback").select("id, rating, message, created_at").order("created_at", { ascending: false }).limit(10));
        } else {
          fetchPromises.push(Promise.resolve({ data: globalCache.feedback }));
        }

        const [ticketsRes, noticesRes, feedbackRes] = await Promise.all(fetchPromises);
        fetchedTickets = ticketsRes.data || [];
        fetchedNotices = noticesRes.data || [];
        fetchedFeedback = feedbackRes.data || [];
        
        if (now - globalCache.noticesFetchedAt > CACHE_TTL_MS && noticesRes.data) {
          globalCache.notices = noticesRes.data;
          globalCache.noticesFetchedAt = now;
        }
        if (now - globalCache.feedbackFetchedAt > CACHE_TTL_MS && feedbackRes.data) {
          globalCache.feedback = feedbackRes.data;
          globalCache.feedbackFetchedAt = now;
        }
        
        dbStats.totalTickets = fetchedTickets.length;
        dbStats.pendingCount = fetchedTickets.filter((c: any) => c.status === "Pending").length;
        dbStats.inProgressCount = fetchedTickets.filter((c: any) => c.status === "In Progress").length;
        dbStats.resolvedCount = fetchedTickets.filter((c: any) => c.status === "Resolved").length;
      }
    }
    console.timeEnd("Parallel DB Fetch");`;

code = code.replace(dbFetchRegex, newDbFetch);
fs.writeFileSync('api/_app.ts', code);
console.log("Patched caching in api/_app.ts");
