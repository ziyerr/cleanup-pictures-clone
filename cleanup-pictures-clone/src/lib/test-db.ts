// 数据库连接测试脚本
import { supabase } from './supabase';

export const testDatabaseConnection = async () => {
  try {
    console.log('测试数据库连接...');
    
    // 测试基本连接
    const { data: connectionTest, error: connectionError } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });
    
    if (connectionError) {
      console.error('数据库连接失败:', connectionError);
      console.error('错误详情:', {
        code: connectionError.code,
        message: connectionError.message,
        details: connectionError.details
      });
      
      // 如果users表不存在，尝试获取更多信息
      if (connectionError.code === 'PGRST116' || connectionError.message?.includes('relation') || connectionError.message?.includes('does not exist')) {
        console.log('users表可能不存在，尝试查询表结构...');
        
        try {
          const { data: tables, error: tableError } = await supabase
            .rpc('get_table_info'); // 这个可能不存在，但可以尝试
          
          console.log('表信息:', tables);
        } catch (rpcError) {
          console.log('无法获取表信息，表可能确实不存在');
        }
      }
      
      return false;
    }
    
    console.log('数据库连接成功，users表存在');
    
    // 测试其他表
    const tables = ['generation_tasks', 'user_ip_characters'];
    
    for (const table of tables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('count', { count: 'exact', head: true });
        
        if (error) {
          console.error(`表 ${table} 不存在或无法访问:`, error);
          console.error(`表 ${table} 错误详情:`, {
            code: error.code,
            message: error.message,
            details: error.details
          });
        } else {
          console.log(`表 ${table} 存在且可访问`);
        }
      } catch (err) {
        console.error(`测试表 ${table} 时出错:`, err);
      }
    }
    
    return true;
  } catch (error) {
    console.error('数据库测试失败:', error);
    return false;
  }
};

export const testInsertUser = async () => {
  try {
    console.log('测试用户插入...');
    
    // 测试不提供email的情况（应该是我们应用的常见情况）
    const testUser = {
      id: '00000000-0000-0000-0000-000000000001',
      username: 'test_user_' + Date.now(),
      password_hash: btoa('test123'),
      created_at: new Date().toISOString(),
    };
    
    console.log('准备插入测试用户:', testUser);
    
    const { data, error } = await supabase
      .from('users')
      .insert([testUser])
      .select()
      .single();
    
    console.log('插入结果:', { data, error });
    
    if (error) {
      console.error('用户插入测试失败:', error);
      console.error('错误代码:', error.code);
      console.error('错误消息:', error.message);
      console.error('错误详情:', error.details);
      return { success: false, error: `${error.message} (code: ${error.code})` };
    }
    
    console.log('用户插入测试成功:', data);
    
    // 清理测试数据
    try {
      const { error: deleteError } = await supabase.from('users').delete().eq('id', testUser.id);
      if (deleteError) {
        console.warn('清理测试数据失败:', deleteError);
      } else {
        console.log('测试数据清理成功');
      }
    } catch (cleanupError) {
      console.warn('清理过程中出现异常:', cleanupError);
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('用户插入测试异常:', error);
    return { success: false, error: String(error) };
  }
};

export const testInsertIPCharacter = async () => {
  try {
    console.log('测试IP形象插入...');
    
    const testCharacter = {
      id: '00000000-0000-0000-0000-000000000002',
      user_id: '00000000-0000-0000-0000-000000000001',
      name: 'Test IP Character',
      main_image_url: 'data:image/png;base64,test',
      created_at: new Date().toISOString(),
    };
    
    console.log('准备插入测试IP形象:', testCharacter);
    
    const { data, error } = await supabase
      .from('user_ip_characters')
      .insert([testCharacter])
      .select()
      .single();
    
    console.log('IP形象插入结果:', { data, error });
    
    if (error) {
      console.error('IP形象插入测试失败:', error);
      console.error('错误代码:', error.code);
      console.error('错误消息:', error.message);
      console.error('错误详情:', error.details);
      return { success: false, error: `${error.message} (code: ${error.code})` };
    }
    
    console.log('IP形象插入测试成功:', data);
    
    // 清理测试数据
    try {
      const { error: deleteError } = await supabase.from('user_ip_characters').delete().eq('id', testCharacter.id);
      if (deleteError) {
        console.warn('清理IP形象测试数据失败:', deleteError);
      } else {
        console.log('IP形象测试数据清理成功');
      }
    } catch (cleanupError) {
      console.warn('IP形象清理过程中出现异常:', cleanupError);
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('IP形象插入测试异常:', error);
    return { success: false, error: String(error) };
  }
};