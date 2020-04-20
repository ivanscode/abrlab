

function init(rule) {
    var video,
        player,
        url = "content/republique2.mpd";

    video = document.querySelector("video");
    player = dashjs.MediaPlayer().create();

    if(rule == 'default'){
        setDefaultRules(player);
    }else{
        setCustomRule(player, 'LowestBitrateRule', LowestBitrateRule);
    }

    player.initialize(video, url, true);
    player.on(dashjs.MediaPlayer.events["PLAYBACK_ENDED"], function () {
        clearInterval(eventPoller);
        clearInterval(bitrateCalculator);
    });

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
    }, 1000);

    if (video.webkitVideoDecodedByteCount !== undefined) {
        var lastDecodedByteCount = 0;
        const bitrateInterval = 5;
        var bitrateCalculator = setInterval(function () {
            var calculatedBitrate = (((video.webkitVideoDecodedByteCount - lastDecodedByteCount) / 1000) * 8) / bitrateInterval;
            document.getElementById('calculatedBitrate').innerText = Math.round(calculatedBitrate) + " Kbps";
            lastDecodedByteCount = video.webkitVideoDecodedByteCount;
        }, bitrateInterval * 1000);
    } else {
        document.getElementById('chrome-only').style.display = "none";
    }

    player.on(dashjs.MediaPlayer.events.STREAM_TEARDOWN_COMPLETE, function(){
        clearInterval(eventPoller);
        clearInterval(bitrateCalculator);
    });

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

    console.log('deafaulted');
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