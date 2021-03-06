class PlayerInterface {
    constructor() {
        this.player = this.getNetflixPlayer();
        this.ui = new UserInterface(this.player);

        // Init UI
        var current, list, number;

        // Init Audio UI
        current = this.player.getAudioTrack();
        list = this.player.getAudioTrackList();
        number = this.getTrackNumber(current, list);
        this.ui.initList("audiolist", list, number);

        // Init Subtitles UI
        current = this.player.getTextTrack();
        list = this.player.getTextTrackList();
        number = this.getTrackNumber(current, list);
        this.ui.initList("subtitlelist", list, number);

        this.audioSelection = null;
        this.lastSubtitles = null;
    }
    
    // Util functions
    // ==============================================================================================

    getNetflixPlayer() {
        var videoPlayer = window.netflix.appContext.state.playerApp.getAPI().videoPlayer;
        var sessionId = videoPlayer.getAllPlayerSessionIds()[0];
        
        return videoPlayer.getVideoPlayerBySessionId(sessionId);    
    }

    getTrackNumber(current, list) {
        for (var i = 0; i < list.length; i++) {
            if (current == list[i]) {
                return i;
            }
        }
    }

    getTextTrackOn(list) {
        for (var i = 0; i < list.length; i++) {
            if (list[i] != this.getTextTrackOff()) return list[i];
        }
    }

    getTextTrackOff() {
        var list = this.player.getTextTrackList();
        var offNames = ["Mati", "fra", "Aus", "Off", "Desactivados", "Désactivé", "disattivati", "Imezimwa", "Ki", "Uit", "av", "wyłączone", "desligadas", "niciuna", "Pois käytöstä", "av", "Tắt", "Kapalı", "Vypnuto", "Ανενεργοί", "ללא", "إيقاف التشغيل", "ऑफ़", "ปิด", "关闭", "オフ", "끄기"];

        // Check if name is in list for every track until offtrack is found
        for (var i in list) {
            for (var j in offNames) {
                if (list[i].displayName == offNames[j]) 
                    return list[i];
            }
        }
    }

    wrapIncrement(number, max) {
        return (number + 1) % max;
    }

    // Interaction functions
    // ==============================================================================================

    playPause() {
        if (this.player.isPlaying()) this.player.pause();
        else this.player.play();
    }

    skip(millis) {
        // Round current time to full seconds
        var current = Math.round( this.player.getCurrentTime() / 1000 ) * 1000;
        // Skip by specified amount
        this.player.seek(current  + millis);
    }

    seekPercentage(percentage) {
        // Seek percentage
        var duration = this.player.getDuration();
        this.player.seek( (duration / 100) * percentage);

        // Set progressbar
        var progressBar = document.querySelector("div.current-progress");
        var scrubber = document.querySelector("div.scrubber-head");

        progressBar.style.width = `${percentage}%`;
        scrubber.style.left = `${percentage}%`;
    }

    nextEpisode() {
        // Get next episode button and click it
        var nextButton = document.querySelector(".button-nfplayerNextEpisode");
        if (nextButton) nextButton.click();
    }

    speedUp() {
        var speed = this.player.getPlaybackRate();

        if (speed < 2) speed += 0.25;
        this.player.setPlaybackRate(speed);

        this.ui.showTooltip(`${speed}x`);
    }

    speedDown() {
        var speed = this.player.getPlaybackRate();
        
        if (speed > 0.25) speed -= 0.25;
        this.player.setPlaybackRate(speed);

        this.ui.showTooltip(`${speed}x`);
    }

    switchAudio() {
        var current = this.player.getAudioTrack();
        var list = this.player.getAudioTrackList();
        var number = this.getTrackNumber(current, list);

        if (this.audioSelection == null) {
            this.audioSelection = number;
            this.ui.updateList("audiolist", this.audioSelection);
        }
        else {
            this.audioSelection = this.wrapIncrement(this.audioSelection, list.length);
            this.ui.updateList("audiolist", this.audioSelection);
        }

        this.ui.showPopupTimed("audio", 900, () => {
            this.player.setAudioTrack(list[this.audioSelection]);
            this.audioSelection = null;
            console.log("Audio set to: ", this.player.getAudioTrack());
        });
    }

    toggleSubtitles() {
        var current = this.player.getTextTrack();
        var list = this.player.getTextTrackList();
        
        // Currently not off
        if (current != this.getTextTrackOff()) {
            this.lastSubtitles = current;
            this.player.setTextTrack(this.getTextTrackOff());
        }
        
        // Currently off
        else {
            // No last subtitles saved
            if (this.lastSubtitles == null) {
                var on = this.getTextTrackOn(list);
                this.player.setTextTrack(on);
            }
            
            // Last subtitles saved
            else this.player.setTextTrack(this.lastSubtitles);
        }
        
        // Update UI
        var newCurrent = this.player.getTextTrack();
        var number = this.getTrackNumber(newCurrent, list);
        this.ui.updateList("subtitlelist", number);
        this.ui.showPopupTimed("subtitles", 900);

        console.log("Toggled subtitles to", this.player.getTextTrack().displayName);
    }

    switchSubtitles() {
        var current = this.player.getTextTrack();
        var list = this.player.getTextTrackList();
        
        var number = this.getTrackNumber(current, list);
        number = this.wrapIncrement(number, list.length);
        
        var next = list[number];
        if (next == this.getTextTrackOff()) {
            number = this.wrapIncrement(number, list.length);
            next = list[number];
        };

        this.player.setTextTrack(next);

        // Update UI
        var newNumber = this.getTrackNumber(next, list);
        this.ui.updateList("subtitlelist", newNumber);
        this.ui.showPopupTimed("subtitles", 900);

        console.log("Subtitles set to", next.displayName);
    }

    showVolume() {
        var volume = this.player.getVolume();
        volume *= 100;
        volume = Math.round(volume);
        this.ui.showTooltip(`${volume}%`);
        console.log("Volume:", volume);
    }
}