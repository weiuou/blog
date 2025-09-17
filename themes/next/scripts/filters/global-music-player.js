/* global hexo */

'use strict';

// 注入全局音乐播放器样式
hexo.extend.filter.register('theme_inject', injects => {
  // 注入CSS样式
  injects.style.push('source/css/_custom/global-music-player.css');
});