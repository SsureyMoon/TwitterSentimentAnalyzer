$(function(){

	var vaild = true;

	var counter = 0;

	function Timer(seconds){
		var i = 0;

		return function(){

			if(i===seconds){

				$.ajax({
					type: 'POST', url:'/session_closed'
				})
				clearInterval(setInt);
				

			} else {
				i = i + 1
				console.log("seconds:"+i)
				$('#timer').html('<div id="timer"> or '+i+'/120'+' seconds.</div>')
			}
		}
		
	}

	var countTime = Timer(120)

	var setInt  = setInterval(countTime, 1000);//calls every seconds
	
	//var socket = io.connect('http://localhost:8080');
	var socket = io.connect('http://192.241.234.170:8080');

	function getSessionId(){
		var jsId = document.cookie.match(/user=[^;]+/);

		return jsId[0].replace("user=","");
	}

	session_timer = new Timer(180)

	


	socket.on('end_', function(data){
		

		$.ajax({
			type: 'POST', url:'/session_closed'
		})
		
		clearInterval(setInt);
		socket.disconnect();

		if(vaild===true){
			valid = false
			alert("session is expired!");
		}
	
		

	})


	socket.on('result_', function(data){

		counter = counter + 1
		//appendToList(ab2str(data))
		var decoded = $.parseJSON(ab2str(data))
		
		if(decoded.tag === "POSITIVE"){
			color = "blue"
		}else if(decoded.tag === "NEGATIVE"){
			color = "red"
		}else{
			color = "black"
		}
		appendToList(decoded.text, color)
		draw_chart(decoded.ratio)

		$('#counter').html('<div id="counter">'+counter+'/100'+' tweets</div>')
		
		console.log(decoded.ratio);
	});

	function ab2str(buf) {
	  return String.fromCharCode.apply(null, new Uint8Array(buf));
	}


	//$.get('/result', appendToList);

	function appendToList(percentage, color){
		var list = [];
		content = '<li style="color:'+color+';">'+percentage+'</li>';
		$('.block-list').append(content);
		if($(".block-list li").length > 10){
			$(".block-list li").first().remove();
		}
	}

});
