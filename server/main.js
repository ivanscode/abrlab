function init(rule) {
    //Video to use
    var video,
        player,
        url = "content/republique2.mpd";

    video = document.querySelector("video");
    player = dashjs.MediaPlayer().create();

    //Switching between ABR rules
    if(rule == 'default'){
        setDefaultRules(player);
    }else{
        setCustomRule(player, 'LowestBitrateRule', LowestBitrateRule);
    }

    //Initialize after. Bugged otherwise
    player.initialize(video, url, true);

    //On end
    player.on(dashjs.MediaPlayer.events["PLAYBACK_ENDED"], function () {
        clearInterval(eventPoller);
        clearInterval(bitrateCalculator);
    });

    //On .reset() call. Used to switch between ABR rules on the fly
    player.on(dashjs.MediaPlayer.events.STREAM_TEARDOWN_COMPLETE, function(){
        clearInterval(eventPoller);
        clearInterval(bitrateCalculator);
    });

    //Collect and display information every .5 s
    var eventPoller = setInterval(function () {
        var streamInfo = player.getActiveStream().getStreamInfo();
        var dashMetrics = player.getDashMetrics();
        var dashAdapter = player.getDashAdapter();

        if (dashMetrics && streamInfo) {
            const periodIdx = streamInfo.index;
            var repSwitch = dashMetrics.getCurrentRepresentationSwitch('video', true);
            var bufferLevel = dashMetrics.getCurrentBufferLevel('video', true);
            var bitrate = repSwitch ? Math.round(dashAdapter.getBandwidthForRepresentation(repSwitch.to, periodIdx) / 1000) : NaN;
            document.getElementById('bufferLevel').innerText = bufferLevel + " secs";
            document.getElementById('reportedBitrate').innerText = bitrate + " Kbps";
        }
    }, 500);

    if (video.webkitVideoDecodedByteCount !== undefined) {
        var lastDecodedByteCount = 0;
        const bitrateInterval = 5;
        var bitrateCalculator = setInterval(function () {
            var calculatedBitrate = (((video.webkitVideoDecodedByteCount - lastDecodedByteCount) / 1000) * 8) / bitrateInterval;
            document.getElementById('calculatedBitrate').innerText = Math.round(calculatedBitrate) + " Kbps";
            lastDecodedByteCount = video.webkitVideoDecodedByteCount;
        }, bitrateInterval * 500);
    } else {
        document.getElementById('chrome-only').style.display = "none";
    }

    return player
}
   

function setDefaultRules(player){
    player.updateSettings({
        'streaming': {
            'abr': {
                'useDefaultABRRules': true
            }
        }
    });

    player.removeAllABRCustomRule();
    document.getElementById('currentAlgorithm').innerText = 'abrDynamic';
}

function setCustomRule(player, name, src){
    player.updateSettings({
        'streaming': {
            'abr': {
                'useDefaultABRRules': false
            }
        }
    });

    console.log('lowbitrated');
    document.getElementById('currentAlgorithm').innerText = name;
    player.addABRCustomRule('qualitySwitchRules', name, src);
}