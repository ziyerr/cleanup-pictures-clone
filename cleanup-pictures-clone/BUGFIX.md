# 修复：图片生成后点击按钮弹出注册登录窗口

## 问题描述
用户在IP形象生成完成后，点击"保存IP形象并立即生成周边"按钮时，应该弹出注册/登录窗口，但当前没有弹出。

## 修复内容

### 1. 增加待处理状态管理
```typescript
const [pendingMerchandiseGeneration, setPendingMerchandiseGeneration] = useState(false);
```

### 2. 修复按钮点击处理逻辑
```typescript
const handleSaveAndGenerateMerchandise = async () => {
  console.log('handleSaveAndGenerateMerchandise 被调用, currentUser:', currentUser);
  if (!currentUser) {
    console.log('用户未登录，显示认证模态框');
    setShowAuthModal(true);
    setPendingMerchandiseGeneration(true); // 标记有待处理的周边生成
    return;
  }
  await executeMerchandiseGeneration(currentUser);
};
```

### 3. 添加useEffect监听用户登录状态
```typescript
useEffect(() => {
  if (currentUser && pendingMerchandiseGeneration) {
    setPendingMerchandiseGeneration(false);
    executeMerchandiseGeneration(currentUser);
  }
}, [currentUser, pendingMerchandiseGeneration, executeMerchandiseGeneration]);
```

### 4. 优化认证模态框处理
```typescript
<AuthModal
  isOpen={showAuthModal}
  onClose={() => {
    setShowAuthModal(false);
    setPendingMerchandiseGeneration(false); // 取消待处理状态
  }}
  onSuccess={(user) => {
    setCurrentUser(user);
    setShowAuthModal(false);
    // useEffect会自动触发周边生成
  }}
/>
```

### 5. 重构周边生成函数
- 将周边生成逻辑提取为独立的 `executeMerchandiseGeneration` 函数
- 使用 `useCallback` 包装以避免无限重渲染
- 确保函数可以被用户登录后的useEffect调用

## 工作流程

1. 用户生成IP形象完成
2. 点击"保存IP形象并立即生成周边"按钮
3. 如果未登录：
   - 设置 `showAuthModal = true`
   - 设置 `pendingMerchandiseGeneration = true`
   - 显示认证模态框
4. 用户完成注册/登录：
   - `currentUser` 状态更新
   - `useEffect` 检测到用户登录且有待处理的周边生成
   - 自动调用 `executeMerchandiseGeneration`
   - 开始周边商品生成流程

## 测试页面
创建了 `/test-ip` 页面用于测试完整流程：
- 图片上传
- 提示词输入  
- IP形象生成
- 认证流程测试
- 周边生成流程测试

## 调试信息
添加了控制台日志来帮助调试：
- `handleSaveAndGenerateMerchandise` 函数调用
- 用户登录状态
- 认证模态框渲染状态

使用浏览器开发者工具可以查看这些日志来确认流程是否正常工作。