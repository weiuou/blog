// 本地音乐播放器核心脚本
class LocalMusicPlayer {
  constructor() {
    this.audio = document.getElementById('audio-player');
    this.playlist = [];
    this.currentIndex = 0;
    this.isPlaying = false;
    this.isShuffled = false;
    this.repeatMode = 'none'; // none, one, all
    this.volume = 1.0;
    
    this.init();
  }

  init() {
    this.loadPlaylist();
    this.bindEvents();
    this.updateUI();
    
    // 与悬浮窗同步的全局变量
    window.localMusicPlayer = this;
    
    console.log('本地音乐播放器初始化完成');
  }

  // 加载播放列表
  async loadPlaylist() {
    try {
      // 先尝试从本地存储加载
      if (this.loadPlaylistFromStorage()) {
        this.renderPlaylist();
        this.updateStats();
        console.log('从本地存储加载播放列表，共', this.playlist.length, '首歌曲');
        return;
      }
      
      // 如果本地存储没有，则加载默认播放列表
      const musicFiles = [
        '24kGoldn,iann dior - Mood.mp3',
        '5 Seconds of Summer - Teeth.mp3',
        'ANZA - 扉をあけて.mp3',
        'Alan Walker,Sorana - Lost Control.mp3',
        'Anjulie,Oskar Flood - Where The Love Goes.mp3',
        'Antoine Chambe - Easy Come.mp3',
        'AuRa - Ghost (Acoustic).mp3',
        'Austin Mahone,Rich Homie Quan - Send It (feat. Rich Homie Quan).mp3',
        'Avicii,Sandro Cavazza - Without You.mp3',
        'Bali Bandits - Roll \'n Rock.mp3',
        'Beau Young Prince - Let Go.mp3',
        'Beyond - 光辉岁月.mp3',
        'Beyond - 真的爱你.mp3',
        'Blanks - Better Now.mp3',
        'Boyce Avenue - Perfect.mp3',
        'Bruno Mars - Runaway Baby.mp3'
      ];

      this.playlist = musicFiles.map((filename, index) => {
        const songInfo = this.parseSongInfo(filename);
        // 使用双重编码确保中文文件名正确处理
        const encodedFilename = encodeURIComponent(encodeURIComponent(filename));
        return {
          id: index,
          filename: filename,
          title: songInfo.title,
          artist: songInfo.artist,
          url: `/music/${encodedFilename}`,
          duration: '00:00' // 将在加载时获取
        };
      });

      this.renderPlaylist();
      this.updateStats();
      this.savePlaylist();
      
      console.log('播放列表加载完成，共', this.playlist.length, '首歌曲');
    } catch (error) {
      console.error('加载播放列表失败:', error);
    }
  }
  
