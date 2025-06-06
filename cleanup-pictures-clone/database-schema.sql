-- Supabase Database Schema for IP Character Generation System
-- Run these commands in your Supabase SQL editor

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generation tasks table
CREATE TABLE IF NOT EXISTS generation_tasks (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    task_type TEXT NOT NULL CHECK (task_type IN ('ip_generation', 'multi_view', '3d_model', 'merchandise')),
    prompt TEXT NOT NULL,
    original_image_url TEXT,
    result_image_url TEXT,
    result_data JSONB,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User IP characters table
CREATE TABLE IF NOT EXISTS user_ip_characters (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    main_image_url TEXT NOT NULL,
    left_view_url TEXT,
    back_view_url TEXT,
    model_3d_url TEXT,
    merchandise_urls JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_generation_tasks_user_id ON generation_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_tasks_status ON generation_tasks(status);
CREATE INDEX IF NOT EXISTS idx_generation_tasks_created_at ON generation_tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_user_ip_characters_user_id ON user_ip_characters(user_id);

-- Create storage bucket for generated images (run this in Supabase dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('generated-images', 'generated-images', true);

-- Set up Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ip_characters ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (true);

-- Users can view and manage their own tasks
CREATE POLICY "Users can view own tasks" ON generation_tasks FOR SELECT USING (user_id = auth.uid()::text OR user_id IS NULL);
CREATE POLICY "Users can insert own tasks" ON generation_tasks FOR INSERT WITH CHECK (user_id = auth.uid()::text OR user_id IS NULL);
CREATE POLICY "Users can update own tasks" ON generation_tasks FOR UPDATE USING (user_id = auth.uid()::text OR user_id IS NULL);

-- Users can view and manage their own IP characters
CREATE POLICY "Users can view own characters" ON user_ip_characters FOR SELECT USING (user_id = auth.uid()::text);
CREATE POLICY "Users can insert own characters" ON user_ip_characters FOR INSERT WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "Users can update own characters" ON user_ip_characters FOR UPDATE USING (user_id = auth.uid()::text);

-- Create storage policy for generated images
-- CREATE POLICY "Public can view generated images" ON storage.objects FOR SELECT USING (bucket_id = 'generated-images');
-- CREATE POLICY "Authenticated users can upload images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'generated-images' AND auth.role() = 'authenticated');