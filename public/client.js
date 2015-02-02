$(function(){

	var vaild = true;

	var counter = 0;

	function Timer(seconds){
		var i = 0;

		return function(){
			console.log("i:" + i);
			console.log("seconds:" + seconds);


			if(i===seconds){

				$.ajax({
					type: 'POST', url:'/session_closed'
				})
				clearInterval(setInt);
				
				/*
				if(vaild===true){
					valid = false
					alert("session is expired!");
				}*/

			} else {
				i = i + 1
				console.log("seconds:"+i)
				$('#timer').html('<div id="timer"> or '+i+'/120'+' seconds.</div>')
			}
		}
		
	}

	var countTime = Timer(120)

	var setInt  = setInterval(countTime, 1000);//calls every seconds
	
	var socket = io.connect('http://localhost:8080');

	function getSessionId(){
		var jsId = document.cookie.match(/user=[^;]+/);

		return jsId[0].replace("user=","");
	}

	session_timer = new Timer(180)

	console.log(getSessionId())


	socket.on('end_', function(data){
		console.log("we got end message" + data)

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
		console.log("got data" + decoded);
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




	/*$('form').on('submit', function(event){
		console.log("submit!");
		event.preventDefault();//prevent submit
		var form = $(this);
		var wordData = form.serialize();
		console.log("We send server the keyword: " + wordData);

		//transforms form data to URL-encoded notation
		$.ajax({
			type: 'GET', url: '/keyword', data: wordData
		}).done(function(data){
			//recently
			console.log(data);//cleans up form text input fields
		});
	})
	*/
	/*
	$(function(){
		$('.block-list').on('click', 'a[data-block]', function(event){
			if(!confirm('Are you sure ?')){
				return false;
			}

			var target = $(event.currentTarget);//the link element that was clicked

			$.ajax({
				type:'DELETE', url: '/blocks/' + target.data('block')
				//reads the block name from the link's data-block attribute.
			}).done(function(){
				target.parents('li').remove();

			});
		});
	});
*/

});
