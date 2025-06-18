// 直接测试Supabase API
const fetch = require('node-fetch');

const supabaseUrl = 'https://wrfvysakckcmvquvwuei.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyZnZ5c2FrY2tjbXZxdXZ3dWVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MDEzMDEsImV4cCI6MjA2NDk3NzMwMX0.LgQHwS9rbcmTfL2SegtcDByDTxWqraKMcXRQBPMtYJw';

console.log('=== Supabase 认证测试 ===');

// 测试注册
async function testRegister() {
  try {
    console.log('\n1. 测试用户注册...');
    
    const response = await fetch(`${supabaseUrl}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        email: 'testuser999@temp.local',
        password: 'password123',
        data: {
          username: 'testuser999'
        }
      })
    });
    
    const data = await response.json();
    console.log('注册响应状态:', response.status);
    console.log('注册响应:', JSON.stringify(data, null, 2));
    
    return { success: response.ok, data };
  } catch (error) {
    console.error('注册请求失败:', error.message);
    return { success: false, error: error.message };
  }
}

// 测试登录
async function testLogin() {
  try {
    console.log('\n2. 测试用户登录...');
    
    const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        email: 'testuser999@temp.local',
        password: 'password123'
      })
    });
    
    const data = await response.json();
    console.log('登录响应状态:', response.status);
    console.log('登录响应:', JSON.stringify(data, null, 2));
    
    return { success: response.ok, data };
  } catch (error) {
    console.error('登录请求失败:', error.message);
    return { success: false, error: error.message };
  }
}

// 运行测试
async function runTests() {
  console.log('Supabase URL:', supabaseUrl);
  console.log('API Key 前缀:', supabaseKey.substring(0, 20) + '...');
  
  // 先测试基本连接
  try {
    console.log('\n0. 测试基本连接...');
    const healthResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    console.log('连接状态:', healthResponse.status, healthResponse.ok ? '✅' : '❌');
  } catch (error) {
    console.error('连接失败:', error.message);
    return;
  }
  
  // 测试注册
  const registerResult = await testRegister();
  
  // 如果注册成功或用户已存在，尝试登录
  if (registerResult.success || (registerResult.data && registerResult.data.msg && registerResult.data.msg.includes('already'))) {
    await testLogin();
  }
}

runTests().catch(console.error);