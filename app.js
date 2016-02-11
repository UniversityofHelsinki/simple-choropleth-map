// Input parameters
var langParameter = 'FI'; // Language to display hover country names. Options 'FI', 'EN', 'SV'
var defaultDataPath = 'data/example.csv'; // URL path to input CSV File
var files = ['example.csv', 'example1.csv', 'example2.csv'];

var category1 = {
  'EN' : 'Category 1',
  'FI' : 'Kategoria 1',
  'SV' : 'Kategori 1'
}
var category2 = {
  'EN' : 'Category 2',
  'FI' : 'Kategoria 2',
  'SV' : 'Kategori 2'
}

var app = function(lang) {
  // Parameters
  var dataColumn = 'External_organisation_count';
  var dsv = d3.dsv(";", "text/plain");
  var outerDiv = 'simple-choropleth-map';
  var defaultPalette = ["#EDF2FA", "#769bd2"];
  var palette = defaultPalette;

  var legendTitle = {
    'FI': 'Yhteistyössä tehdyt julkaisut',
    'EN': 'Collaborative Publications',
    'SV': 'Samverkande publikationer'
  };

  // Globals
  var map;
  var dataSet = {};
  var paletteScale;
  var countryNames = {};
  var maxValue = 0;

  var drawLegend = function() {
    d3.select("svg .key").remove();

    var svg = map.svg;
    var width = Number(svg.style('width').replace("px", ""));
    var height = Number(svg.style('height').replace("px", ""));

    // A position encoding for the key only.
    var x = d3.scale.linear()
      .domain([0, maxValue])
      .range([0, width / 3]);

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
      .attr("transform", "translate(" + (Math.max(0, (width / 2.2))) + "," + ((height - 25) - height / 10) + ")");

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


  function definePalette() {
    var categories = [0, maxValue * .1, maxValue * .25, maxValue * .5];

    paletteScale = d3.scale.threshold()
      .domain(categories)
      .range(
        d3.range(categories.length + 1).map(
          d3.scale.linear()
          .domain([0, categories.length])
          .range(palette)
          .interpolate(d3.interpolateHcl)
        )
      );
  }

  var populateCountryNames = function(d) {
    countryNames[d.ISO_3166] = d[lang];
  };


  var populateDataSet = function(d) {
    dataSet[d.ISO_3166] = {
      localized_country: countryNames[d.ISO_3166],
      publications: d[dataColumn]
    };
    maxValue = Math.max(maxValue, d[dataColumn]);
  };


  var projection = function(element) {
    var projection = d3.geo.winkel3()
      .translate([element.offsetWidth / 2, element.offsetHeight / 2])
      .scale(100 * (element.offsetWidth / 500));

    var path = d3.geo.path()
      .projection(projection);

    return {
      path: path,
      projection: projection
    };
  }


  var getMax = function(column, data) {
    return data.reduce(function(prev, curr) {
      return Math.max(prev, curr[column]);
    }, 0);
  };


  function addPalette() {
    for (var index in dataSet) {
      dataSet[index]['fillColor'] = paletteScale(dataSet[index]['publications']);
      // It is necessary to also update 'color' because of a bug in DataMaps
      dataSet[index]['color'] = dataSet[index]['fillColor'];
    }
  }


  function drawMap() {
    innerDiv = 'simple-choropleth-map-innerDiv';
    mapElem = d3.select('#' + outerDiv)
      .append('div')
      .attr('id', 'simple-choropleth-map-innerDiv')

    map = new Datamap({
      scope: 'world',
      element: document.getElementById(innerDiv),
      setProjection: projection,
      fills: {
        defaultFill: '#ddd'
      },
      geographyConfig: {
        popupTemplate: function(geography, data) {
          return '<div class="hoverinfo">' +
            (geography.id in countryNames ? countryNames[geography.id] : geography.properties.name) + ': ' +
            (data ? data.publications : '0') +
            '</div>';
        },
        highlightFillColor: '#9A9A9A', //'#222',
        highlightFillOpacity: 0.8,
        highlightBorderWidth: 0,
        highlightBorderColor: '#FFFFFF'
      },
      data: dataSet,
      responsive: true
    });
  }

  var ready = function() {
    if (map === undefined) {
      definePalette();
      addPalette();
      drawMap();
      drawLegend();

      d3.select(window).on('resize', function() {
        map.projection(projection);
        map.resize();
        drawLegend();
      });

    } else {
      definePalette();
      addPalette();
      map.updateChoropleth(dataSet);
      drawLegend();
    };
  };

  function createDropdown(files, dropdownPalette) {

    var select = dropdown_container
      .append("div")
        .attr('class', 'simple-choropleth-map-dropdown-outer')
      .append("div")
        .attr('class','simple-choropleth-map-dropdown')
      .append("select")
        .attr('class','simple-choropleth-map-dropdown-select');

    var options = select
      .selectAll("option")
      .data(files)
      .enter()
      .append("option")
      .text(function(d) {
        return d;
      });

    select.style("color", dropdownPalette[1]);

    select.on("change", function() {
      palette = dropdownPalette;

      d3.selectAll("select")
        .classed("selected", false);

      select.classed("selected", true);

      var selectedIndex = select.property('selectedIndex');
      var selectedItem = options[0][selectedIndex].__data__;
      run('data/' + selectedItem);
    });

    return select;
  }

  function run(path) {
    maxValue = 0;

    queue()
      .defer(dsv, path, populateDataSet)
      .defer(dsv, 'languages.csv', populateCountryNames)
      .await(ready);
  };

  var title = d3.select("#simple-choropleth-map")
    .append("div")
    .attr('class', 'title-container');

  title.append("div")
      .attr('class', 'simple-choropleth-map-dropdown-outer')
    .append("h2")
    .text(category1[langParameter]);

  title.append("div")
      .attr('class', 'simple-choropleth-map-dropdown-outer')
    .append("h2")
    .text(category2[langParameter]);


  var dropdown_container = d3.select("#simple-choropleth-map")
    .append("div")
    .attr('class', 'dropdown-container');

  createDropdown(files, defaultPalette)
    .classed("selected", true);

  createDropdown(files, ["#EDF9F8", "#49a99a"]);

  run(defaultDataPath);
};

app(langParameter);
