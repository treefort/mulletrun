var			_	= require("lodash"),
	avg_change	= {},
	flag_data;

var updateUI = function(data){
	_.each(data, function(val, key){

		var oldval = $('#flag' + (key+1) + ' .current > span')[0].innerText;
		if (avg_change['flag' + (key+1)] != undefined && oldval != ''){
			var df1 = Math.abs(oldval - avg_change['flag' + (key+1)]);
			var df2 = Math.abs(val - oldval);
			if (df2 > df1 * 10 && df1 != 0) {
				$('#flag' + (key+1)).addClass('active');
			} else {
				$('#flag' + (key+1)).removeClass('active');
			}
		}
		$('#flag' + (key+1) + ' .current > span')[0].innerText = val;
		avg_change['flag' + (key+1)] = oldval;
	});
}

var throttledUpdate = _.throttle(updateUI, 150);


var setFlagCapturedState = function(flag){
	if (flag.status == 'c'){
		$('#' + flag.flagindex).removeClass('uncaptured');
		$('#' + flag.flagindex).addClass('captured');
	} else if (flag.status == '') {
		$('#' + flag.flagindex).addClass('uncaptured');
		$('#' + flag.flagindex).removeClass('captured');
	} else {
		$('#' + flag.flagindex).removeClass('uncaptured');
		$('#' + flag.flagindex).removeClass('captured');
	}
};

var onFlagStatus = function(flag){
	setFlagCapturedState(flag);
};

var onFlagMeta = function(data){
	_.each(data, function(val, key){
		$('#' + key + ' .low > span')[0].innerText = (val.low || "(not set)");
		$('#' + key + ' .high > span')[0].innerText = (val.high || "(not set)");
		$('#' + key + ' .flagid')[0].value = (val.id || "");
		setFlagCapturedState(val);
	});
};

var setScore = function(score){
	console.log('setScore', score);
	$("#score")[0].innerText = "Score: " + score;
};

io = io.connect();

io.on('flag_values', throttledUpdate);
io.on('flag_status', onFlagStatus);
io.on('flag_meta', onFlagMeta);
io.on('score_update', setScore);

var setLow = function(event){
	var id = $(this).attr('data-flag-id');
	io.emit('setlow', {"flag": "flag" + id, "val": $('#flag' + id + ' .current > span')[0].innerText});
}

var setHigh = function(event){
	var id = $(this).attr('data-flag-id');
	io.emit('sethigh', {"flag": "flag" + id, "val": $('#flag' + id + ' .current > span')[0].innerText});
}

var changeID = function(event){
	var id = $(this).attr('data-flag-id');
	io.emit('setid', {"flag": "flag" + id, "val": $('#flag' + id + ' .flagid')[0].value});
}

$('.setlow').on('click', setLow);
$('.sethigh').on('click', setHigh);
$('.flagid').on('change', changeID);
