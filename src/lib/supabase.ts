import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

const checkIsPlaceholder = () => {
  if (!supabaseUrl || !supabasePublishableKey) return true;
  const urlLower = supabaseUrl.toLowerCase();
  const keyLower = supabasePublishableKey.toLowerCase();
  
  if (urlLower.includes('placeholder') || keyLower.includes('placeholder')) return true;
  if (urlLower.includes('your_') || urlLower.includes('your-') || urlLower.includes('yoursupabase')) return true;
  if (keyLower.includes('your_') || keyLower.includes('your-') || keyLower.includes('yoursupabase')) return true;
  if (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) return true;
  
  return false;
};

const isPlaceholder = checkIsPlaceholder();

// We list admin emails here to coordinate the fallback database authorization roles.
const BACKEND_ADMIN_EMAILS = ['kalenhitsumi.dev@gmail.com', 'testdemo@admin.local', 'nasikakavitha@gmail.com'];

class MockQueryBuilder {
  private tableName: string;
  private filters: Array<(item: any) => boolean> = [];
  private orderColumn: string | null = null;
  private orderAscending: boolean = false;
  private limitCount: number | null = null;
  private operation: 'select' | 'insert' | 'update' | 'upsert' | 'delete' = 'select';
  private opPayload: any = null;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(columnsStr?: string) {
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push((item: any) => {
      const itemVal = item[column];
      if (itemVal === undefined) return true;
      return String(itemVal) === String(value);
    });
    return this;
  }

