/* global APlayer */

document.addEventListener('DOMContentLoaded', function() {
  'use strict';

  // 等待APlayer加载完成
  function waitForAPlayer(callback) {
    if (typeof APlayer !== 'undefined') {
      // 检查是否有APlayer实例
      const aplayerElements = document.querySelectorAll('.aplayer');
      if (aplayerElements.length > 0) {
        // 尝试从多个可能的位置获取APlayer实例
        let foundAp = window.ap || window.aplayer;
        
        // 如果没有找到全局实例，尝试从DOM元素获取
        if (!foundAp) {
          for (let element of aplayerElements) {
            if (element.aplayer) {
              foundAp = element.aplayer;
              break;
            }
          }
        }
        
        // 尝试从MetingJS创建的实例获取
        if (!foundAp) {
          // 检查MetingJS可能创建的全局变量
          if (window.metingjs && window.metingjs.aplayer) {
            foundAp = window.metingjs.aplayer;
          } else {
            // 遍历所有可能的APlayer实例
            for (let i = 0; i < 10; i++) {
              if (window['ap' + i]) {
                foundAp = window['ap' + i];
                break;
              }
            }
          }
        }
        
        // 最后尝试：检查DOM元素的data属性或直接访问
        if (!foundAp) {
          for (let element of aplayerElements) {
            // 检查元素上可能存储的实例
            if (element._aplayer || element.aplayerInstance) {
              foundAp = element._aplayer || element.aplayerInstance;
              break;
            }
            // 检查父元素
            const parent = element.parentElement;
            if (parent && (parent._aplayer || parent.aplayerInstance)) {
              foundAp = parent._aplayer || parent.aplayerInstance;
              break;
            }
          }
        }
        
        if (foundAp) {
          window.ap = foundAp; // 确保全局可访问
          console.log('APlayer instance found:', foundAp);
          callback();
          return;
        }
      }
    }
    setTimeout(() => waitForAPlayer(callback), 200);
  }

  // 创建音乐控制按钮和面板
  function createMusicControl() {
    // 注释掉音乐控制按钮的创建 - 用户要求删除
    // const musicControl = document.createElement('div');
    // musicControl.className = 'music-control';
    // musicControl.innerHTML = '<i class="fa fa-music music-icon"></i>';
    
    // 创建控制面板
    const musicPanel = document.createElement('div');
    musicPanel.className = 'music-panel';
    musicPanel.innerHTML = `
      <div class="music-info">
        <div class="music-title">暂无播放</div>
        <div class="music-artist">点击播放音乐</div>
      </div>
      <div class="music-progress">
        <div class="progress-bar">
          <div class="progress-fill"></div>
        </div>
        <div class="progress-time">
          <span class="current-time">00:00</span>
          <span class="total-time">00:00</span>
        </div>
      </div>
      <div class="music-controls">
        <button class="control-btn prev-btn">
          <i class="fa fa-step-backward"></i>
        </button>
        <button class="control-btn play-pause">
          <i class="fa fa-play"></i>
        </button>
        <button class="control-btn next-btn">
          <i class="fa fa-step-forward"></i>
        </button>
      </div>
      <div class="music-volume">
        <i class="fa fa-volume-up volume-icon"></i>
        <div class="volume-slider">
          <div class="volume-fill"></div>
        </div>
        <span class="volume-value">70</span>
      </div>
    `;
    
    // 注释掉添加音乐控制按钮到页面 - 用户要求删除
    // document.body.appendChild(musicControl);
    document.body.appendChild(musicPanel);
    
    // 返回null代替musicControl，因为已被删除
    return { musicControl: null, musicPanel };
  }

  // 格式化时间
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // 初始化音乐控制功能
  function initMusicControl() {
    const { musicControl, musicPanel } = createMusicControl();
    let isExpanded = false;
    
    // 获取DOM元素 - musicControl已被删除，跳过相关元素获取
    const musicIcon = musicControl ? musicControl.querySelector('.music-icon') : null;
    const musicTitle = musicPanel.querySelector('.music-title');
    const musicArtist = musicPanel.querySelector('.music-artist');
    const progressFill = musicPanel.querySelector('.progress-fill');
    const progressBar = musicPanel.querySelector('.progress-bar');
    const currentTimeEl = musicPanel.querySelector('.current-time');
    const totalTimeEl = musicPanel.querySelector('.total-time');
    const playPauseBtn = musicPanel.querySelector('.play-pause');
    const prevBtn = musicPanel.querySelector('.prev-btn');
    const nextBtn = musicPanel.querySelector('.next-btn');
    const volumeSlider = musicPanel.querySelector('.volume-slider');
    const volumeFill = musicPanel.querySelector('.volume-fill');
    const volumeValue = musicPanel.querySelector('.volume-value');
    const volumeIcon = musicPanel.querySelector('.volume-icon');
    
    // 切换面板显示
    function togglePanel() {
      isExpanded = !isExpanded;
      musicPanel.classList.toggle('show', isExpanded);
    }
    
    // 更新播放状态
    function updatePlayState() {
      console.log('🎵 [DEBUG] updatePlayState() called');
      
      try {
        // 检查APlayer实例状态
        console.log('🎵 [DEBUG] APlayer instance check:', {
          hasWindowAp: !!window.ap,
          hasAudio: !!(window.ap && window.ap.audio),
          audioElement: window.ap ? window.ap.audio : null
        });
        
        if (!window.ap || !window.ap.audio) {
          console.log('🎵 [DEBUG] No APlayer instance or audio element found');
          musicControl.classList.remove('playing');
          playPauseBtn.innerHTML = '<i class="fa fa-play"></i>';
          musicIcon.className = 'fa fa-music music-icon';
          return;
        }
        
        // 获取播放状态详细信息
        const audioState = {
          paused: window.ap.audio.paused,
          ended: window.ap.audio.ended,
          currentTime: window.ap.audio.currentTime,
          duration: window.ap.audio.duration,
          readyState: window.ap.audio.readyState,
          networkState: window.ap.audio.networkState
        };
        
        console.log('🎵 [DEBUG] Audio element state:', audioState);
        
        const isPlaying = !window.ap.audio.paused && !window.ap.audio.ended;
        console.log('🎵 [DEBUG] Calculated playing state:', isPlaying);
        
        // 更新UI状态 - musicControl已被删除，跳过样式更新
        if (musicControl) {
          musicControl.classList.toggle('playing', isPlaying);
        }
        playPauseBtn.innerHTML = isPlaying ? '<i class="fa fa-pause"></i>' : '<i class="fa fa-play"></i>';
        if (musicIcon) {
          musicIcon.className = isPlaying ? 'fa fa-pause music-icon' : 'fa fa-music music-icon';
        }
        
        console.log('🎵 [DEBUG] UI updated - Play state:', isPlaying ? 'playing' : 'paused');
      } catch (error) {
        console.error('🎵 [ERROR] Error updating play state:', error);
        console.error('🎵 [ERROR] Stack trace:', error.stack);
        if (musicControl) {
          musicControl.classList.remove('playing');
        }
        playPauseBtn.innerHTML = '<i class="fa fa-play"></i>';
        if (musicIcon) {
          musicIcon.className = 'fa fa-music music-icon';
        }
      }
    }
    
    // 更新音乐信息
    function updateMusicInfo() {
      console.log('🎵 [DEBUG] updateMusicInfo() called');
      
      try {
        // 检查APlayer实例
        console.log('🎵 [DEBUG] APlayer instance check:', {
          hasWindowAp: !!window.ap,
          apType: typeof window.ap,
          apConstructor: window.ap ? window.ap.constructor.name : null
        });
        
        if (!window.ap) {
          console.log('🎵 [DEBUG] No APlayer instance, setting default text');
          musicTitle.textContent = '暂无播放';
          musicArtist.textContent = '点击播放音乐';
          return;
        }
        
        let currentMusic = null;
        let currentIndex = 0;
        
        // 检查播放列表信息
        console.log('🎵 [DEBUG] APlayer structure:', {
          hasList: !!(window.ap.list),
          listIndex: window.ap.list ? window.ap.list.index : 'N/A',
          hasAudios: !!(window.ap.list && window.ap.list.audios),
          audiosLength: window.ap.list && window.ap.list.audios ? window.ap.list.audios.length : 0,
          hasOptions: !!(window.ap.options),
          hasAudio: !!(window.ap.audio)
        });
        
        // 获取当前播放索引
        if (window.ap.list && typeof window.ap.list.index !== 'undefined') {
          currentIndex = window.ap.list.index;
          console.log('🎵 [DEBUG] Current index from list:', currentIndex);
        }
        
        // 尝试多种方式获取当前音乐信息
        if (window.ap.list && window.ap.list.audios && window.ap.list.audios[currentIndex]) {
          currentMusic = window.ap.list.audios[currentIndex];
          console.log('🎵 [DEBUG] Music info from list.audios[' + currentIndex + ']:', currentMusic);
        } else if (window.ap.options && window.ap.options.audio) {
          console.log('🎵 [DEBUG] Trying to get music info from options.audio');
          // 单首歌曲模式
          if (Array.isArray(window.ap.options.audio)) {
            currentMusic = window.ap.options.audio[currentIndex] || window.ap.options.audio[0];
            console.log('🎵 [DEBUG] Music info from options.audio array:', currentMusic);
          } else {
            currentMusic = window.ap.options.audio;
            console.log('🎵 [DEBUG] Music info from options.audio object:', currentMusic);
          }
        } else if (window.ap.audio) {
          console.log('🎵 [DEBUG] Trying to get music info from audio element attributes');
          // 从audio元素获取信息
          const audioEl = window.ap.audio;
          const audioAttributes = {
            title: audioEl.title,
            dataTitle: audioEl.getAttribute('data-title'),
            dataArtist: audioEl.getAttribute('data-artist'),
            dataAuthor: audioEl.getAttribute('data-author'),
            src: audioEl.src
          };
          console.log('🎵 [DEBUG] Audio element attributes:', audioAttributes);
          
          currentMusic = {
            name: audioEl.title || audioEl.getAttribute('data-title') || '未知歌曲',
            artist: audioEl.getAttribute('data-artist') || audioEl.getAttribute('data-author') || '未知艺术家'
          };
          console.log('🎵 [DEBUG] Music info from audio element:', currentMusic);
        }
        
        // 更新显示信息
        if (currentMusic) {
          const title = currentMusic.name || currentMusic.title || '未知歌曲';
          const artist = currentMusic.artist || currentMusic.author || '未知艺术家';
          
          console.log('🎵 [DEBUG] Final music info:', { title, artist, rawData: currentMusic });
          
          musicTitle.textContent = title;
          musicArtist.textContent = artist;
          
          console.log('🎵 [DEBUG] UI updated with music info - Title:', title, 'Artist:', artist);
        } else {
          console.log('🎵 [DEBUG] No music info available, setting default text');
          musicTitle.textContent = '音乐播放器';
          musicArtist.textContent = '准备就绪';
        }
      } catch (error) {
        console.error('🎵 [ERROR] Error updating music info:', error);
        console.error('🎵 [ERROR] Stack trace:', error.stack);
        musicTitle.textContent = '音乐播放器';
        musicArtist.textContent = '加载中...';
      }
    }
    
    // 更新进度条
    function updateProgress() {
      // 只在需要时输出调试信息，避免过多日志
      const shouldDebug = Math.random() < 0.01; // 1%的概率输出调试信息
      
      if (shouldDebug) {
        console.log('🎵 [DEBUG] updateProgress() called');
      }
      
      try {
        if (!window.ap || !window.ap.audio) {
          if (shouldDebug) {
            console.log('🎵 [DEBUG] No APlayer instance or audio for progress update');
          }
          progressFill.style.width = '0%';
          currentTimeEl.textContent = '00:00';
          totalTimeEl.textContent = '00:00';
          return;
        }
        
        const currentTime = window.ap.audio.currentTime || 0;
        const duration = window.ap.audio.duration || 0;
        
        if (shouldDebug) {
          console.log('🎵 [DEBUG] Progress data:', {
            currentTime,
            duration,
            isValidDuration: duration > 0 && !isNaN(duration) && isFinite(duration),
            readyState: window.ap.audio.readyState
          });
        }
        
        if (duration > 0 && !isNaN(duration) && isFinite(duration)) {
          const progress = Math.min((currentTime / duration) * 100, 100);
          progressFill.style.width = progress + '%';
          
          currentTimeEl.textContent = formatTime(currentTime);
          totalTimeEl.textContent = formatTime(duration);
          
          if (shouldDebug) {
            console.log('🎵 [DEBUG] Progress updated:', progress.toFixed(2) + '%');
          }
        } else {
          progressFill.style.width = '0%';
          currentTimeEl.textContent = formatTime(currentTime);
          totalTimeEl.textContent = '--:--';
          
          if (shouldDebug) {
            console.log('🎵 [DEBUG] Invalid duration, progress set to 0%');
          }
        }
      } catch (error) {
        console.error('🎵 [ERROR] Error updating progress:', error);
        console.error('🎵 [ERROR] Stack trace:', error.stack);
        progressFill.style.width = '0%';
        currentTimeEl.textContent = '00:00';
        totalTimeEl.textContent = '00:00';
      }
    }
    
    // 更新音量
    function updateVolume() {
      try {
        if (!window.ap) {
          volumeFill.style.width = '70%';
          volumeValue.textContent = '70';
          volumeIcon.className = 'fa fa-volume-up volume-icon';
          return;
        }
        
        let volume = 0.7; // 默认音量
        
        if (typeof window.ap.volume === 'function') {
          volume = window.ap.volume();
        } else if (window.ap.audio && typeof window.ap.audio.volume !== 'undefined') {
          volume = window.ap.audio.volume;
        }
        
        const volumePercent = Math.round(volume * 100);
        volumeFill.style.width = volumePercent + '%';
        volumeValue.textContent = volumePercent;
        
        // 更新音量图标
        if (volumePercent === 0) {
          volumeIcon.className = 'fa fa-volume-off volume-icon';
        } else if (volumePercent < 50) {
          volumeIcon.className = 'fa fa-volume-down volume-icon';
        } else {
          volumeIcon.className = 'fa fa-volume-up volume-icon';
        }
        
        console.log('Volume updated:', volume);
      } catch (error) {
        console.error('Error updating volume:', error);
        volumeFill.style.width = '70%';
        volumeValue.textContent = '70';
        volumeIcon.className = 'fa fa-volume-up volume-icon';
      }
    }
    
    // 事件监听 - musicControl已被删除，注释掉相关事件监听
    // musicControl.addEventListener('click', togglePanel);
    
    // 播放/暂停
    playPauseBtn.addEventListener('click', () => {
      if (!window.ap) return;
      window.ap.toggle();
    });
    
    // 上一首
    prevBtn.addEventListener('click', () => {
      if (!window.ap) return;
      window.ap.skipBack();
    });
    
    // 下一首
    nextBtn.addEventListener('click', () => {
      if (!window.ap) return;
      window.ap.skipForward();
    });
    
    // 进度条点击
    progressBar.addEventListener('click', (e) => {
      if (!window.ap) return;
      
      const rect = progressBar.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      const percentage = clickX / width;
      const duration = window.ap.audio.duration;
      
      if (duration) {
        window.ap.seek(percentage * duration);
      }
    });
    
    // 音量滑块点击
    volumeSlider.addEventListener('click', (e) => {
      if (!window.ap) return;
      
      const rect = volumeSlider.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      const percentage = Math.max(0, Math.min(1, clickX / width));
      
      window.ap.volume(percentage);
      updateVolume();
    });
    
    // 点击面板外部关闭
    document.addEventListener('click', (e) => {
      if (!musicControl.contains(e.target) && !musicPanel.contains(e.target)) {
        if (isExpanded) {
          togglePanel();
        }
      }
    });
    
    // APlayer事件监听
    function bindAPlayerEvents() {
      console.log('🎵 [DEBUG] bindAPlayerEvents() called');
      
      if (!window.ap) {
        console.log('🎵 [DEBUG] No APlayer instance found for event binding');
        return;
      }
      
      console.log('🎵 [DEBUG] Binding events to APlayer instance:', {
        instance: window.ap,
        hasOnMethod: typeof window.ap.on === 'function',
        hasAudio: !!window.ap.audio,
        hasList: !!window.ap.list
      });
      
      // 播放事件
      window.ap.on('play', () => {
        console.log('🎵 [DEBUG] APlayer play event triggered');
        console.log('🎵 [DEBUG] Event context:', {
          currentTime: window.ap.audio ? window.ap.audio.currentTime : 'N/A',
          paused: window.ap.audio ? window.ap.audio.paused : 'N/A',
          readyState: window.ap.audio ? window.ap.audio.readyState : 'N/A'
        });
        updatePlayState();
        updateMusicInfo();
      });
      
      // 暂停事件
      window.ap.on('pause', () => {
        console.log('🎵 [DEBUG] APlayer pause event triggered');
        console.log('🎵 [DEBUG] Event context:', {
          currentTime: window.ap.audio ? window.ap.audio.currentTime : 'N/A',
          paused: window.ap.audio ? window.ap.audio.paused : 'N/A'
        });
        updatePlayState();
      });
      
      // 时间更新事件
      window.ap.on('timeupdate', updateProgress);
      
      // 元数据加载完成
      window.ap.on('loadedmetadata', () => {
        console.log('🎵 [DEBUG] APlayer metadata loaded');
        console.log('🎵 [DEBUG] Metadata info:', {
          duration: window.ap.audio ? window.ap.audio.duration : 'N/A',
          readyState: window.ap.audio ? window.ap.audio.readyState : 'N/A',
          networkState: window.ap.audio ? window.ap.audio.networkState : 'N/A'
        });
        updateMusicInfo();
        updateProgress();
      });
      
      // 播放结束
      window.ap.on('ended', () => {
        console.log('🎵 [DEBUG] APlayer ended event triggered');
        updatePlayState();
      });
      
      // 音量变化
      window.ap.on('volumechange', () => {
        console.log('🎵 [DEBUG] APlayer volume change event');
        console.log('🎵 [DEBUG] Volume info:', {
          volume: window.ap.audio ? window.ap.audio.volume : 'N/A',
          muted: window.ap.audio ? window.ap.audio.muted : 'N/A'
        });
        updateVolume();
      });
      
      // 切换歌曲时更新信息
      window.ap.on('listswitch', (index) => {
        console.log('🎵 [DEBUG] APlayer list switched to index:', index);
        console.log('🎵 [DEBUG] List info:', {
          totalTracks: window.ap.list && window.ap.list.audios ? window.ap.list.audios.length : 'N/A',
          currentIndex: window.ap.list ? window.ap.list.index : 'N/A'
        });
        setTimeout(() => {
          updateMusicInfo();
          updatePlayState();
          updateProgress();
        }, 100);
      });
      
      // MetingJS特有事件监听
      if (window.ap.on) {
        // 监听歌曲加载事件
        try {
          window.ap.on('loadstart', () => {
            console.log('Song loading started');
            updateMusicInfo();
          });
          
          window.ap.on('canplay', () => {
            console.log('Song can play');
            updateMusicInfo();
            updateProgress();
          });
          
          window.ap.on('error', (error) => {
            console.error('APlayer error:', error);
            musicTitle.textContent = '播放错误';
            musicArtist.textContent = '请检查网络连接';
          });
        } catch (e) {
          console.log('Some events not supported:', e.message);
        }
      }
      
      // 监听原生audio事件作为备用
      if (window.ap.audio) {
        window.ap.audio.addEventListener('loadstart', () => {
          console.log('Audio loadstart event');
          updateMusicInfo();
        });
        
        window.ap.audio.addEventListener('canplay', () => {
          console.log('Audio canplay event');
          updateMusicInfo();
        });
        
        window.ap.audio.addEventListener('durationchange', () => {
          console.log('Audio duration changed');
          updateProgress();
        });
        
        window.ap.audio.addEventListener('timeupdate', () => {
          updateProgress();
        });
        
        window.ap.audio.addEventListener('play', () => {
          console.log('Native audio play event');
          updatePlayState();
          updateMusicInfo();
        });
        
        window.ap.audio.addEventListener('pause', () => {
          console.log('Native audio pause event');
          updatePlayState();
        });
      }
      
      // 初始化状态
      setTimeout(() => {
        updateMusicInfo();
        updatePlayState();
        updateVolume();
        updateProgress();
        console.log('Initial state updated');
      }, 300);
      
      console.log('APlayer events bound successfully');
    }
    
    // 等待APlayer初始化完成后绑定事件
    waitForAPlayer(bindAPlayerEvents);
    
    // 定期检查APlayer状态（防止某些事件未触发）
    setInterval(() => {
      if (window.ap && !window.ap.audio.paused) {
        updateProgress();
      }
    }, 1000);
  }

  // 检查是否存在APlayer相关元素
  function checkAPlayerExists() {
    const aplayerElements = document.querySelectorAll('.aplayer, [id*="aplayer"], [class*="aplayer"], meting-js');
    const metingElements = document.querySelectorAll('meting-js');
    return aplayerElements.length > 0 || metingElements.length > 0;
  }

  // 动态检测APlayer实例
  function detectAPlayerInstance() {
    console.log('🎵 [DEBUG] detectAPlayerInstance() called');
    console.log('🎵 [DEBUG] Detecting APlayer instance...');
    
    // 检查常见的全局变量
    const possibleInstances = [
      window.ap,
      window.aplayer,
      window.metingjs?.aplayer
    ];
    
    console.log('🎵 [DEBUG] Checking possible instances:', {
      windowAp: !!window.ap,
      windowAplayer: !!window.aplayer,
      metingjsAplayer: !!(window.metingjs?.aplayer)
    });
    
    for (let instance of possibleInstances) {
      if (instance && typeof instance.on === 'function') {
        console.log('🎵 [DEBUG] Found valid instance:', instance);
        return instance;
      }
    }
    
    // 检查DOM元素上的实例
    const aplayerElements = document.querySelectorAll('.aplayer');
    console.log('🎵 [DEBUG] Found APlayer elements:', aplayerElements.length);
    
    for (let element of aplayerElements) {
      console.log('🎵 [DEBUG] Checking element for instance:', {
        hasAplayer: !!element.aplayer,
        has_aplayer: !!element._aplayer,
        hasAplayerInstance: !!element.aplayerInstance
      });
      
      if (element.aplayer || element._aplayer || element.aplayerInstance) {
        const foundInstance = element.aplayer || element._aplayer || element.aplayerInstance;
        console.log('🎵 [DEBUG] Found instance from element:', foundInstance);
        return foundInstance;
      }
    }
    
    // 检查编号的实例
    for (let i = 0; i < 10; i++) {
      if (window['ap' + i] && typeof window['ap' + i].on === 'function') {
        console.log('🎵 [DEBUG] Found numbered instance ap' + i + ':', window['ap' + i]);
        return window['ap' + i];
      }
    }
    
    console.log('🎵 [DEBUG] No APlayer instance found in this detection cycle');
    return null;
  }

  // 延迟初始化函数
  function delayedInit() {
    if (checkAPlayerExists() || typeof APlayer !== 'undefined') {
      console.log('Initializing music control...');
      initMusicControl();
    } else {
      console.log('APlayer not found, will retry...');
      setTimeout(delayedInit, 1000);
    }
  }

  // 定期检查新的APlayer实例
  function startInstanceMonitoring() {
    setInterval(() => {
      if (!window.ap) {
        const newInstance = detectAPlayerInstance();
        if (newInstance) {
          console.log('New APlayer instance detected:', newInstance);
          window.ap = newInstance;
          // 重新绑定事件
          waitForAPlayer(() => {
            const { musicControl, musicPanel } = createMusicControl();
            if (musicControl && musicPanel) {
              console.log('Re-initializing with new instance');
            }
          });
        }
      }
    }, 2000);
  }

  // 启动实例监控
  startInstanceMonitoring();
  
  // 初始化
  if (checkAPlayerExists()) {
    console.log('APlayer elements found, initializing immediately');
    setTimeout(initMusicControl, 500);
  } else {
    console.log('APlayer elements not found, setting up observer');
    
    // 如果页面加载时没有APlayer，监听DOM变化
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) {
              if (node.classList && (node.classList.contains('aplayer') || node.tagName === 'METING-JS') ||
                  (node.querySelector && (node.querySelector('.aplayer') || node.querySelector('meting-js')))) {
                console.log('APlayer element detected, initializing...');
                observer.disconnect();
                setTimeout(initMusicControl, 800);
              }
            }
          });
        }
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // 备用延迟初始化
    setTimeout(delayedInit, 2000);
  }
  
  // 额外的MetingJS支持
  // 监听MetingJS可能触发的自定义事件
  document.addEventListener('aplayer-initialized', (event) => {
    console.log('APlayer initialized event detected:', event.detail);
    if (event.detail && event.detail.aplayer) {
      window.ap = event.detail.aplayer;
      setTimeout(initMusicControl, 100);
    }
  });
  
  // 监听可能的全局APlayer变量变化
  let lastApInstance = null;
  setInterval(() => {
    const currentAp = window.ap || window.aplayer;
    if (currentAp && currentAp !== lastApInstance) {
      console.log('Global APlayer instance changed:', currentAp);
      lastApInstance = currentAp;
      window.ap = currentAp;
    }
  }, 1000);
});