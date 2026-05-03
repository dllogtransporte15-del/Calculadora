import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://amftabbpdyjbnjmvalgx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtZnRhYmJwZHlqYm5qbXZhbGd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3MjEyNDMsImV4cCI6MjA5MjI5NzI0M30.8vIWJW1AdOmsynV-LVRKyZelQGOc5RdC7i1riBxA4j4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
