"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { testDatabaseConnection, testInsertUser, testInsertIPCharacter } from '@/lib/test-db';

export default function DebugPage() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${result}`]);
  };

  const runDatabaseTest = async () => {
    setTesting(true);
    setTestResults([]);
    
    try {
      addResult('开始数据库连接测试...');
      const connectionSuccess = await testDatabaseConnection();
      
      if (connectionSuccess) {
        addResult('✅ 数据库连接测试通过');
        
        addResult('开始用户插入测试...');
        const insertResult = await testInsertUser();
        
        if (insertResult.success) {
          addResult('✅ 用户插入测试通过');
          
          addResult('开始IP形象插入测试...');
          const ipResult = await testInsertIPCharacter();
          
          if (ipResult.success) {
            addResult('✅ IP形象插入测试通过');
          } else {
            addResult(`❌ IP形象插入测试失败: ${ipResult.error}`);
          }
        } else {
          addResult(`❌ 用户插入测试失败: ${insertResult.error}`);
        }
      } else {
        addResult('❌ 数据库连接测试失败');
      }
    } catch (error) {
      addResult(`❌ 测试过程中出现异常: ${error}`);
    } finally {
      setTesting(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold text-center mb-8">数据库调试页面</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <div className="flex gap-4">
            <Button
              onClick={runDatabaseTest}
              disabled={testing}
              className="flex-1"
            >
              {testing ? '测试中...' : '运行数据库测试'}
            </Button>
            
            <Button
              onClick={clearResults}
              variant="outline"
            >
              清空结果
            </Button>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">快速修复</h3>
            <p className="text-sm text-yellow-700 mb-3">
              如果用户插入测试失败，请在 Supabase SQL 编辑器中运行以下命令：
            </p>
            <div className="bg-gray-800 text-green-400 text-xs font-mono p-3 rounded overflow-x-auto">
              <div>-- 创建 user_ip_characters 表（如果缺失）：</div>
              <div>CREATE TABLE IF NOT EXISTS user_ip_characters (</div>
              <div>&nbsp;&nbsp;id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),</div>
              <div>&nbsp;&nbsp;user_id UUID NOT NULL,</div>
              <div>&nbsp;&nbsp;name TEXT NOT NULL,</div>
              <div>&nbsp;&nbsp;main_image_url TEXT NOT NULL,</div>
              <div>&nbsp;&nbsp;left_view_url TEXT,</div>
              <div>&nbsp;&nbsp;back_view_url TEXT,</div>
              <div>&nbsp;&nbsp;model_3d_url TEXT,</div>
              <div>&nbsp;&nbsp;merchandise_urls JSONB,</div>
              <div>&nbsp;&nbsp;created_at TIMESTAMPTZ DEFAULT NOW()</div>
              <div>);</div>
              <div className="mt-2">-- 禁用 RLS</div>
              <div>ALTER TABLE user_ip_characters DISABLE ROW LEVEL SECURITY;</div>
              <div className="mt-2">-- 如果是 email 约束错误：</div>
              <div>ALTER TABLE users ALTER COLUMN email DROP NOT NULL;</div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">测试结果</h2>
            
            {testResults.length === 0 ? (
              <p className="text-gray-500">点击"运行数据库测试"开始测试</p>
            ) : (
              <div className="bg-gray-100 rounded-lg p-4 max-h-96 overflow-y-auto">
                {testResults.map((result, index) => (
                  <div 
                    key={index}
                    className="text-sm font-mono mb-1 last:mb-0"
                  >
                    {result}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">环境变量检查</h2>
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="text-sm font-mono space-y-1">
                <div>
                  <span className="font-semibold">SUPABASE_URL:</span> {
                    process.env.NEXT_PUBLIC_SUPABASE_URL ? 
                    `${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30)}...` : 
                    '❌ 未设置'
                  }
                </div>
                <div>
                  <span className="font-semibold">SUPABASE_ANON_KEY:</span> {
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 
                    `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 30)}...` : 
                    '❌ 未设置'
                  }
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">说明</h2>
            <div className="text-sm text-gray-600 space-y-2">
              <p>此页面用于调试数据库连接和表结构问题。</p>
              <p>如果测试失败，请检查：</p>
              <ul className="list-disc ml-6 space-y-1">
                <li>Supabase 项目配置是否正确</li>
                <li>数据库表是否已创建（运行 database-schema.sql 或 database-schema-fixed.sql）</li>
                <li>RLS 政策是否已禁用或正确配置</li>
                <li>环境变量是否正确设置</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}