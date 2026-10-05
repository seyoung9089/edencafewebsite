import { createClient } from '@supabase/supabase-js'

// Supabase publishable (anon) keys are designed to be included in browser apps.
// Row Level Security in supabase/migrations protects each customer's data.
const url = import.meta.env.VITE_SUPABASE_URL || 'https://qdkvclpapsasedrvhkvx.supabase.co'
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFka3ZjbHBhcHNhc2VkcnZoa3Z4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTExOTExNzcsImV4cCI6MjEwNjc2NzE3N30.makLgmDZCBpMWZpglBHiWuYAXXvtEg5yK5xGW5JncFY'

export const supabase = createClient(url, key, {
  auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
})
