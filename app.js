// Input parameters
var langParameter = 'FI'; // Language to display hover country names. Options 'FI', 'EN', 'SV'
var dataPathParameter = 'data/example.csv'; // URL path to input CSV File

var app = function(dataPath, lang) {

  // Parameters
  var dataColumn = 'External_organisation_count';
  var dsv = d3.dsv(";", "text/plain");
  var outerDiv = 'simple-choropleth-map';

  var legendTitle = {
    'FI': 'Yhteistyössä tehdyt julkaisut',
    'EN': 'Collaborative Publications',
    'SV': 'Samverkande publikationer'
  };

  // Globals
  var map;
  var dataSet = {};
  var paletteScale;
  var country_names = {}

  var getMax = function(column, data) {
    return data.reduce(function(prev, curr) {
      return Math.max(prev, curr[column]);
    }, 0);
  };

  var drawLegend = function(map, maxValue, mapWidth) {
    var svg = map.svg;
    var width = Number(svg.style('width').replace("px", ""));
    var height = Number(svg.style('height').replace("px", ""));

    // A position encoding for the key only.
    var x = d3.scale.linear()
      .domain([0, maxValue])
      .range([0, width/3]);

    var tickFormat = d3.format(".2r");

    var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom")
      .tickSize(13)
      .tickValues(paletteScale.domain())
      .tickFormat(function(d) {
        if (d === 0)
          return '0';
        else
          return tickFormat(d);
      });

    var g = svg.append("g")
      .attr("class", "key")
      .attr("transform", "translate(" + ( Math.max(0,(width/2.2) )) + "," + ((height - 25) - height/10) + ")");

    g.selectAll("rect")
      .data(paletteScale.range().map(function(color) {
        var d = paletteScale.invertExtent(color);
        if (d[0] == null) d[0] = x.domain()[0];
        if (d[1] == null) d[1] = x.domain()[1];
        return d;
      }))
      .enter().append("rect")
      .attr("height", 8)
      .attr("x", function(d) {
        return x(d[0]);
      })
      .attr("width", function(d) {
        return x(d[1]) - x(d[0]);
      })
      .style("fill", function(d) {
        return paletteScale(d[0]);
      });

    g.call(xAxis).append("text")
      .attr("class", "caption")
      .attr("y", -6)
      .text(legendTitle[lang]);

  };

  dsv('languages.csv', function(error, data) {
    if (error)
      console.log(error);

    data.map(function(d) {
      country_names[d.ISO_3166] = d[lang];
    });
  });

  var maxValue;

  var projection = function(element) {
        var projection = d3.geo.winkel3()
          .translate([element.offsetWidth / 2, element.offsetHeight / 2])
          .scale(100 * (element.offsetWidth/500))

        var path = d3.geo.path()
          .projection(projection);

        return {path: path, projection: projection};
      }

  dsv(dataPath, function(error, data) {
    if (error)
      console.log(error);

    maxValue = getMax(dataColumn, data);

    paletteScale = d3.scale.threshold()
      .domain([0, maxValue * .1, maxValue * .25, maxValue * .5])
      .range(["#ddd", "#c3d7cf", "#97b5aa", "#629894", "#357b71"]);

    data.map(function(d) {
      dataSet[d.ISO_3166] = {
        localized_country: country_names[d.ISO_3166],
        publications: d[dataColumn],
        fillColor: paletteScale(d[dataColumn])
      };
    });

    map = new Datamap({
      scope: 'world',
      element: document.getElementById(outerDiv),
      setProjection: projection,
      fills: {
        defaultFill: '#ddd'
      },
      geographyConfig: {
        popupTemplate: function(geography, data) {
          return '<div class="hoverinfo">' +
            (geography.id in country_names ? country_names[geography.id] : geography.properties.name) + ': ' +
            (data ? data.publications : '0') +
            '</div>';
        },
        highlightFillColor: '#222',
        highlightFillOpacity: 0.8,
        highlightBorderWidth: 0,
        highlightBorderColor: '#FFFFFF'
      },
      data: dataSet,
      responsive: true
    });

    drawLegend(map, maxValue)
  });


  d3.select(window).on('resize', function() {
    d3.select("svg .key").remove();
    map.projection(projection);
    map.resize();
    drawLegend(map, maxValue);
  });
};

app(dataPathParameter, langParameter);
