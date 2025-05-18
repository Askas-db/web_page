class MusicPlayer {
    constructor() {
        this.audio = document.getElementById('audio-player');
        this.playBtn = document.getElementById('play-btn');
        this.prevBtn = document.getElementById('prev-btn');
        this.nextBtn = document.getElementById('next-btn');
        this.progressBar = document.getElementById('progress-bar');
        this.currentTimeEl = document.getElementById('current-time');
        this.durationEl = document.getElementById('duration');
        this.volumeSlider = document.getElementById('volume-slider');
        this.playlistEl = document.getElementById('playlist');
        this.songUrlInput = document.getElementById('song-url');
        this.addBtn = document.getElementById('add-btn');
        this.fileInput = document.getElementById('file-input');
        this.uploadBtn = document.getElementById('upload-btn');
		//hls 
		this.hls = null;
        this.isHls = false;
        this.streamingIndicator = document.createElement('span');
        this.streamingIndicator.className = 'streaming-indicator';
		
        this.playlist = [];
        this.currentSongIndex = 0;
        this.isPlaying = false;

        this.initialize();
    }

    initialize() {
        // Set up event listeners
        this.playBtn.addEventListener('click', () => this.togglePlay());
        this.prevBtn.addEventListener('click', () => this.prevSong());
        this.nextBtn.addEventListener('click', () => this.nextSong());
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('ended', () => this.nextSong());
        this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
        this.volumeSlider.addEventListener('input', () => this.setVolume());
        this.addBtn.addEventListener('click', () => this.addSongFromUrl());
        this.uploadBtn.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
		// this.playBtn.appendChild(this.streamingIndicator);
		
        // Initialize volume
        this.audio.volume = this.volumeSlider.value;

        // Load default playlist
        this.loadDefaultPlaylist();

        // Set up progress bar click
        this.progressBar.addEventListener('click', (e) => this.setProgress(e));
    }

    loadDefaultPlaylist() {
        // Add default songs from local assets
        const defaultSongs = [
            { title: 'Luschn - DLT', url: 'assets/audio/Luschn - DLT.mp3' },
            { title: 'Luschn - Race', url: 'assets/audio/Luschn - Race.mp3' }
        ];

        defaultSongs.forEach(song => {
            this.addToPlaylist(song.title, song.url);
        });
    }

    addToPlaylist(title, url) {
        this.playlist.push({ title, url });
        this.renderPlaylist();
    }

    renderPlaylist() {
        this.playlistEl.innerHTML = '';
        this.playlist.forEach((song, index) => {
            const li = document.createElement('li');
            li.textContent = song.title;
            if (index === this.currentSongIndex && this.isPlaying) {
                li.classList.add('playing');
            }
            li.addEventListener('click', () => {
                this.currentSongIndex = index;
                this.loadSong();
                this.play();
            });
            this.playlistEl.appendChild(li);
        });
    }

    loadSong() {
        if (this.playlist.length === 0) return;

        const song = this.playlist[this.currentSongIndex];
        this.audio.src = song.url;
        this.audio.load();
		// Check if this is an HLS stream
        this.isHls = song.url.endsWith('.m3u8') || song.url.includes('.m3u8?');
		if (this.isHls) {
            this.setupHlsPlayer(song.url);
        } else {
            this.setupRegularPlayer(song.url);
        }
        // Update playlist UI
        const items = this.playlistEl.querySelectorAll('li');
        items.forEach((item, index) => {
            item.classList.remove('playing');
            if (index === this.currentSongIndex) {
                item.classList.add('playing');
            }
        });
    }
	
	setupHlsPlayer(url) {
        // Destroy existing HLS instance if any
        if (this.hls) {
            this.hls.destroy();
        }

        // Create new HLS instance
        if (Hls.isSupported()) {
            this.hls = new Hls();
            this.hls.loadSource(url);
            this.hls.attachMedia(this.audio);

            // Handle HLS events
            this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
                this.play();
                this.streamingIndicator.classList.add('active');
            });

            this.hls.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            console.error('Fatal network error encountered');
                            this.hls.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            console.error('Fatal media error encountered');
                            this.hls.recoverMediaError();
                            break;
                        default:
                            console.error('Fatal error encountered');
                            this.setupRegularPlayer(url);
                            break;
                    }
                }
            });
        } else if (this.audio.canPlayType('application/vnd.apple.mpegurl')) {
            // Native HLS support (Safari)
            this.audio.src = url;
            this.play();
            this.streamingIndicator.classList.add('active');
        } else {
            console.error('HLS is not supported in this browser');
            alert('HLS streaming is not supported in your browser. Trying regular audio playback.');
            this.setupRegularPlayer(url);
        }
    }

	setupRegularPlayer(url) {
        this.audio.src = url;
        this.streamingIndicator.classList.remove('active');
    }

    play() {
		if (this.isHls) {
            // For HLS, we need to wait for the manifest to be parsed
            if (this.hls) {
                this.audio.play()
                    .then(() => {
                        this.isPlaying = true;
                        this.playBtn.textContent = '⏸';
                    })
                    .catch(error => {
                        console.error('Error playing HLS stream:', error);
                        alert('Error playing HLS stream. Please check the URL and try again.');
                    });
            }
        } else {
            // Regular playback
        this.audio.play()
            .then(() => {
                this.isPlaying = true;
                this.playBtn.textContent = '⏸';
            })
            .catch(error => {
                console.error('Error playing audio:', error);
                alert('Error playing audio. Please check the file and try again.');
            });
		}
    }

    pause() {
        this.audio.pause();
        this.isPlaying = false;
        this.playBtn.textContent = '▶';
    }

    togglePlay() {
        if (this.playlist.length === 0) return;

        if (this.isPlaying) {
            this.pause();
        } else {
            if (this.audio.src) {
                this.play();
            } else {
                this.loadSong();
                this.play();
            }
        }
    }

    nextSong() {
        if (this.playlist.length === 0) return;

        this.currentSongIndex = (this.currentSongIndex + 1) % this.playlist.length;
        this.loadSong();
        this.play();
    }

    prevSong() {
        if (this.playlist.length === 0) return;

        this.currentSongIndex = (this.currentSongIndex - 1 + this.playlist.length) % this.playlist.length;
        this.loadSong();
        this.play();
    }

    updateProgress() {
        if (this.audio.duration) {
            const progressPercent = (this.audio.currentTime / this.audio.duration) * 100;
            this.progressBar.style.setProperty('--progress', `${progressPercent}%`);
            this.currentTimeEl.textContent = this.formatTime(this.audio.currentTime);
        }
    }

    updateDuration() {
        this.durationEl.textContent = this.formatTime(this.audio.duration);
    }

    setProgress(e) {
        if (!this.audio.duration) return;

        const width = this.progressBar.clientWidth;
        const clickX = e.offsetX;
        const duration = this.audio.duration;

        this.audio.currentTime = (clickX / width) * duration;
    }

    setVolume() {
        this.audio.volume = this.volumeSlider.value;
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    }

    addSongFromUrl() {
        const url = this.songUrlInput.value.trim();
        if (!url) return;

        // Basic URL validation
        try {
            new URL(url);
        } catch (e) {
            alert('Please enter a valid URL');
            return;
        }

        // Extract title from URL or use a default
        const title = url.split('/').pop().split('?')[0] || 'Untitled Song';

        this.addToPlaylist(title, url);
        this.songUrlInput.value = '';
    }

    handleFileUpload(e) {
        const files = e.target.files;
        if (files.length === 0) return;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.type === 'audio/mp3') {
                const url = URL.createObjectURL(file);
                this.addToPlaylist(file.name, url);
            }
        }

        // Reset file input
        this.fileInput.value = '';
    }
}

// Initialize the player when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MusicPlayer();
});
