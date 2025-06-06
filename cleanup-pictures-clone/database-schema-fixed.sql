-- Updated Supabase Database Schema for IP Character Generation System
-- This version fixes the RLS policies for custom user authentication

-- Drop existing RLS policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can view own tasks" ON generation_tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON generation_tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON generation_tasks;
DROP POLICY IF EXISTS "Users can view own characters" ON user_ip_characters;
DROP POLICY IF EXISTS "Users can insert own characters" ON user_ip_characters;
DROP POLICY IF EXISTS "Users can update own characters" ON user_ip_characters;

-- For testing purposes, disable RLS temporarily or create permissive policies
-- Option 1: Disable RLS (for development/testing)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE generation_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_ip_characters DISABLE ROW LEVEL SECURITY;

-- Option 2: Create permissive policies (comment out the DISABLE commands above and use these)
-- CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "Allow all operations on generation_tasks" ON generation_tasks FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "Allow all operations on user_ip_characters" ON user_ip_characters FOR ALL USING (true) WITH CHECK (true);

-- Ensure UUID extension is enabled for proper UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create storage bucket for generated images (run this in Supabase dashboard or via SQL)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('generated-images', 'generated-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create permissive storage policies for testing
INSERT INTO storage.objects (bucket_id, name, owner, metadata)
SELECT 'generated-images', 'test.png', null, '{}'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM storage.objects WHERE bucket_id = 'generated-images' AND name = 'test.png'
);

-- Create storage policies
DROP POLICY IF EXISTS "Public can view generated images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;

CREATE POLICY "Public can view generated images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'generated-images');

CREATE POLICY "Anyone can upload to generated images" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'generated-images');

CREATE POLICY "Anyone can update generated images" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'generated-images');