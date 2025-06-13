-- Supabase Migration Script: Custom Users to Auth Users
-- This script migrates from custom users table to Supabase Auth
-- 
-- WARNING: This migration will modify your database structure
-- Please backup your data before running this script
--
-- Steps to apply this migration:
-- 1. Backup your existing data
-- 2. Run this migration script in Supabase SQL editor
-- 3. Update your application code to use new auth system
-- 4. Test thoroughly before deploying to production

-- Step 1: Create temporary table to store old user data (if needed for migration)
CREATE TABLE IF NOT EXISTS temp_old_users AS
SELECT * FROM users WHERE EXISTS (SELECT 1 FROM users LIMIT 1);

-- Step 2: Drop old foreign key constraints
ALTER TABLE IF EXISTS generation_tasks DROP CONSTRAINT IF EXISTS generation_tasks_user_id_fkey;
ALTER TABLE IF EXISTS user_ip_characters DROP CONSTRAINT IF EXISTS user_ip_characters_user_id_fkey;

-- Step 3: Add new columns with correct types
-- Backup existing user_id columns
ALTER TABLE generation_tasks ADD COLUMN IF NOT EXISTS old_user_id TEXT;
ALTER TABLE user_ip_characters ADD COLUMN IF NOT EXISTS old_user_id TEXT;

-- Copy old user_id values to backup columns
UPDATE generation_tasks SET old_user_id = user_id WHERE user_id IS NOT NULL;
UPDATE user_ip_characters SET old_user_id = user_id WHERE user_id IS NOT NULL;

-- Drop and recreate user_id columns with correct type
ALTER TABLE generation_tasks DROP COLUMN IF EXISTS user_id;
ALTER TABLE generation_tasks ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE user_ip_characters DROP COLUMN IF EXISTS user_id;
ALTER TABLE user_ip_characters ADD COLUMN user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 4: Add missing columns to match new schema
ALTER TABLE generation_tasks ADD COLUMN IF NOT EXISTS batch_id TEXT;
ALTER TABLE generation_tasks ADD COLUMN IF NOT EXISTS parent_character_id TEXT;
ALTER TABLE user_ip_characters ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE user_ip_characters ADD COLUMN IF NOT EXISTS merchandise_task_status TEXT CHECK (merchandise_task_status IN ('pending', 'processing', 'completed', 'failed'));

-- Step 5: Update ID generation for new records
ALTER TABLE generation_tasks ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE user_ip_characters ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

-- Step 6: Create new indexes
CREATE INDEX IF NOT EXISTS idx_generation_tasks_task_type ON generation_tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_generation_tasks_batch_id ON generation_tasks(batch_id);
CREATE INDEX IF NOT EXISTS idx_user_ip_characters_created_at ON user_ip_characters(created_at);

-- Step 7: Update RLS policies (drop old ones first)
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can view own tasks" ON generation_tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON generation_tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON generation_tasks;
DROP POLICY IF EXISTS "Users can view own characters" ON user_ip_characters;
DROP POLICY IF EXISTS "Users can insert own characters" ON user_ip_characters;
DROP POLICY IF EXISTS "Users can update own characters" ON user_ip_characters;

-- Create new RLS policies for generation_tasks
CREATE POLICY "Users can view own tasks" ON generation_tasks 
FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can insert own tasks" ON generation_tasks 
FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can update own tasks" ON generation_tasks 
FOR UPDATE USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Service role can manage all tasks" ON generation_tasks 
FOR ALL USING (auth.role() = 'service_role');

-- Create new RLS policies for user_ip_characters
CREATE POLICY "Users can view own characters" ON user_ip_characters 
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own characters" ON user_ip_characters 
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own characters" ON user_ip_characters 
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own characters" ON user_ip_characters 
FOR DELETE USING (user_id = auth.uid());

-- Step 8: Create storage bucket and policies
INSERT INTO storage.buckets (id, name, public) 
VALUES ('generated-images', 'generated-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Public can view generated images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;

-- Create storage policies
CREATE POLICY "Public can view generated images" ON storage.objects 
FOR SELECT USING (bucket_id = 'generated-images');

CREATE POLICY "Authenticated users can upload images" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'generated-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own images" ON storage.objects 
FOR UPDATE USING (bucket_id = 'generated-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own images" ON storage.objects 
FOR DELETE USING (bucket_id = 'generated-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Step 9: Create helper function and trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_generation_tasks_updated_at ON generation_tasks;
CREATE TRIGGER update_generation_tasks_updated_at
    BEFORE UPDATE ON generation_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 10: Create user profile view
CREATE OR REPLACE VIEW user_profiles AS
SELECT 
    id,
    email,
    (raw_user_meta_data->>'username')::text as username,
    created_at,
    updated_at,
    last_sign_in_at
FROM auth.users;

GRANT SELECT ON user_profiles TO authenticated;

ALTER VIEW user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON user_profiles 
FOR SELECT USING (id = auth.uid());

-- Step 11: Clean up (OPTIONAL - ONLY run when you're sure migration is successful)
-- Uncomment these lines when you're confident the migration worked:
-- DROP TABLE IF EXISTS temp_old_users;
-- ALTER TABLE generation_tasks DROP COLUMN IF EXISTS old_user_id;
-- ALTER TABLE user_ip_characters DROP COLUMN IF EXISTS old_user_id;
-- DROP TABLE IF EXISTS users CASCADE;

-- Migration complete!
-- 
-- Next steps:
-- 1. Test your application with the new auth system
-- 2. Manually map existing user data to auth.users if needed
-- 3. Update your application code to use auth.uid() instead of custom user IDs
-- 4. Remove old user table and backup columns once everything works correctly 