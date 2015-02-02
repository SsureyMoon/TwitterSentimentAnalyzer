
var margin = {top:20, right:20, bottom: 30, left:50},
width = 700 - margin.left - margin.right,
height = 250 - margin.top - margin.bottom;

var x = d3.scale.linear()
	.domain([0, 100-1])
	.range([0, width]);

var y = d3.scale.linear()
	.domain([0, 100])
	.range([height, 0]);

var index = 0

/*var line = d3.svg.line()
    .x(function(d) { return x(d[0]); })
    .y(function(d) { return y(d[1]); });
*/

	var xAxis = d3.svg.axis()
	.scale(x)
	.orient("bottom");


	var yAxis = d3.svg.axis()
	.scale(y)
	.orient("left");

  //var svg = d3.select("#graph_window").append("svg")





var svg = d3.select("#graph_window").append('svg')
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


var data = [];
data.push({"x":x(0), "y":y(50)});

var index = 0;

var path;

var line = d3.svg.line()
    .x(function(d) { return d.x; })
    .y(function(d) { return d.y; })
    .interpolate("basis");



function draw_chart(decoded){

	index = index + 1

	data.push({"x":x(index), "y":y(decoded)});
	console.log("decode: "+decoded);


	if(index===1){
		path = svg.append('path')
        .attr('class', 'line')
        .attr('d', line(data))
        .style("stroke", "blue")
        .style("fill", "none");

        //.transition()
        //.attr('d', line(data[1]));
        //console.log(data);
		svg.append("g")
			.attr("class", "y axis")
			.call(yAxis)
			.append("text")
			.attr("transform", "rotate(-90)")
			.attr("y", 6)
			.attr("dy", ".71em")
			.style("text-anchor", "end")
			.text("Positive Ratio (%)");

	     svg.append("g")
	      .attr("class", "x axis")
	      .attr("transform", "translate(0," + height + ")")
	      .call(xAxis);

	} else {

		path
  		.transition()
  		.attr("d", line(data));


    }
    //index = index +1;
}


/*
	var path

	//var path.trainsition().attr("d", line);

	//var data = [index, decoded]

	if(index === 0){
		path = svg.append('path')
		.attr('class', 'line')
		.attr('d', line(data[0]))
		.transition();
	}

	index = index + 1;

	console.log(data);

	var interpolate = d3.scale.quantile()
	.domain([0,1])
	.range(d3.range(1, 100 + 1));
	return function(t) {
	return line(data.slice(0, interpolate(t)));
	};*/
