function init(rule) {
    //Video to use
    var video,
        player,
        url = "content/republique2.mpd";

    video = document.querySelector("video");
    player = dashjs.MediaPlayer().create();

    //Switching between ABR rules
    if (rule == 'default') {
        setDefaultRules(player);
    } else if(rule == 'lowest') { //Add custom rules here
        setCustomRule(player, 'LowestBitrateRule', LowestBitrateRule);
    } else if(rule == 'dr'){
        setCustomRule(player, 'DownloadRatioRule', DownloadRatioRule);
    }

    //Initialize after. Bugged otherwise
    player.initialize(video, url, true);

    //On end
    player.on(dashjs.MediaPlayer.events["PLAYBACK_ENDED"], function () {
        clearInterval(eventPoller);
        clearInterval(bitrateCalculator);
    });

    //On .reset() call. Used to switch between ABR rules on the fly
    player.on(dashjs.MediaPlayer.events.STREAM_TEARDOWN_COMPLETE, function () {
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

    return player;
}

function setDefaultRules(player) {
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

function setCustomRule(player, name, src) {
    player.updateSettings({
        'streaming': {
            'abr': {
                'useDefaultABRRules': false
            }
        }
    });

    document.getElementById('currentAlgorithm').innerText = name;
    player.addABRCustomRule('qualitySwitchRules', name, src);
}

var player = init('default');
let infoChart = new Graph();
infoChart.refreshInstance(player);
let fastSwitch = false;

//Grab ABR rule buttons here
const dbtn = document.getElementById('setDefaultBtn');
const lbtn = document.getElementById('setLowestBtn');
const drbtn = document.getElementById('setDRBtn');
const fabtn = document.getElementById('setFastSwitch');
const defaultPlaybackBtn = document.getElementById('setDefaultPlaybackBtn');

const initBufferSet = document.getElementById('initBufferSet');
const stableBufferSet = document.getElementById('stableBufferSet');
const minBitrateSet = document.getElementById('minBitrateSet');
const maxBitrateSet = document.getElementById('maxBitrateSet');

const initBufferL = document.getElementById('initBuffer');
const stableBufferL = document.getElementById('stableBuffer');
const minBitrateL = document.getElementById('minBitrate');
const maxBitrateL = document.getElementById('maxBitrate');

const gSetQuality = document.getElementById('gSetQuality');
const gSetBuffer = document.getElementById('gSetBuffer');
const gClear = document.getElementById('gClear');

const playerl = document.getElementById('player-l');
const playerm = document.getElementById('player-m');
const players = document.getElementById('player-s');


//Add click event listeners to ABR rule buttons here
dbtn.addEventListener('click', event => {
    player.reset(); //Necessary to avoid bugs with the player
    player = init('default'); //Reinitialize player with new rule
    infoChart.refreshInstance(player); //Reinitialize any trackers in graph.js
});

lbtn.addEventListener('click', event => {
    player.reset();
    player = init('lowest');
    infoChart.refreshInstance(player);
});

drbtn.addEventListener('click', event => {
    player.reset();
    player = init('dr');
    infoChart.refreshInstance(player);
});

fabtn.addEventListener('click', event => {
    if(!fastSwitch){
        fastSwitch = true;
        fabtn.classList.add('btn-primary');
        fabtn.classList.remove('btn-secondary');
    }else{
        fastSwitch = false;
        fabtn.classList.add('btn-secondary');
        fabtn.classList.remove('btn-primary');
    }
    player.updateSettings({
        'streaming':{
            'fastSwitchEnabled': fastSwitch
        }
    });
});

defaultPlaybackBtn.addEventListener('click', event => {
    player.updateSettings({
        'streaming': {
            'stableBufferTime': 12,
            'bufferTimeAtTopQuality': 30,
            'abr': {
                'minBitrate': {
                    'video': -1
                },
                'maxBitrate': {
                    'video': -1
                }
            }
        }
    });
    initBufferL.innerText = '12 s';
    stableBufferL.innerText = '30 s';
    minBitrateL.innerText = '-1 Kbps';
    maxBitrateL.innerText = '-1 Kbps';

    initBufferSet.value = 12;
    stableBufferSet.value = 30;
    minBitrateSet.value = -1;
    maxBitrateSet.value = -1;
});

initBufferSet.addEventListener('change', event => {
    let initBuffer = parseInt(initBufferSet.value, 10);
    player.updateSettings({
        'streaming': {
            'stableBufferTime': initBuffer
        }
    });
    initBufferL.innerText = initBuffer + ' s';
});

stableBufferSet.addEventListener('change', event => {
    let stableBuffer = parseInt(stableBufferSet.value, 10);
    player.updateSettings({
        'streaming': {
            'bufferTimeAtTopQuality': stableBuffer
        }
    });
    stableBufferL.innerText = stableBuffer + ' s';
});

minBitrateSet.addEventListener('change', event => {
    let minBitrate = parseInt(minBitrateSet.value, 10);
    player.updateSettings({
        'streaming': {
            'abr': {
                'minBitrate': {
                    'video': minBitrate
                }
            }
        }
    });
    minBitrateL.innerText = minBitrate + ' Kbps';
});

maxBitrateSet.addEventListener('change', event => {
    let maxBitrate = parseInt(maxBitrateSet.value, 10);
    player.updateSettings({
        'streaming': {
            'abr': {
                'maxBitrate': {
                    'video': maxBitrate
                }
            }
        }
    });
    maxBitrateL.innerText = maxBitrate + ' Kbps';
});

gSetQuality.addEventListener('click', event => {
    infoChart.setMode('QUALITY');
});

gSetBuffer.addEventListener('click', event => {
    infoChart.setMode('BUFFER_SIZE');
});

gClear.addEventListener('click', event => {
    infoChart.clearData();
});

playerl.addEventListener('click', event => {
    document.querySelector('video').style.width = '1280px';
    document.querySelector('video').style.height = '720px';
});

playerm.addEventListener('click', event => {
    document.querySelector('video').style.width = '854px';
    document.querySelector('video').style.height = '480px';
});

players.addEventListener('click', event => {
    document.querySelector('video').style.width = '640px';
    document.querySelector('video').style.height = '360px';
});