  // 从本地存储加载播放列表
  loadPlaylistFromStorage() {
    try {
      const saved = localStorage.getItem('localMusicPlaylist');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.playlist && Array.isArray(data.playlist)) {
          this.playlist = data.playlist;
          this.currentIndex = data.currentIndex || 0;
          return true;
        }
      }
    } catch (error) {
      console.error('从本地存储加载播放列表失败:', error);
    }
    return false;
  }

  // 解析歌曲信息（从文件名）
  parseSongInfo(filename) {
    // 移除文件扩展名
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
    
    // 常见的分隔符模式
    const separators = [' - ', '-', '–', '—', '_', '|'];
    
    for (const separator of separators) {
      if (nameWithoutExt.includes(separator)) {
        const parts = nameWithoutExt.split(separator);
        if (parts.length >= 2) {
          const artist = parts[0].trim();
          const title = parts.slice(1).join(separator).trim();
          
          // 验证解析结果
          if (artist && title && artist.length > 0 && title.length > 0) {
            return {
              artist: this.cleanString(artist),
              title: this.cleanString(title)
            };
          }
        }
      }
    }
    
    // 尝试解析数字开头的格式 "01. 艺术家 - 歌曲名"
    const trackNumberMatch = nameWithoutExt.match(/^\d+\.?\s*(.+)$/);
    if (trackNumberMatch) {
      const withoutTrackNumber = trackNumberMatch[1];
      for (const separator of separators) {
        if (withoutTrackNumber.includes(separator)) {
          const parts = withoutTrackNumber.split(separator);
          if (parts.length >= 2) {
            const artist = parts[0].trim();
            const title = parts.slice(1).join(separator).trim();
            
            if (artist && title && artist.length > 0 && title.length > 0) {
              return {
                artist: this.cleanString(artist),
                title: this.cleanString(title)
              };
            }
          }
        }
      }
    }
    
    // 如果没有找到分隔符，整个文件名作为歌曲名
    return {
      artist: '未知艺术家',
      title: this.cleanString(nameWithoutExt)
    };
  }
  
  // 清理字符串，移除多余的空格和特殊字符
  cleanString(str) {
    return str.replace(/\s+/g, ' ').trim();
  }
  
  // 处理文件上传
  handleFileUpload(files) {
    if (!files || files.length === 0) return;
    
    Array.from(files).forEach(file => {
      if (file.type.startsWith('audio/')) {
        const url = URL.createObjectURL(file);
        const songInfo = this.parseSongInfo(file.name);
        
        const newSong = {
          id: Date.now() + Math.random(),
          filename: file.name,
          title: songInfo.title,
          artist: songInfo.artist,
          url: url,
          duration: '00:00',
          isLocal: true // 标记为本地文件
        };
        
        this.playlist.push(newSong);
      }
    });
    
    this.renderPlaylist();
    this.updateStats();
    this.savePlaylist();
    this.showNotification(`已添加 ${files.length} 个音频文件`);
  }

  // 渲染播放列表
  renderPlaylist() {
    const playlistElement = document.getElementById('playlist');
    if (!playlistElement) return;

    playlistElement.innerHTML = this.playlist.map((song, index) => `
      <div class="playlist-item" data-index="${index}" ${index === this.currentIndex ? 'class="playlist-item active"' : ''}>
        <div class="song-info">
          <div class="song-title">${song.title}</div>
          <div class="song-artist">${song.artist}</div>
        </div>
        <div class="song-controls">
          <div class="song-duration">${song.duration}</div>
          <div class="song-actions">
            <button class="btn-move-up" title="上移" ${index === 0 ? 'disabled' : ''}>
              <i class="fa fa-arrow-up"></i>
            </button>
            <button class="btn-move-down" title="下移" ${index === this.playlist.length - 1 ? 'disabled' : ''}>
              <i class="fa fa-arrow-down"></i>
            </button>
            <button class="btn-remove" title="移除">
              <i class="fa fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `).join('');

    // 绑定播放列表点击事件
    playlistElement.addEventListener('click', (e) => {
      const item = e.target.closest('.playlist-item');
      if (item) {
        const index = parseInt(item.dataset.index);
        
        // 检查点击的是否是控制按钮
        if (e.target.closest('.btn-move-up')) {
          e.stopPropagation();
          this.moveSong(index, index - 1);
          return;
        }
        
        if (e.target.closest('.btn-move-down')) {
          e.stopPropagation();
          this.moveSong(index, index + 1);
          return;
        }
        
        if (e.target.closest('.btn-remove')) {
          e.stopPropagation();
          this.removeSong(index);
          return;
        }
        
        // 如果不是按钮，则播放歌曲
        if (!e.target.closest('.song-actions')) {
          this.playTrack(index);
        }
      }
    });
  }
  
  // 移动歌曲位置
  moveSong(fromIndex, toIndex) {
    if (fromIndex < 0 || fromIndex >= this.playlist.length || 
        toIndex < 0 || toIndex >= this.playlist.length) {
      return;
    }
    
    const song = this.playlist.splice(fromIndex, 1)[0];
    this.playlist.splice(toIndex, 0, song);
    
    // 更新当前播放索引
    if (this.currentIndex === fromIndex) {
      this.currentIndex = toIndex;
    } else if (this.currentIndex > fromIndex && this.currentIndex <= toIndex) {
      this.currentIndex--;
    } else if (this.currentIndex < fromIndex && this.currentIndex >= toIndex) {
      this.currentIndex++;
    }
    
    this.renderPlaylist();
    this.savePlaylist();
  }
  
  // 移除歌曲
  removeSong(index) {
    if (index < 0 || index >= this.playlist.length) {
      return;
    }
    
    // 如果移除的是当前播放的歌曲
    if (index === this.currentIndex) {
      this.pause();
      if (this.playlist.length > 1) {
        // 如果不是最后一首，播放下一首
        if (index < this.playlist.length - 1) {
          this.currentIndex = index;
        } else {
          // 如果是最后一首，播放前一首
          this.currentIndex = index - 1;
        }
      } else {
        // 如果只有一首歌，清空播放器
        this.currentIndex = 0;
      }
    } else if (index < this.currentIndex) {
      // 如果移除的歌曲在当前播放歌曲之前，调整索引
      this.currentIndex--;
    }
    
    this.playlist.splice(index, 1);
    
    if (this.playlist.length === 0) {
      this.currentIndex = 0;
    }
    
    this.renderPlaylist();
    this.savePlaylist();
    this.updateUI();
  }
  
  // 随机播放列表
  shufflePlaylist() {
    if (this.playlist.length <= 1) return;
    
    const currentSong = this.getCurrentSong();
    
    // Fisher-Yates 洗牌算法
    for (let i = this.playlist.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.playlist[i], this.playlist[j]] = [this.playlist[j], this.playlist[i]];
    }
    
    // 重新找到当前播放歌曲的索引
    if (currentSong) {
      this.currentIndex = this.playlist.findIndex(song => song.url === currentSong.url);
    }
    
    this.renderPlaylist();
    this.savePlaylist();
  }
  
  // 保存播放列表到本地存储
  savePlaylist() {
    try {
      localStorage.setItem('localMusicPlaylist', JSON.stringify({
        playlist: this.playlist,
        currentIndex: this.currentIndex
      }));
    } catch (error) {
      console.error('保存播放列表失败:', error);
    }
  }

  // 绑定事件
  bindEvents() {
    // 播放/暂停按钮
    const playPauseBtn = document.getElementById('play-pause-btn');
    if (playPauseBtn) {
      playPauseBtn.addEventListener('click', () => this.togglePlay());
    }

    // 上一首/下一首
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    if (prevBtn) prevBtn.addEventListener('click', () => this.previousTrack());
    if (nextBtn) nextBtn.addEventListener('click', () => this.nextTrack());

    // 随机播放
    const shuffleBtn = document.getElementById('shuffle-btn');
    if (shuffleBtn) {
      shuffleBtn.addEventListener('click', () => this.toggleShuffle());
    }

    // 循环播放
    const repeatBtn = document.getElementById('repeat-btn');
    if (repeatBtn) {
      repeatBtn.addEventListener('click', () => this.toggleRepeat());
    }

    // 绑定播放列表控制按钮事件
    const addMusicBtn = document.getElementById('add-music-btn');
    const musicFileInput = document.getElementById('music-file-input');
    if (addMusicBtn && musicFileInput) {
      addMusicBtn.addEventListener('click', () => {
        musicFileInput.click();
      });
      
      musicFileInput.addEventListener('change', (e) => {
        this.handleFileUpload(e.target.files);
      });
    }
    
    const shufflePlaylistBtn = document.getElementById('shuffle-playlist-btn');
    if (shufflePlaylistBtn) {
      shufflePlaylistBtn.addEventListener('click', () => {
        this.shufflePlaylist();
        this.showNotification('播放列表已随机排序');
      });
    }
     
    const clearPlaylistBtn = document.getElementById('clear-playlist-btn');
    if (clearPlaylistBtn) {
      clearPlaylistBtn.addEventListener('click', () => {
        if (confirm('确定要清空播放列表吗？')) {
          this.clearPlaylist();
          this.showNotification('播放列表已清空');
        }
      });
    }

    // 恢复默认播放列表按钮
    const restorePlaylistBtn = document.getElementById('restore-playlist-btn');
    if (restorePlaylistBtn) {
      restorePlaylistBtn.addEventListener('click', () => {
        this.restoreDefaultPlaylist();
      });
    }

    // 进度条
    const progressTrack = document.querySelector('.progress-track');
    if (progressTrack) {
      progressTrack.addEventListener('click', (e) => this.seekTo(e));
    }

    // 音量控制
    const volumeTrack = document.querySelector('.volume-track');
    if (volumeTrack) {
      volumeTrack.addEventListener('click', (e) => this.setVolume(e));
    }

    // 播放列表控制
    const refreshBtn = document.getElementById('refresh-playlist');
    const clearBtn = document.getElementById('clear-playlist');
    if (refreshBtn) refreshBtn.addEventListener('click', () => this.loadPlaylist());
    if (clearBtn) clearBtn.addEventListener('click', () => this.clearPlaylist());

    // 音频事件
    if (this.audio) {
      this.audio.addEventListener('loadedmetadata', () => this.onLoadedMetadata());
      this.audio.addEventListener('timeupdate', () => this.onTimeUpdate());
      this.audio.addEventListener('ended', () => this.onTrackEnded());
      this.audio.addEventListener('error', (e) => this.onAudioError(e));
      this.audio.addEventListener('canplay', () => {
        console.log('音频可以播放:', this.getCurrentSong()?.title);
      });
    }

    // 键盘快捷键
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));
  }

  // 播放指定曲目
  playTrack(index) {
    if (index < 0 || index >= this.playlist.length) return;
    
    // 先停止当前播放，避免播放中断错误
    if (this.audio && !this.audio.paused) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
    
    this.currentIndex = index;
    const song = this.playlist[index];
    
    console.log('播放歌曲:', song.title, 'by', song.artist);
    
    this.audio.src = song.url;
    this.audio.load();
    
    // 更新UI
    this.updateCurrentSongInfo();
    this.updatePlaylistActive();
    this.updateStats();
    
    // 开始播放
    this.play();
    
    // 通知悬浮窗更新
    this.notifyFloatingController();
  }

  // 播放
  play() {
    if (this.audio && this.playlist.length > 0) {
      // 确保音频已加载
      if (this.audio.readyState < 2) {
        this.audio.addEventListener('canplay', () => {
          this.attemptPlay();
        }, { once: true });
        return;
      }
      
      this.attemptPlay();
    }
  }
  
  // 尝试播放音频
  attemptPlay() {
    this.audio.play().then(() => {
      this.isPlaying = true;
      this.updatePlayButton();
      this.notifyFloatingController();
      console.log('开始播放:', this.getCurrentSong()?.title);
    }).catch(error => {
      console.error('播放失败:', error.name, error.message);
      
      // 如果是因为用户交互问题，提示用户
      if (error.name === 'NotAllowedError') {
        console.log('需要用户交互才能播放音频');
      } else if (error.name === 'AbortError') {
        console.log('播放被中断，可能是因为加载了新的音频');
      } else if (error.name === 'NotSupportedError') {
        console.log('音频格式不支持或文件损坏');
      }
      
      this.isPlaying = false;
      this.updatePlayButton();
      this.notifyFloatingController();
    });
  }

  // 暂停
  pause() {
    if (this.audio) {
      this.audio.pause();
      this.isPlaying = false;
      this.updatePlayButton();
      this.notifyFloatingController(); // 通知悬浮窗更新
      console.log('暂停播放');
    }
  }

  // 切换播放/暂停
  togglePlay() {
    if (this.playlist.length === 0) {
      console.log('播放列表为空');
      return;
    }
    
    if (!this.audio.src && this.playlist.length > 0) {
      this.playTrack(0);
      return;
    }
    
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  // 上一首
  previousTrack() {
    if (this.playlist.length === 0) return;
    
    let newIndex;
    if (this.isShuffled) {
      newIndex = Math.floor(Math.random() * this.playlist.length);
    } else {
      newIndex = this.currentIndex - 1;
      if (newIndex < 0) {
        newIndex = this.playlist.length - 1;
      }
    }
    
    this.playTrack(newIndex);
  }

  // 下一首
  nextTrack() {
    if (this.playlist.length === 0) return;
    
    let newIndex;
    if (this.isShuffled) {
      newIndex = Math.floor(Math.random() * this.playlist.length);
    } else {
      newIndex = this.currentIndex + 1;
      if (newIndex >= this.playlist.length) {
        newIndex = 0;
      }
    }
    
    this.playTrack(newIndex);
  }

  // 切换随机播放
  toggleShuffle() {
    this.isShuffled = !this.isShuffled;
    const shuffleBtn = document.getElementById('shuffle-btn');
    if (shuffleBtn) {
      shuffleBtn.classList.toggle('active', this.isShuffled);
    }
    console.log('随机播放:', this.isShuffled ? '开启' : '关闭');
  }

  // 切换循环播放
  toggleRepeat() {
    const modes = ['none', 'one', 'all'];
    const currentModeIndex = modes.indexOf(this.repeatMode);
    this.repeatMode = modes[(currentModeIndex + 1) % modes.length];
    
    const repeatBtn = document.getElementById('repeat-btn');
    if (repeatBtn) {
      repeatBtn.classList.toggle('active', this.repeatMode !== 'none');
      repeatBtn.title = this.repeatMode === 'one' ? '单曲循环' : 
                       this.repeatMode === 'all' ? '列表循环' : '循环播放';
    }
    
    console.log('循环模式:', this.repeatMode);
  }

  // 跳转到指定位置
  seekTo(event) {
    if (!this.audio || !this.audio.duration) return;
    
    const progressTrack = event.currentTarget;
    const rect = progressTrack.getBoundingClientRect();
    const percent = (event.clientX - rect.left) / rect.width;
    const newTime = percent * this.audio.duration;
    
    this.audio.currentTime = newTime;
    console.log('跳转到:', this.formatTime(newTime));
  }

  // 设置音量
  setVolume(event) {
    const volumeTrack = event.currentTarget;
    const rect = volumeTrack.getBoundingClientRect();
    const percent = (event.clientX - rect.left) / rect.width;
    
    this.volume = Math.max(0, Math.min(1, percent));
    if (this.audio) {
      this.audio.volume = this.volume;
    }
    
    this.updateVolumeUI();
    this.notifyFloatingController(); // 通知悬浮窗更新音量
    console.log('音量设置为:', Math.round(this.volume * 100) + '%');
  }

  // 清空播放列表
  clearPlaylist() {
    this.pause();
    this.playlist = [];
    this.currentIndex = 0;
    this.renderPlaylist();
    this.updateStats();
    this.updateCurrentSongInfo();
    this.savePlaylist();
    console.log('播放列表已清空');
  }

  // 恢复默认播放列表
  async restoreDefaultPlaylist() {
    if (confirm('确定要恢复默认播放列表吗？这将覆盖当前的播放列表。')) {
      try {
        // 暂停当前播放
        this.pause();
        
        // 重新加载默认播放列表
        const musicFiles = [
          '24kGoldn,iann dior - Mood.mp3',
          '5 Seconds of Summer - Teeth.mp3',
          'ANZA - 扉をあけて.mp3',
          'Alan Walker,Sorana - Lost Control.mp3',
          'Anjulie,Oskar Flood - Where The Love Goes.mp3',
          'Antoine Chambe - Easy Come.mp3',
          'AuRa - Ghost (Acoustic).mp3',
          'Austin Mahone,Rich Homie Quan - Send It (feat. Rich Homie Quan).mp3',
          'Avicii,Sandro Cavazza - Without You.mp3',
          'Bali Bandits - Roll \'n Rock.mp3',
          'Beau Young Prince - Let Go.mp3',
          'Beyond - 光辉岁月.mp3',
          'Beyond - 真的爱你.mp3',
          'Blanks - Better Now.mp3',
          'Boyce Avenue - Perfect.mp3',
          'Bruno Mars - Runaway Baby.mp3'
        ];

        this.playlist = musicFiles.map((filename, index) => {
          const songInfo = this.parseSongInfo(filename);
          // 使用双重编码确保中文文件名正确处理
          const encodedFilename = encodeURIComponent(encodeURIComponent(filename));
          return {
            id: index,
            filename: filename,
            title: songInfo.title,
            artist: songInfo.artist,
            url: `/music/${encodedFilename}`,
            duration: '00:00' // 将在加载时获取
          };
        });

        this.currentIndex = 0;
        this.renderPlaylist();
        this.updateStats();
        this.updateCurrentSongInfo();
        this.savePlaylist();
        
        this.showNotification('默认播放列表已恢复！');
        console.log('默认播放列表已恢复，共', this.playlist.length, '首歌曲');
      } catch (error) {
        console.error('恢复默认播放列表失败:', error);
        this.showNotification('恢复播放列表失败，请重试');
      }
    }
  }

  // 获取当前歌曲
  getCurrentSong() {
    return this.playlist[this.currentIndex] || null;
  }

  // 格式化时间
  formatTime(seconds) {
    if (isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // 更新当前歌曲信息
  updateCurrentSongInfo() {
    const song = this.getCurrentSong();
    
    const titleElement = document.getElementById('current-song-title');
    const artistElement = document.getElementById('current-song-artist');
    
    if (song) {
      if (titleElement) titleElement.textContent = song.title;
      if (artistElement) artistElement.textContent = song.artist;
    } else {
      if (titleElement) titleElement.textContent = '未选择歌曲';
      if (artistElement) artistElement.textContent = '未知艺术家';
    }
  }

  // 更新播放按钮
  updatePlayButton() {
    const playIcon = document.getElementById('play-icon');
    const pauseIcon = document.getElementById('pause-icon');
    
    if (playIcon && pauseIcon) {
      if (this.isPlaying) {
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'block';
      } else {
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
      }
    }
  }

  // 更新播放列表激活状态
  updatePlaylistActive() {
    const items = document.querySelectorAll('.playlist-item');
    items.forEach((item, index) => {
      item.classList.toggle('active', index === this.currentIndex);
    });
  }

  // 更新统计信息
  updateStats() {
    const currentIndexElement = document.getElementById('current-song-index');
    const totalSongsElement = document.getElementById('total-songs');
    const songCountElement = document.getElementById('song-count');
    const totalDurationElement = document.getElementById('total-duration');
    
    // 更新当前歌曲索引和总歌曲数
    if (currentIndexElement) {
      currentIndexElement.textContent = this.playlist.length > 0 ? this.currentIndex + 1 : 0;
    }
    if (totalSongsElement) {
      totalSongsElement.textContent = this.playlist.length;
    }
    
    // 更新播放列表统计信息
    if (songCountElement) {
      songCountElement.textContent = `${this.playlist.length} 首歌曲`;
    }
    
    if (totalDurationElement) {
      // 计算总时长
      let totalSeconds = 0;
      this.playlist.forEach(song => {
        if (song.durationSeconds) {
          totalSeconds += song.durationSeconds;
        }
      });
      
      const totalDurationText = totalSeconds > 0 ? this.formatTime(totalSeconds) : '00:00';
      totalDurationElement.textContent = `总时长: ${totalDurationText}`;
    }
  }

  // 更新进度条
  updateProgress() {
    if (!this.audio || !this.audio.duration) return;
    
    const percent = (this.audio.currentTime / this.audio.duration) * 100;
    
    const progressFill = document.getElementById('progress-fill');
    const progressHandle = document.getElementById('progress-handle');
    
    if (progressFill) progressFill.style.width = percent + '%';
    if (progressHandle) progressHandle.style.left = percent + '%';
  }

  // 更新时间显示
  updateTimeDisplay() {
    const currentTimeElement = document.getElementById('current-time');
    const totalTimeElement = document.getElementById('total-time');
    
    if (currentTimeElement && this.audio) {
      currentTimeElement.textContent = this.formatTime(this.audio.currentTime);
    }
    
    if (totalTimeElement && this.audio && this.audio.duration) {
      totalTimeElement.textContent = this.formatTime(this.audio.duration);
    }
  }

  // 更新音量UI
  updateVolumeUI() {
    const volumeFill = document.getElementById('volume-fill');
    const volumeHandle = document.getElementById('volume-handle');
    const volumeValue = document.getElementById('volume-value');
    
    const percent = this.volume * 100;
    
    if (volumeFill) volumeFill.style.width = percent + '%';
    if (volumeHandle) volumeHandle.style.right = (100 - percent) + '%';
    if (volumeValue) volumeValue.textContent = Math.round(percent);
  }

  // 更新UI
  updateUI() {
    this.updateCurrentSongInfo();
    this.updatePlayButton();
    this.updatePlaylistActive();
    this.updateStats();
    this.updateVolumeUI();
  }

  // 音频元数据加载完成
  onLoadedMetadata() {
    this.updateTimeDisplay();
    
    // 更新播放列表中的时长
    const song = this.getCurrentSong();
    if (song && this.audio.duration) {
      song.duration = this.formatTime(this.audio.duration);
      song.durationSeconds = this.audio.duration; // 保存秒数用于统计
      this.renderPlaylist();
      this.updateStats(); // 更新统计信息
    }
  }

  // 时间更新
  onTimeUpdate() {
    this.updateProgress();
    this.updateTimeDisplay();
    
    // 通知悬浮窗更新进度
    this.notifyFloatingController();
  }

  // 曲目结束
  onTrackEnded() {
    console.log('歌曲播放结束');
    
    if (this.repeatMode === 'one') {
      // 单曲循环
      this.audio.currentTime = 0;
      this.play();
    } else if (this.repeatMode === 'all' || this.currentIndex < this.playlist.length - 1) {
      // 列表循环或还有下一首
      this.nextTrack();
    } else {
      // 播放结束
      this.isPlaying = false;
      this.updatePlayButton();
    }
  }

  // 音频错误
  onAudioError(event) {
    console.error('音频播放错误:', event);
    const song = this.getCurrentSong();
    if (song) {
      console.error('无法播放:', song.title, '文件路径:', song.url);
    }
  }

  // 键盘快捷键
  handleKeyboard(event) {
    // 只在播放器页面响应快捷键
    if (!document.getElementById('local-music-player')) return;
    
    switch (event.code) {
      case 'Space':
        event.preventDefault();
        this.togglePlay();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        this.previousTrack();
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.nextTrack();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.volume = Math.min(1, this.volume + 0.1);
        this.audio.volume = this.volume;
        this.updateVolumeUI();
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.volume = Math.max(0, this.volume - 0.1);
        this.audio.volume = this.volume;
        this.updateVolumeUI();
        break;
    }
  }

  // 通知悬浮窗控制器
  notifyFloatingController() {
    // 创建自定义事件，供悬浮窗监听
    const event = new CustomEvent('localMusicUpdate', {
      detail: {
        isPlaying: this.isPlaying,
        currentSong: this.getCurrentSong(),
        currentTime: this.audio ? this.audio.currentTime : 0,
        duration: this.audio ? this.audio.duration : 0,
        volume: this.volume,
        progress: this.audio && this.audio.duration ? 
                 (this.audio.currentTime / this.audio.duration) * 100 : 0
      }
    });
    
    document.dispatchEvent(event);
  }

  // 显示通知
  showNotification(message, duration = 3000) {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = 'music-notification';
    notification.textContent = message;
    
    // 添加样式
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      font-size: 14px;
      z-index: 10000;
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // 显示动画
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateX(0)';
    }, 10);
    
    // 自动隐藏
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, duration);
  }

  // 供悬浮窗调用的方法
  getPlayerState() {
    return {
      isPlaying: this.isPlaying,
      currentSong: this.getCurrentSong(),
      currentTime: this.audio ? this.audio.currentTime : 0,
      duration: this.audio ? this.audio.duration : 0,
      volume: this.volume,
      progress: this.audio && this.audio.duration ? 
               (this.audio.currentTime / this.audio.duration) * 100 : 0,
      playlist: this.playlist,
      currentIndex: this.currentIndex
    };
  }
}

// 页面加载完成后初始化播放器
document.addEventListener('DOMContentLoaded', function() {
  // 检查是否在音乐播放器页面
  if (document.getElementById('local-music-player')) {
    console.log('初始化本地音乐播放器...');
    window.musicPlayer = new LocalMusicPlayer();
  }
});

// 导出供其他脚本使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LocalMusicPlayer;
}