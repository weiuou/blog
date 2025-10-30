#!/bin/bash

# Hexo博客快速部署脚本
# 使用方法：./deploy.sh 或 bash deploy.sh

echo "🚀 开始部署Hexo博客到GitHub Pages..."

# 检查是否安装了必要的依赖
if ! command -v hexo &> /dev/null; then
    echo "❌ 错误：未找到hexo命令，请先安装Hexo"
    exit 1
fi

# 清理缓存和旧文件
echo "🧹 清理缓存..."
npm run clean

if [ $? -ne 0 ]; then
    echo "❌ 清理失败"
    exit 1
fi

# 生成静态文件
echo "📦 生成静态文件..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ 生成失败"
    exit 1
fi

# 部署到GitHub Pages
echo "🌐 部署到GitHub Pages..."
npm run deploy

if [ $? -eq 0 ]; then
    echo "✅ 部署成功！"
    echo "📝 请访问你的GitHub Pages网站查看更新"
else
    echo "❌ 部署失败，请检查配置和网络连接"
    exit 1
fi

echo "🎉 部署完成！"