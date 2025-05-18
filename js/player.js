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

        // Update playlist UI
        const items = this.playlistEl.querySelectorAll('li');
        items.forEach((item, index) => {
            item.classList.remove('playing');
            if (index === this.currentSongIndex) {
                item.classList.add('playing');
            }
        });
    }

    play() {
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
