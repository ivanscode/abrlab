const QUALITY = 'QUALITY';
const BUFFER_SIZE = 'BUFFER_SIZE';

let zeroTime = new Date().getTime();

class Graph{
    constructor(){
        let ctx = document.getElementById('infoChart');

        this.mode = QUALITY;
        this.chart = new Chart(ctx, {type: 'line'});
        this.initQuality();
        
    }

    initQuality(){
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
    }
    
    clearData(){
        this.chart.data.datasets.forEach((dataset) => {
            dataset.data = [];
        });
        this.chart.update();
        zeroTime = new Date().getTime();
    }

    refreshInstance(player){
        if(this.mode == QUALITY){
            player.on(dashjs.MediaPlayer.events.QUALITY_CHANGE_REQUESTED, function () {
                let diff = (new Date().getTime() - zeroTime) / 1000;
                this.addData({ x: diff, y: player.getQualityFor('video')});
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