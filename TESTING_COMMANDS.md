# 快速测试认证系统

## 🧪 浏览器控制台测试命令

### 1. 测试会话过期
在浏览器控制台中运行以下命令来模拟会话过期：

```javascript
// 将认证令牌时间戳设置为25小时前
const token = JSON.parse(localStorage.getItem('authToken'));
if (token) {
  token.timestamp = Date.now() - (25 * 60 * 60 * 1000);
  localStorage.setItem('authToken', JSON.stringify(token));
  console.log('会话已设置为过期状态');
  location.reload();
} else {
  console.log('未找到认证令牌');
}
```

### 2. 检查当前认证状态
```javascript
// 检查当前的认证信息
const user = localStorage.getItem('currentUser');
const token = localStorage.getItem('authToken');

console.log('用户信息:', user ? JSON.parse(user) : '未找到');
console.log('认证令牌:', token ? JSON.parse(token) : '未找到');

if (token) {
  const tokenData = JSON.parse(token);
  const timeElapsed = Date.now() - tokenData.timestamp;
  const hoursElapsed = timeElapsed / (1000 * 60 * 60);
  console.log(`会话已存在 ${hoursElapsed.toFixed(1)} 小时`);
}
```

### 3. 清除所有认证信息
```javascript
// 手动清除所有认证信息
localStorage.removeItem('currentUser');
localStorage.removeItem('authToken');
localStorage.removeItem('surveyDraft');
localStorage.removeItem('submitted');
console.log('所有认证信息已清除');
location.reload();
```

### 4. 创建无效的用户数据（测试数据完整性检查）
```javascript
// 创建不完整的用户数据
localStorage.setItem('currentUser', JSON.stringify({
  id: null, // 无效的ID
  username: 'test'
}));
console.log('已设置无效用户数据');
location.reload();
```

## 📋 手动测试步骤

### 场景1：正常用户流程
1. 打开网站 → 应该跳转到登录页面
2. 输入正确的用户名密码登录
3. 查看指导页面 → 点击开始
4. 应该正常进入问卷页面

### 场景2：缓存绕过测试
1. 正常登录并进入问卷
2. 关闭浏览器（不要登出）
3. 重新打开浏览器访问网站根目录 `/`
4. 应该显示加载状态然后正常进入问卷（24小时内）

### 场景3：会话过期测试
1. 正常登录
2. 在控制台运行会话过期命令（上面的命令1）
3. 刷新页面
4. 应该被重定向到登录页面

### 场景4：直接访问测试
1. 在未登录状态下直接访问：
   - `/` - 应该跳转到登录页面
   - `/instructions` - 应该跳转到登录页面
   - `/questions` - 应该跳转到登录页面
2. 所有页面都应该有加载状态然后跳转

## 🚨 预期行为

### ✅ 正确行为：
- 未登录用户无法直接访问问卷
- 会话过期后必须重新登录
- 所有认证检查都有适当的加载状态
- 认证失败时清除所有缓存数据

### ❌ 错误行为（如果出现请报告）：
- 未登录用户能直接看到问卷内容
- 会话过期后仍能继续使用
- 页面闪现或显示错误内容
- 认证检查时卡住不动

## 🔍 调试信息

在浏览器开发者工具的 Console 标签页中，你应该能看到以下日志：

- `"缺少用户信息或认证令牌，跳转到登录页"`
- `"用户认证成功: [用户名]"`  
- `"认证失败: [错误信息]"`
- `"会话已过期"`
- `"用户验证失败"`

这些日志可以帮助你了解认证系统的工作状态。
