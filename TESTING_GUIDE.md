# 测试 Save & Exit 功能的步骤

## 本地测试（推荐先在本地测试）

1. 启动开发服务器：
```bash
cd C:\Users\yunda\Desktop\OIC\oic
npm run dev
```

2. 访问 http://localhost:9002

3. 测试流程：
   - 登录
   - 开始问卷
   - 点击 "Save & Exit" 按钮
   - 观察是否正确跳转到 `/save-exit` 页面
   - 检查是否自动跳转到登录页面

## 生产环境测试

部署到 Render 后：

1. 访问你的 Render 应用 URL
2. 重复上述测试流程
3. 如果出现问题，打开浏览器开发者工具（F12）：
   - 查看 Console 标签页的错误信息
   - 查看 Network 标签页的网络请求
   - 查看 Application 标签页的 Local Storage

## 故障排除

### 如果仍然出现闪现错误：

1. **检查 Render 环境变量**：
   确保以下环境变量在 Render 中正确设置：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

2. **检查 Supabase 连接**：
   在浏览器控制台运行：
   ```javascript
   fetch('https://kuekvouznoxzxgetdgsh.supabase.co/rest/v1/', {
     headers: { 'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
   }).then(r => console.log('Supabase connection:', r.status))
   ```

3. **强制刷新浏览器缓存**：
   - Windows: Ctrl + Shift + R
   - Mac: Cmd + Shift + R

4. **尝试不同浏览器**：
   测试是否是特定浏览器的问题

### 临时解决方案

如果问题持续存在，可以暂时修改保存逻辑，直接使用 `window.location.href` 而不是 Next.js 路由：

```javascript
// 在主页面的 handleSaveAndExit 函数中替换跳转逻辑
window.location.href = '/login';  // 直接跳转到登录页
```

## 监控和日志

在生产环境中，你可以：

1. **添加 Google Analytics 或其他分析工具**来跟踪用户行为
2. **使用 Sentry 或类似服务**来捕获生产环境错误
3. **添加自定义日志记录**到服务器端

如果问题仍然存在，请提供：
- 浏览器控制台的完整错误信息
- 发生错误时的确切步骤
- 使用的浏览器类型和版本
- Render 应用的错误日志
