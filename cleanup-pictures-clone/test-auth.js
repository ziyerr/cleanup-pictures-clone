// 认证系统测试文件
// 这个文件用于快速测试认证功能是否正常工作

console.log('=== 认证系统测试 ===');

// 测试Supabase连接
const supabaseUrl = 'https://wrfvysakckcmvquvwuei.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyZnZ5c2FrY2tjbXZxdXZ3dWVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MDEzMDEsImV4cCI6MjA2NDk3NzMwMX0.LgQHwS9rbcmTfL2SegtcDByDTxWqraKMcXRQBPMtYJw';

console.log('Supabase 配置检查:');
console.log('- URL:', supabaseUrl);
console.log('- Key 前缀:', supabaseKey.substring(0, 20) + '...');

// 测试网络连接
fetch(supabaseUrl + '/rest/v1/', {
  headers: {
    'apikey': supabaseKey,
    'Authorization': 'Bearer ' + supabaseKey
  }
})
.then(response => {
  console.log('- 网络连接状态:', response.status);
  console.log('- 连接成功:', response.ok);
  return response.text();
})
.then(data => {
  console.log('- 响应数据长度:', data.length);
})
.catch(error => {
  console.error('- 连接失败:', error.message);
});

console.log('\n请在浏览器中打开 http://localhost:3001 测试登录注册功能');
console.log('检查浏览器控制台是否有错误信息');