  in(column: string, values: any[]) {
    this.filters.push((item: any) => {
      const itemVal = item[column];
      if (itemVal === undefined) return true;
      return values.some(val => String(itemVal) === String(val));
    });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderColumn = column;
    this.orderAscending = options?.ascending ?? false;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  private getData() {
    const key = `dcms_sim_${this.tableName}`;
    let data = JSON.parse(localStorage.getItem(key) || '[]');
    
    if (data.length === 0) {
      if (this.tableName === 'notices') {
        data = [
          {
            id: 'notice_101',
            title: 'Scheduled System Maintenance: Workstation Cluster B-12',
            message: 'Our IT Infrastructure operations staff will run updates on B-12 workstation routers this Sunday starting at 02:00 UTC. Expect short terminal disconnects.',
            created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
            category: 'Maintenance',
            importance: 'Featured',
            is_urgent: false
          },
          {
            id: 'notice_102',
            title: 'Mandatory Remote Access Security Audit Protocols',
            message: 'Pursuant to our quarterly workspace asset safety protocols, all employees connecting off-premises must use Cisco VPN integrated with Okta double identity parameters.',
            created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
            category: 'Policy Change',
            importance: 'Standard',
            is_urgent: true
          },
          {
            id: 'notice_103',
            title: 'Employee Social Fund Raising & Sports Registration',
            message: 'Registered employees and staff are invited to sign up for our upcoming Department football match. Registration forms are accessible at the HR Operations counter.',
            created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
            category: 'Company Event',
            importance: 'Standard',
            is_urgent: false
          }
        ];
        localStorage.setItem(key, JSON.stringify(data));
      }
    }
    return data;
  }

  private saveData(data: any[]) {
    localStorage.setItem(`dcms_sim_${this.tableName}`, JSON.stringify(data));
  }

  insert(rows: any[]) {
    this.operation = 'insert';
    this.opPayload = rows;
    return this;
  }

  upsert(row: any) {
    this.operation = 'upsert';
    this.opPayload = row;
    return this;
  }

  update(fields: any) {
    this.operation = 'update';
    this.opPayload = fields;
    return this;
  }

  delete() {
    this.operation = 'delete';
    return this;
  }

  async then(onfulfilled?: (value: { data: any | null; error: any }) => any) {
    try {
      let data = this.getData();
      let resultData: any = null;

      if (this.operation === 'select') {
        // Apply filters
        for (const filter of this.filters) {
          data = data.filter(filter);
        }

        // Auto-seeds one nice ticket so that user gets immediate visual data in 'My Tickets'
        if (this.tableName === 'tickets' && data.length === 0) {
          const sessionUser = JSON.parse(localStorage.getItem('dcms_sim_session') || 'null');
          if (sessionUser) {
            data = [
              {
                id: 't_seed_103',
                user_id: sessionUser.id,
                issue_type: 'IT Support',
                severity: 'Medium',
                status: 'Pending',
                description: JSON.stringify({
                  title: 'Office Workstation Keyboard Lag',
                  description: 'Several keys on my assigned keyboard lag intermittently during operations. Reconnected USB hub but discrepancy persists. Replaced batteries without success.',
                  anonymous: false
                }),
                created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
                isViewedByAdmin: false
              }
            ];
            const allTickets = JSON.parse(localStorage.getItem('dcms_sim_tickets') || '[]');
            allTickets.push(...data);
            localStorage.setItem('dcms_sim_tickets', JSON.stringify(allTickets));
          }
        }

        // Simulate a LEFT JOIN with the simulated users table
        if (this.tableName === 'tickets') {
          const simUsers = JSON.parse(localStorage.getItem('dcms_sim_users') || '[]');
          data = data.map((t: any) => {
            const userObj = simUsers.find((u: any) => u.id === t.user_id) || {
              name: 'Kiki Employee',
              email: 'kiki@workplacehub.com'
            };
            return {
              ...t,
              users: userObj
            };
          });
        }

        // Apply sorting
        if (this.orderColumn) {
          const col = this.orderColumn;
          const asc = this.orderAscending;
          data.sort((a, b) => {
            if (a[col] < b[col]) return asc ? -1 : 1;
            if (a[col] > b[col]) return asc ? 1 : -1;
            return 0;
          });
        }

        // Apply limit
        if (this.limitCount !== null) {
          data = data.slice(0, this.limitCount);
        }

        resultData = data;
      } else if (this.operation === 'insert') {
        const rows = this.opPayload || [];
        const formatted = rows.map((r: any) => ({
          ...r,
          id: r.id || 't_' + Math.random().toString(36).substring(2, 11),
          created_at: r.created_at || new Date().toISOString(),
          isViewedByAdmin: r.isViewedByAdmin ?? false,
          status: r.status || 'Pending'
        }));

        const combined = [...formatted, ...data];
        this.saveData(combined);
        resultData = formatted;
      } else if (this.operation === 'upsert') {
        const rows = Array.isArray(this.opPayload) ? this.opPayload : [this.opPayload];
        for (const r of rows) {
          const idx = data.findIndex((item: any) => item.id === r.id);
          if (idx > -1) {
            data[idx] = { ...data[idx], ...r };
          } else {
            data.push(r);
          }
        }
        this.saveData(data);
        resultData = rows;
      } else if (this.operation === 'update') {
        const fields = this.opPayload;
        const updatedList = data.map((item: any) => {
          let matches = true;
          for (const filter of this.filters) {
            if (!filter(item)) matches = false;
          }
          if (matches) {
            return { ...item, ...fields };
          }
          return item;
        });

        this.saveData(updatedList);
        resultData = [fields]; // Emulate returned row array for destructured array expectations e.g. data[0]
      } else if (this.operation === 'delete') {
        const deletedList = data.filter((item: any) => {
          let matches = true;
          for (const filter of this.filters) {
            if (!filter(item)) matches = false;
          }
          return !matches;
        });

        this.saveData(deletedList);
        resultData = null;
      }

      const res = { data: resultData, error: null };
      if (onfulfilled) return Promise.resolve(onfulfilled(res));
      return res;
    } catch (err: any) {
      const res = { data: null, error: err };
      if (onfulfilled) return Promise.resolve(onfulfilled(res));
      return res;
    }
  }
}

// Simulated Client Mock wrapper
const mockSupabaseClient = {
  auth: {
    listeners: [] as Array<any>,

    async getSession() {
      const savedSession = localStorage.getItem('dcms_sim_session');
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        return { data: { session: { user: parsed, access_token: 'mock_token_123' } }, error: null };
      }
      return { data: { session: null }, error: null };
    },

    onAuthStateChange(callback: any) {
      this.listeners.push(callback);
      const savedSession = localStorage.getItem('dcms_sim_session');
      const mockUser = savedSession ? JSON.parse(savedSession) : null;
      callback('SIGNED_IN', mockUser ? { user: mockUser, access_token: 'mock_token' } : null);
      return { data: { subscription: { unsubscribe: () => {
        this.listeners = this.listeners.filter(l => l !== callback);
      } } } };
    },

    async signInWithPassword({ email, password }: any) {
      const cleanEmail = email.trim().toLowerCase();
      const name = cleanEmail.split('@')[0];
      
      const invitesData = localStorage.getItem("dcms_admin_invites_v1");
      const dynamicInvites = invitesData ? JSON.parse(invitesData) : [];
      const hasDynamicAdmin = dynamicInvites.some((i: any) => i.email.toLowerCase() === cleanEmail && (i.status === "Active" || i.status === "Pending"));
      const isAdmin = BACKEND_ADMIN_EMAILS.map(e => e.toLowerCase()).includes(cleanEmail) || hasDynamicAdmin;
      
      const userObj = {
        id: 'usr_' + name,
        email: cleanEmail,
        user_metadata: { name: name, full_name: name },
        role: isAdmin ? 'admin' : 'user'
      };

      localStorage.setItem('dcms_sim_session', JSON.stringify(userObj));
      
      // Save user to simulated user lists
      const simUsers = JSON.parse(localStorage.getItem('dcms_sim_users') || '[]');
      if (!simUsers.some((u: any) => u.email === cleanEmail)) {
        simUsers.push({ id: userObj.id, email: userObj.email, name: userObj.user_metadata.full_name });
        localStorage.setItem('dcms_sim_users', JSON.stringify(simUsers));
      }

      this.listeners.forEach(l => l('SIGNED_IN', { user: userObj, access_token: 'mock_token' }));
      return { data: { user: userObj, session: { user: userObj } }, error: null };
    },

    async signUp({ email, password, options }: any) {
      const cleanEmail = email.trim().toLowerCase();
      const userName = options?.data?.name || cleanEmail.split('@')[0];
      
      const invitesData = localStorage.getItem("dcms_admin_invites_v1");
      const dynamicInvites = invitesData ? JSON.parse(invitesData) : [];
      const hasDynamicAdmin = dynamicInvites.some((i: any) => i.email.toLowerCase() === cleanEmail && (i.status === "Active" || i.status === "Pending"));
      const isAdmin = BACKEND_ADMIN_EMAILS.map(e => e.toLowerCase()).includes(cleanEmail) || hasDynamicAdmin;

      const userObj = {
        id: 'usr_' + cleanEmail.split('@')[0],
        email: cleanEmail,
        user_metadata: { name: userName, full_name: userName },
        role: isAdmin ? 'admin' : 'user'
      };

      // Save user to simulated users
      const simUsers = JSON.parse(localStorage.getItem('dcms_sim_users') || '[]');
      if (!simUsers.some((u: any) => u.email === cleanEmail)) {
        simUsers.push({ id: userObj.id, email: userObj.email, name: userName });
        localStorage.setItem('dcms_sim_users', JSON.stringify(simUsers));
      }

      return { data: { user: userObj, session: null }, error: null };
    },

    async signOut() {
      localStorage.removeItem('dcms_sim_session');
      this.listeners.forEach(l => l('SIGNED_OUT', null));
      return { error: null };
    },

    async resetPasswordForEmail(email: string) {
      return { data: {}, error: null };
    }
  },

  from(tableName: string) {
    return new MockQueryBuilder(tableName);
  }
};

export const supabase = isPlaceholder ? (mockSupabaseClient as any) : createClient(supabaseUrl, supabasePublishableKey);
