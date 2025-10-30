const axios = require('axios');
const crypto = require('crypto');

// 配置信息（从你的_config.yml中获取）
const config = {
  owner: 'weiuou',
  repo: 'comment',
  clientId: 'Ov23lijmuuwVxfQ21YQp',
  clientSecret: 'ed46927c8c630ae8e690ac7ccaa7870d4a4a693a'
};

// 你的文章列表（需要手动添加）
const posts = [
  {
    title: '8月回顾',
    url: '/2025/09/18/8月回顾/',
    path: '2025/09/18/8月回顾/index.html'
  },
  {
    title: 'local-music-player',
    url: '/2025/09/16/local-music-player/',
    path: '2025/09/16/local-music-player/index.html'
  }
  // 添加更多文章...
];

// 生成Gitalk ID（与前端保持一致）
function generateId(path) {
  return crypto.createHash('md5').update(path).digest('hex');
}

// 创建GitHub Issue
async function createIssue(post) {
  const id = generateId(post.path);
  const issueTitle = post.title;
  const issueBody = `${post.url}\n\n---\n\n此 Issue 由 Gitalk 自动创建，用于存储文章评论。`;

  try {
    const response = await axios.post(
      `https://api.github.com/repos/${config.owner}/${config.repo}/issues`,
      {
        title: issueTitle,
        body: issueBody,
        labels: ['Gitalk', id]
      },
      {
        headers: {
          'Authorization': `token YOUR_GITHUB_TOKEN`, // 需要替换为你的GitHub Token
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );
    
    console.log(`✅ 成功为文章 "${post.title}" 创建Issue: ${response.data.html_url}`);
  } catch (error) {
    console.error(`❌ 为文章 "${post.title}" 创建Issue失败:`, error.response?.data || error.message);
  }
}

// 批量初始化
async function initAllPosts() {
  console.log('开始批量初始化Gitalk评论...');
  
  for (const post of posts) {
    await createIssue(post);
    // 避免API限制，每次请求间隔1秒
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('批量初始化完成！');
}

// 运行脚本
// initAllPosts();

console.log('请先：');
console.log('1. 安装依赖: npm install axios');
console.log('2. 创建GitHub Personal Access Token (需要repo权限)');
console.log('3. 替换上面的 YOUR_GITHUB_TOKEN');
console.log('4. 取消注释最后一行并运行: node init-gitalk.js');