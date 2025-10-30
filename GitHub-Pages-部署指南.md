# Hexo博客部署到GitHub Pages完整指南

## 1. 前置准备

### 已完成的步骤
✅ 安装了 `hexo-deployer-git` 插件
✅ 配置了 `_config.yml` 中的 deploy 部分

## 2. 创建GitHub仓库

### 方式一：个人主页（推荐）
1. 登录GitHub，创建新仓库
2. 仓库名必须是：`yourusername.github.io`（将yourusername替换为你的GitHub用户名）
3. 设置为Public仓库
4. 不要初始化README、.gitignore或license

### 方式二：项目页面
1. 创建任意名称的仓库，如：`my-blog`
2. 设置为Public仓库
3. 后续需要使用gh-pages分支

## 3. 更新配置文件

### 个人主页配置
在 `_config.yml` 中修改以下内容：

```yaml
# 修改网站URL
url: https://yourusername.github.io

# 部署配置
deploy:
  type: git
  repo: https://github.com/yourusername/yourusername.github.io.git
  branch: main
```

### 项目页面配置
```yaml
# 修改网站URL和根路径
url: https://yourusername.github.io/my-blog
root: /my-blog/

# 部署配置
deploy:
  type: git
  repo: https://github.com/yourusername/my-blog.git
  branch: gh-pages
```

## 4. GitHub Pages设置

1. 进入仓库的Settings页面
2. 找到"Pages"选项
3. 在"Source"中选择：
   - 个人主页：Deploy from a branch → main分支
   - 项目页面：Deploy from a branch → gh-pages分支
4. 保存设置

## 5. 部署命令

### 首次部署
```bash
# 清理缓存
npm run clean

# 生成静态文件
npm run build

# 部署到GitHub Pages
npm run deploy
```

### 日常更新
```bash
# 清理并重新生成
npm run clean && npm run build

# 部署
npm run deploy
```

## 6. 验证部署

部署成功后，访问以下地址：
- 个人主页：`https://yourusername.github.io`
- 项目页面：`https://yourusername.github.io/repository-name`

## 7. 常见问题

### 问题1：部署后页面空白
- 检查 `_config.yml` 中的 `url` 和 `root` 配置
- 确保仓库名和分支设置正确

### 问题2：CSS/JS文件404
- 检查 `url` 配置是否包含正确的域名
- 项目页面需要设置正确的 `root` 路径

### 问题3：权限错误
- 使用SSH方式：`git@github.com:yourusername/repository.git`
- 或者在HTTPS URL中包含token

## 8. GitHub Actions自动化部署（可选）

创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy Hexo to GitHub Pages

on:
  push:
    branches: [ source ]  # 源码分支

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout
      uses: actions/checkout@v3
      with:
        submodules: false
        
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm install
      
    - name: Generate static files
      run: npm run build
      
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./public
        publish_branch: main  # 或 gh-pages
```

使用GitHub Actions时：
1. 将源码推送到 `source` 分支
2. Actions会自动构建并部署到 `main` 或 `gh-pages` 分支
3. 无需手动运行 `hexo deploy` 命令

## 9. 最佳实践

1. **备份源码**：将Hexo源码推送到仓库的source分支
2. **定期更新**：保持Hexo和插件的最新版本
3. **自定义域名**：在source目录下添加CNAME文件
4. **SEO优化**：配置sitemap和robots.txt

---

**注意**：请将所有的 `yourusername` 替换为你的实际GitHub用户名，`repository-name` 替换为你的实际仓库名。