const QUALITY = 'QUALITY';
const BUFFER_SIZE = 'BUFFER_SIZE';

let zeroTime = new Date().getTime();

class Graph{
    constructor(){
        let ctx = document.getElementById('infoChart');

        this.mode = QUALITY;
        this.chart = new Chart(ctx, {type: 'line'});
        this.initQuality();

        this.data = [];
        
    }

    toCSV(){
        let csv = "data:text/csv;charset=utf-8,";

        this.data.forEach(function(r) {
            let row = r.join(",");
            csv += row + "\r\n";
        });

        let encodedUri = encodeURI(csv);
        let link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', 'data.csv');
        document.body.appendChild(link);
        link.click();
    }

    initQuality(){
        this.clearData();
        if(this.mode == BUFFER_SIZE){
            clearInterval(this.bufferInterval);
        }
        this.mode = QUALITY;
        this.chart.data = {
            datasets: [{
                label: 'Quality',
                steppedLine: true,
                borderColor: 'rgba(0,0,220,1)',
                pointBackgroundColor: 'rgba(0,0,220,1)',
                data: [{x: 0, y: 0}]
            }]
        }
        this.chart.options = {
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
        this.chart.update();
    }

    initBuffer(){
        this.clearData();
        this.mode = BUFFER_SIZE;
        this.chart.data = {
            datasets: [{
                label: 'Buffer',
                borderColor: 'rgba(0,0,220,1)',
                pointBackgroundColor: 'rgba(0,0,220,1)',
                data: [{x: 0, y: 0}]
            }]
        }
        this.chart.options = {
            responsive: true,
            title: {
                display: true,
                text: 'Buffer'
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
        this.chart.update();

        this.bufferInterval = setInterval(function(){
            let diff = (new Date().getTime() - zeroTime) / 1000;
            this.addData({ x: diff, y: player.getDashMetrics().getCurrentBufferLevel('video', true)});
        }.bind(this), 500);    
    }

    addData(data) {
        this.chart.data.datasets.forEach((dataset) => {
            dataset.data.push(data);
        });
        this.chart.update();
        this.data.push([`${data.x}`, `${data.y}`]);
    }
    
    clearData(){
        this.chart.data.datasets.forEach((dataset) => {
            dataset.data = [];
        });
        this.chart.update();
        zeroTime = new Date().getTime();
        this.data = [];
    }

    refreshInstance(player){
        if(this.mode == QUALITY){
            player.on(dashjs.MediaPlayer.events.QUALITY_CHANGE_REQUESTED, function () {
                let diff = (new Date().getTime() - zeroTime) / 1000;
                let quality = player.getQualityFor('video');
                this.addData({ x: diff, y: quality});

                let cbr = document.getElementById('cbr');
                let cres = document.getElementById('cres');

                
                let bitrates = player.getActiveStream().getBitrateListFor('video');
                let bitrate = bitrates[quality].bitrate;
                let width = bitrates[quality].width;
                let height = bitrates[quality].height;

                cbr.innerText = `${bitrate} bps`;
                cres.innerText = `${width}x${height}`;
            }.bind(this));
        }
    }

    setMode(mode){
        switch(mode){
            case QUALITY:
                this.initQuality();
                break;
            case BUFFER_SIZE:
                this.initBuffer();
                break;
        }
        zeroTime = new Date().getTime();
    }
}