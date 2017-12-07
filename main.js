
// SVG drawing area

var margin = {top: 40, right: 40, bottom: 60, left: 60};

var width = 600 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var svg = d3.select("#chart-area").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

queue()
    .defer(d3.csv, "games.csv")
    .defer(d3.csv, "probabilities2.csv")
    .await(function(error, games, probabilities){

        games.forEach(function(d){
            d.gameID = +d.gameID;
        });

        probabilities.forEach(function(d){
            d.gameID = +d.gameID;
            d.min_rem = +d.min_rem;
            d.proba = +d.proba
        });

        all_games = games;
        all_probas = probabilities;

        buildTable(games);
        updateVisualization(0)
    });

//SCALES
var x = d3.scaleLinear()
    .range([0, width]);

var y = d3.scaleLinear()
    .range([height, 0]);

//AXES
svg.append("g")
    .attr("class", "axis x-axis")
    .attr("transform", "translate(0," + (height) + ")");

svg.append("g")
    .attr("class", "axis y-axis");

svg.append("text")
    .attr("class", "chart_title")
    .attr("y", -30)
    .attr("x", width/2)
    .attr("dy", "1em")
    .style("text-anchor", "middle");


svg.append("text")
    .attr("class", "ylabel")
    .attr("y", -50)
    .attr("x", -height/2)
    .attr("dy", "1em")
    .attr("transform", "rotate(270)")
    .style("text-anchor", "middle");

svg.append("text")
    .attr("class", "xlabel")
    .attr("y", height + 25)
    .attr("x", width/2)
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("Minutes Remaining");

//LINE
svg.append("path")
    .attr("class", "line");

var $window = $(window),
    $stickyEl = $('#chart-area'),
    elTop = $stickyEl.offset().top;

$window.scroll(function() {
    $stickyEl.toggleClass('sticky', $window.scrollTop() > elTop);
});

function buildTable(games){
    var table = d3.select("#table_space").append("table");
    var thead = table.append('thead');
    var tbody = table.append('tbody');

    var columns = ['away_team','away_score','home_team','home_score','gameID'];
    var column_names = ['Away Team','Away Score','Home Team','Home Score', 'View Chart'];

    thead.append('tr')
        .selectAll('th')
        .data(column_names)
        .enter()
        .append('th')
        .text(function (d) { return d });

    var rows = tbody.selectAll('tr')
        .data(games)
        .enter()
        .append('tr');

    var cells = rows.selectAll('td')
        .data(function(row) {
            return columns.map(function (column) {
                return { column: column, value: row[column] }
            })
        })
        .enter()
        .append('td')
        .attr("class", function(d){
            if(d.column === "gameID"){
                return "clickable"
            }
            else
                return "other"
        })
        .text(function (d) {
            if(d.column === "gameID"){
                return "View Chart"
            }
            else
                return d.value });

    d3.selectAll(".clickable")
        .on("click", function(d){
            selected = d.value;
            updateVisualization(selected);
        });


}

// Render visualization
function updateVisualization(selected) {

    x.domain([48, 0]);
    y.domain([0, 1]);

    //Filtering data
    var filteredData = all_probas.filter(function (d){
        return(d.gameID === selected)
    });

    d3.selectAll(".chart_title")
        .text(all_games[selected].away_team + " @ " + all_games[selected].home_team);

    d3.selectAll(".ylabel")
        .text(all_games[selected].home_team + " Win Probability ");

    //Axes
    var xAxis = d3.axisBottom()
        .scale(x);

    svg.select(".x-axis").transition().duration(800)
        .call(xAxis);

    var yAxis = d3.axisLeft()
        .scale(y);

    svg.select(".y-axis").transition().duration(800)
        .call(yAxis);

    //Line
    var drawLine = d3.line()
        .x(function(d) {return x(d.min_rem);})
        .y(function(d) {return y(d.proba)})
        .curve(d3.curveCatmullRom.alpha(.5));

    svg.select(".line").transition().duration(800)
        .attr("d", drawLine(filteredData));

    var circle = svg.selectAll("circle")
        .data(filteredData);

    var tool_tip = d3.tip()
        .attr("class", "d3-tip")
        .offset([-12, 0])
        .html(function(d) { return(all_games[selected].home_team + ": " + d.home + "<br>" + all_games[selected].away_team + ": " + d.away) });
    svg.call(tool_tip);

    circle.enter().append("circle")
        .attr("class", "dot")
        .merge(circle)
        .attr("r", "4")
        .attr("opacity", 0.0)
        .on('mouseover', tool_tip.show)
        .on('mouseout', tool_tip.hide);
        //.on('click', showEdition);

    svg.selectAll(".dot").transition().duration(800)
        .attr("cy", function (d) {
            return y(d.proba)
        })
        .attr("cx", function (d) {
            return x(d.min_rem)
        });

    circle.exit().remove();
}