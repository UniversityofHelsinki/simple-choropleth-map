// Input parameters
var langParameter = 'FI'; // Language to display hover country names. Options 'FI', 'EN', 'SV'
var dataPathParameter = 'data/example.csv'; // URL path to input CSV File

var app = function(dataPath, lang) {

  // Customization Parameters
  var outerDiv = 'simple-choropleth-map';
  var dataColumn = 'External_organisation_count';
  var dsv = d3.dsv(";", "text/plain");

  var legendTitle = {
    'FI': 'Yhteistyössä tehdyt julkaisut',
    'EN': 'Collaborative Publications',
    'SV': 'Samverkande publikationer'
  }

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

  dsv('languages.csv', function(error, data) {
    if (error)
      console.log(error);

    data.map(function(d) {
      country_names[d.ISO_3166] = d[lang];
    });
  });

  dsv(dataPath, function(error, data) {
    if (error)
      console.log(error);

    paletteScale = d3.scale.linear()
      .domain([0, getMax(dataColumn, data)])
      .range(["#89f3ec", "#357B71"]);

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
      projection: 'winkel3',
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
        highlightFillColor: '#ddd',
        highlightFillOpacity: 0.9,
        highlightBorderWidth: 0,
        highlightBorderColor: '#FFFFFF'
      },
      data: dataSet,
      responsive: true
    });

  });


  d3.select(window).on('resize', function() {
    map.resize();
  });
};

app(dataPathParameter, langParameter);
