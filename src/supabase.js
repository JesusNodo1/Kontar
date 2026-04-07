import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const supabaseUrl = 'https://jeupnfxzawgrtddnhvij.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpldXBuZnh6YXdncnRkZG5odmlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0ODY5NTgsImV4cCI6MjA5MTA2Mjk1OH0.qmABLeL-3iJ3f6l7GdDnEshweuUtSM5YRSTSzby9N0g'

export const supabase = createClient(supabaseUrl, supabaseKey)
