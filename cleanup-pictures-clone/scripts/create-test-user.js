#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 手动读取.env.local文件
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  const env = {};
  
  try {
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim();
        }
      }
    }
  } catch (err) {
    console.error('❌ 无法读取 .env.local 文件:', err.message);
  }
  
  return env;
}

const env = loadEnvFile();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 错误: 请确保 .env.local 文件包含正确的 Supabase 配置');
  console.error('需要: NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY');
  console.error('\n当前读取到的环境变量:');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl || '未找到');
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '已设置' : '未找到');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestUser() {
  const testUsers = [
    { username: 'testuser', password: '123456', email: 'testuser@gmail.com' },
    { username: 'demo', password: '123456', email: 'demo@gmail.com' },
    { username: 'admin', password: '123456', email: 'admin@gmail.com' }
  ];

  console.log('🚀 开始创建测试用户...\n');

  for (const user of testUsers) {
    try {
      console.log(`📝 创建用户: ${user.username}`);
      
      const { data, error } = await supabase.auth.signUp({
        email: user.email,
        password: user.password,
        options: {
          data: {
            username: user.username,
          }
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          console.log(`   ⚠️  用户 ${user.username} 已存在`);
        } else {
          console.error(`   ❌ 创建用户 ${user.username} 失败:`, error.message);
        }
      } else {
        console.log(`   ✅ 用户 ${user.username} 创建成功 (ID: ${data.user?.id})`);
      }
    } catch (err) {
      console.error(`   ❌ 创建用户 ${user.username} 时出错:`, err.message);
    }
  }

  console.log('\n✨ 测试用户创建完成!');
  console.log('\n📋 可用的测试账号:');
  console.log('   用户名: testuser, 密码: 123456');
  console.log('   用户名: demo, 密码: 123456');
  console.log('   用户名: admin, 密码: 123456');
  console.log('\n💡 在网页上直接使用用户名和密码登录即可');
  console.log('\n🔧 如果使用用户名登录失败，请尝试使用邮箱地址登录:');
  console.log('   邮箱: testuser@gmail.com, 密码: 123456');
  console.log('   邮箱: demo@gmail.com, 密码: 123456');
  console.log('   邮箱: admin@gmail.com, 密码: 123456');
}

// 测试连接
async function testConnection() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('❌ Supabase 连接测试失败:', error.message);
      return false;
    }
    console.log('✅ Supabase 连接正常');
    return true;
  } catch (err) {
    console.error('❌ Supabase 连接测试出错:', err.message);
    return false;
  }
}

async function main() {
  console.log('🔍 测试 Supabase 连接...');
  const connected = await testConnection();
  
  if (!connected) {
    console.error('\n❌ 无法连接到 Supabase，请检查配置');
    process.exit(1);
  }
  
  await createTestUser();
}

main().catch(console.error); 