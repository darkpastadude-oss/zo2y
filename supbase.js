// supabase.js
import { createClient } from 'https://gfkhjbztayjyojsgdpgk.supabase.co'

const SUPABASE_URL = 'https://gfkhjbztayjyojsgdpgk.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma2hqYnp0YXlqeW9qc2dkcGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwOTYyNjQsImV4cCI6MjA3NTY3MjI2NH0.WUb2yDAwCeokdpWCPeH13FE8NhWF6G8e6ivTsgu6b2s'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
