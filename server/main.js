let zeroTime = new Date().getTime();

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
    } else {
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

function addData(chart, data) {
    chart.data.datasets.forEach((dataset) => {
        dataset.data.push(data);
    });
    chart.update();
}

function initChart() {
    let ctx = document.getElementById('infoChart');
    let infoChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Quality',
                steppedLine: true,
                borderColor: 'rgba(0,0,220,1)',
                pointBackgroundColor: 'rgba(0,0,220,1)',
                data: [{x: 0, y: 0}]
            }]
        }
    });
    infoChart.options = {
        responsive: true,
        title: {
            display: true,
            text: 'Quality'
        },
        scales: {
            xAxes: [{
                display: true,
                type: 'linear',
                position: 'bottom',
                showLine: true,
                ticks: {
                    suggestedMin: 0,
                    suggestedMax: 5
                }
            }],
            yAxes: [{
                display: true,
                ticks: {
                    suggestedMin: 0,
                    suggestedMax: 5
                }
            }]
        }
    };
    infoChart.update();

    return infoChart;
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

    console.log('lowbitrated');
    document.getElementById('currentAlgorithm').innerText = name;
    player.addABRCustomRule('qualitySwitchRules', name, src);
}

function refresh(){
    player.on(dashjs.MediaPlayer.events.QUALITY_CHANGE_REQUESTED, function () {
        let diff = (new Date().getTime() - zeroTime) / 1000;
        addData(infoChart, { x: diff, y: player.getQualityFor('video')});
    });
}

var player = init('default');
let infoChart = initChart();
refresh();

const dbtn = document.getElementById('setDefaultBtn');
const lbtn = document.getElementById('setLowestBtn');
const defaultPlaybackBtn = document.getElementById('setDefaultPlaybackBtn');

const initBufferSet = document.getElementById('initBufferSet');
const stableBufferSet = document.getElementById('stableBufferSet');
const minBitrateSet = document.getElementById('minBitrateSet');
const maxBitrateSet = document.getElementById('maxBitrateSet');

const initBufferL = document.getElementById('initBuffer');
const stableBufferL = document.getElementById('stableBuffer');
const minBitrateL = document.getElementById('minBitrate');
const maxBitrateL = document.getElementById('maxBitrate');

dbtn.addEventListener('click', event => {
    player.reset();
    player = init('default');
    refresh();
});

lbtn.addEventListener('click', event => {
    player.reset();
    player = init('lowest');
    refresh();
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