var _ 		= require("lodash"),
	flag_data;

io = io.connect();

var updateUI = function(data){
	_.each(data, function(val, key){
		$('#' + key + ' .current > span')[0].innerText = val.current;
		$('#' + key + ' .low > span')[0].innerText = (val.low || "(not set)");
		$('#' + key + ' .high > span')[0].innerText = (val.high || "(not set)");

		if (val.low != undefined && val.high != undefined && val.current != undefined){

			if (val.current < Number(val.low) + ((Number(val.high)-Number(val.low))/2)){
				$('#' + key).addClass('uncaptured');
				$('#' + key).removeClass('captured');
			} else {
				$('#' + key).removeClass('uncaptured');
				$('#' + key).addClass('captured');
			}
		}
	});
}

var throttledUpdate = _.throttle(updateUI, 250);

io.on('flag_data', throttledUpdate);


$('.setlow').on('click', function(event){
	var id = $(this).attr('data-flag-id');
	io.emit('setlow', {"flag": "flag" + id, "val": $('#flag' + id + ' .current > span')[0].innerText});
});

$('.sethigh').on('click', function(event){
	var id = $(this).attr('data-flag-id');
	io.emit('sethigh', {"flag": "flag" + id, "val": $('#flag' + id + ' .current > span')[0].innerText});
});