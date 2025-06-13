-- Fresh Supabase Database Setup for IP Character Generation System
-- This script is for NEW projects or COMPLETE database reset
-- Uses Supabase Auth from the beginning
--
-- To apply this setup:
-- 1. Go to your Supabase Dashboard > SQL Editor
-- 2. Copy and paste this entire script
-- 3. Click "Run" to execute
-- 4. Your database will be ready for the IP generation app

-- Enable UUID extension (required for auth.users)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Generation tasks table
CREATE TABLE generation_tasks (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    task_type TEXT NOT NULL,
    prompt TEXT NOT NULL,
    original_image_url TEXT,
    result_image_url TEXT,
    result_data JSONB,
    error_message TEXT,
    batch_id TEXT,
    parent_character_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User IP characters table
CREATE TABLE user_ip_characters (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    main_image_url TEXT NOT NULL,
    left_view_url TEXT,
    back_view_url TEXT,
    model_3d_url TEXT,
    merchandise_urls JSONB,
    merchandise_task_status TEXT CHECK (merchandise_task_status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_generation_tasks_user_id ON generation_tasks(user_id);
CREATE INDEX idx_generation_tasks_status ON generation_tasks(status);
CREATE INDEX idx_generation_tasks_task_type ON generation_tasks(task_type);
CREATE INDEX idx_generation_tasks_created_at ON generation_tasks(created_at);
CREATE INDEX idx_generation_tasks_batch_id ON generation_tasks(batch_id);
CREATE INDEX idx_user_ip_characters_user_id ON user_ip_characters(user_id);
CREATE INDEX idx_user_ip_characters_created_at ON user_ip_characters(created_at);

-- Enable Row Level Security
ALTER TABLE generation_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ip_characters ENABLE ROW LEVEL SECURITY;

-- RLS policies for generation_tasks
CREATE POLICY "Users can view own tasks" ON generation_tasks 
FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can insert own tasks" ON generation_tasks 
FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can update own tasks" ON generation_tasks 
FOR UPDATE USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Service role can manage all tasks" ON generation_tasks 
FOR ALL USING (auth.role() = 'service_role');

-- RLS policies for user_ip_characters
CREATE POLICY "Users can view own characters" ON user_ip_characters 
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own characters" ON user_ip_characters 
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own characters" ON user_ip_characters 
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own characters" ON user_ip_characters 
FOR DELETE USING (user_id = auth.uid());

-- Create storage bucket for generated images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('generated-images', 'generated-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for generated images
CREATE POLICY "Public can view generated images" ON storage.objects 
FOR SELECT USING (bucket_id = 'generated-images');

CREATE POLICY "Authenticated users can upload images" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'generated-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own images" ON storage.objects 
FOR UPDATE USING (bucket_id = 'generated-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own images" ON storage.objects 
FOR DELETE USING (bucket_id = 'generated-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for auto-updating updated_at
CREATE TRIGGER update_generation_tasks_updated_at
    BEFORE UPDATE ON generation_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- User profile view for easy access to user data
CREATE VIEW user_profiles AS
SELECT 
    id,
    email,
    (raw_user_meta_data->>'username')::text as username,
    created_at,
    updated_at,
    last_sign_in_at
FROM auth.users;

-- Grant access to authenticated users
GRANT SELECT ON user_profiles TO authenticated;

-- RLS for user profiles view
ALTER VIEW user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON user_profiles 
FOR SELECT USING (id = auth.uid());

-- Database setup complete!
-- 
-- Your database is now ready for the IP Character Generation System
-- The app will use Supabase Auth for user management
-- Users can register/login and the system will automatically handle user IDs 