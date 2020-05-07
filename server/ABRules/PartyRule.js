var PartyRule;

/*
This rule was created by the ministry of silly rules
Its goal is twofold:
1. Be silly
2. Demonstrate possible ABR implementations through silly algorithms

The rule is simple, chaos

There are comments everywhere demonstrating what is going on and why the lines are necessary
*/

// Define the PartyRule class
function PartyRuleClass() {

    //Some models and controllers provided by Dash.js to gather metrics and return SwitchRequests
    let factory = dashjs.FactoryMaker;
    let SwitchRequest = factory.getClassFactoryByName('SwitchRequest');
    let DashMetrics = factory.getSingletonFactoryByName('DashMetrics');
    let MetricsModel = factory.getSingletonFactoryByName('MetricsModel');
    let StreamController = factory.getSingletonFactoryByName('StreamController');
    let context = this.context;
    let instance;

    function setup() {
        //A necessary function 
    }

    //Where the magic happens. This is called every time to figure out what bitrate should be chosen
    function getMaxIndex(rulesContext) {
        // here you can get some informations aboit metrics for example, to implement the rule
        let metricsModel = MetricsModel(context).getInstance();
        var mediaType = rulesContext.getMediaInfo().type; //Fragment type
        let bitrates = rulesContext.getMediaInfo().bitrateList; //Fragment bitrates
        var metrics = metricsModel.getMetricsFor(mediaType, true); //General info
        let dashMetrics = DashMetrics(context).getInstance(); //More info


        //Get max possible bitrate ~INDEX~ since SwitchRequest uses the index rather than the actual bitrate
        let top = bitrates.length;

        if(mediaType == 'video'){
            //Party time
            let switchRequest = SwitchRequest(context).create();
            switchRequest.quality = Math.floor(Math.random() * top);
            switchRequest.reason = 'Only way is up';
            switchRequest.priority = SwitchRequest.PRIORITY.STRONG;
            return switchRequest;
        }else{
            return SwitchRequest(context).create();
        }   
        
    }

    instance = {
        getMaxIndex: getMaxIndex
    };

    setup();

    return instance;
}

//These two are necessary as will be seen in main.js where the ABR rule switching happens
PartyRuleClass.__dashjs_factory_name = 'PartyRule'; 
PartyRule = dashjs.FactoryMaker.getClassFactory(PartyRuleClass);

