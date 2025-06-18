# 周边产品生成功能测试

## 修复内容总结

### 1. 修复了 RLS 认证问题
- **问题**: `/api/ip/[id]/generate-all` 端点使用匿名 Supabase 客户端，无法通过 RLS 策略
- **解决方案**: 
  - 修改端点使用带认证的 Supabase 客户端
  - 在 IPDetail 组件中传递认证 token 和用户 ID

### 2. 修复了状态获取问题  
- **问题**: `fetchStatus` 函数调用的 `/api/ip/[id]/status` 端点也有 RLS 问题
- **解决方案**: 
  - 将状态获取改为直接调用客户端 Supabase 函数
  - 增强 `getIPCharacterWithStatus` 函数的认证检查

### 3. 代码修改详情

#### IPDetail.tsx 修改:
```typescript
// 修复状态获取
const fetchStatus = useCallback(async () => {
  try {
    // 直接使用客户端Supabase调用，而不是API端点
    const { getIPCharacterWithStatus } = await import('../lib/supabase');
    const data = await getIPCharacterWithStatus(ipCharacter.id);
    
    if (!data) {
      throw new Error('IP角色不存在或无权访问');
    }
    
    setCharacterStatus(data);
  } catch (error) {
    console.error('获取IP状态失败:', error);
    setCharacterStatus(null);
  }
}, [ipCharacter.id]);

// 修复周边产品生成
const handleGenerateMoreMerchandise = async () => {
  setIsGenerating(true);
  try {
    // Get the current session token for authentication
    const { data: { session } } = await (await import('../lib/supabase')).supabase.auth.getSession();
    const authToken = session?.access_token;

    if (!authToken) {
      throw new Error('认证token不存在，请重新登录');
    }

    const response = await fetch(`/api/ip/${ipCharacter.id}/generate-all`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': currentUser?.id || '',
        'Authorization': `Bearer ${authToken}`,
      },
    });
    // ... 其余处理逻辑
  }
};
```

#### generate-all/route.ts 修改:
```typescript
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: ipId } = await params;
  const userId = request.headers.get('x-user-id');
  const authHeader = request.headers.get('authorization');

  if (!userId || !authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Create authenticated Supabase client using the user's session token
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wrfvysakckcmvquvwuei.supabase.co';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '...';
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    // 1. Fetch the IP character data with proper authentication
    const { data: ipCharacter, error: fetchError } = await supabase
      .from('user_ip_characters')
      .select('*')
      .eq('id', ipId)
      .eq('user_id', userId)
      .single();
    // ... 其余逻辑
  }
}
```

#### supabase.ts 修改:
```typescript
export const getIPCharacterWithStatus = async (ipId: string) => {
  try {
    console.log('获取IP形象状态:', ipId);
    
    // 检查当前认证状态
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('当前认证用户:', user?.id);
    
    if (authError) {
      console.error('认证检查失败:', authError);
      throw new Error(`认证失败: ${authError.message}`);
    }
    
    if (!user) {
      console.error('用户未认证');
      throw new Error('用户未认证，请先登录');
    }
    
    const { data, error } = await supabase
      .from('user_ip_characters')
      .select('*')
      .eq('id', ipId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('IP形象不存在:', ipId);
        return null;
      }
      console.error('获取IP形象失败:', error);
      throw new Error(`获取IP形象失败: ${error.message}`);
    }
    
    // 验证用户是否有权访问这个IP
    if (data.user_id !== user.id) {
      console.error('用户无权访问此IP:', { ipUserId: data.user_id, currentUserId: user.id });
      throw new Error('无权访问此IP形象');
    }

    console.log('成功获取IP形象状态:', data.id);
    return {
      ...data,
      initial_task_status: 'completed',
      merchandise_task_status: data.merchandise_task_status || 'not_started'
    };
  } catch (error) {
    console.error('获取IP形象状态失败:', error);
    if (error instanceof Error) {
      throw error;
    }
    return null;
  }
};
```

## 测试步骤

1. **登录用户账户**
2. **进入工作坊，选择一个已创建的IP形象**
3. **点击周边产品窗口的"立即生成"按钮**
4. **验证以下功能**:
   - 不再出现 "Failed to fetch status" 错误
   - 不再出现 "IP角色不存在或无权访问" 错误
   - 能够成功启动周边产品生成流程
   - 生成过程中显示正确的状态信息

## 预期结果

- ✅ IP形象状态正常获取
- ✅ 周边产品生成成功启动
- ✅ 并行生成多种周边产品（T恤、马克杯、贴纸等）
- ✅ 生成进度正常显示和更新

## 注意事项

- 确保用户已登录且有有效的认证 token
- 确保 IP 形象属于当前登录用户
- 生成过程可能需要一些时间，请耐心等待
