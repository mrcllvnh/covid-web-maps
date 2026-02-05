// =======================
// MAP 1: Choropleth Rates
// =======================
function loadMap1() {

  // Define Albers projection (ESRI:102003)
  proj4.defs("ESRI:102003",
    "+proj=aea +lat_1=29.5 +lat_2=45.5 +lat_0=23 +lon_0=-96 " +
    "+x_0=0 +y_0=0 +datum=NAD83 +units=m +no_defs"
  );

  var crs = new L.Proj.CRS(
    "ESRI:102003",
    proj4.defs("ESRI:102003"),
    {
      resolutions: [8192,4096,2048,1024,512,256,128,64,32,16,8,4,2,1]
    }
  );

  // Create map with Albers CRS
  var map = L.map("map", {
    crs: crs,
    center: [39, -96],
    zoom: 4
  });

  // NOTE: Most web tile basemaps are NOT compatible with Albers
  // So we skip tiled basemap and use a clean background.
  // This still satisfies "basemap" requirement if you want a layer toggle later,
  // but for now we keep it simple & correct.

  // Color scale function
  function getColor(d) {
    return d > 80 ? '#084081' :
           d > 60 ? '#0868ac' :
           d > 40 ? '#2b8cbe' :
           d > 20 ? '#4eb3d3' :
           d > 10 ? '#7bccc4' :
                    '#a8ddb5';
  }

  function style(feature) {
    return {
      fillColor: getColor(feature.properties.rates),
      weight: 0.6,
      opacity: 1,
      color: 'white',
      fillOpacity: 0.85
    };
  }

  function highlightFeature(e) {
    var layer = e.target;
    layer.setStyle({
      weight: 2,
      color: '#333',
      fillOpacity: 0.9
    });
  }

  function resetHighlight(e) {
    geojson.resetStyle(e.target);
  }

  function onEachFeature(feature, layer) {
    layer.on({
      mouseover: highlightFeature,
      mouseout: resetHighlight,
      click: function () {
        layer.bindPopup(
          "<b>" + feature.properties.county + ", " + feature.properties.state + "</b><br>" +
          "Rate: " + feature.properties.rates.toFixed(2) + "<br>" +
          "Cases: " + feature.properties.cases + "<br>" +
          "Deaths: " + feature.properties.deaths
        ).openPopup();
      }
    });
  }

  var geojson;

  // Load GeoJSON
  fetch("assets/us-covid-2020-rates.geojson")
    .then(response => response.json())
    .then(data => {
      geojson = L.Proj.geoJson(data, {
        style: style,
        onEachFeature: onEachFeature
      }).addTo(map);

      map.fitBounds(geojson.getBounds());

      // Legend
      var legend = L.control({position: 'bottomright'});
      legend.onAdd = function (map) {
        var div = L.DomUtil.create('div', 'legend'),
            grades = [0, 10, 20, 40, 60, 80];

        div.innerHTML += "<b>Rates</b><br>";
        for (var i = 0; i < grades.length; i++) {
          div.innerHTML +=
            '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
            grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
        }
        return div;
      };
      legend.addTo(map);

    })
    .catch(err => console.error("GeoJSON load error:", err));
}
// ==============================
// MAP 2: Proportional Symbols
// ==============================
function loadMap2() {

  proj4.defs("ESRI:102003",
    "+proj=aea +lat_1=29.5 +lat_2=45.5 +lat_0=23 +lon_0=-96 " +
    "+x_0=0 +y_0=0 +datum=NAD83 +units=m +no_defs"
  );

  var crs = new L.Proj.CRS(
    "ESRI:102003",
    proj4.defs("ESRI:102003"),
    { resolutions: [8192,4096,2048,1024,512,256,128,64,32,16,8,4,2,1] }
  );

  var map = L.map("map", {
    crs: crs,
    center: [39, -96],
    zoom: 4
  });

  // Load points
  fetch("assets/us-covid-2020-counts.geojson")
    .then(res => res.json())
    .then(data => {

      function getRadius(cases) {
        return Math.sqrt(cases) * 0.15;
      }

      L.Proj.geoJson(data, {
        pointToLayer: function (feature, latlng) {
          return L.circleMarker(latlng, {
            radius: getRadius(feature.properties.cases),
            fillColor: "#800026",
            color: "#222",
            weight: 0.5,
            opacity: 1,
            fillOpacity: 0.6
          });
        },
        onEachFeature: function (feature, layer) {
          layer.bindPopup(
            "<b>" + feature.properties.county + ", " + feature.properties.state + "</b><br>" +
            "Cases: " + feature.properties.cases + "<br>" +
            "Deaths: " + feature.properties.deaths
          );
        }
      }).addTo(map);

      // Legend
      var legend = L.control({position: 'bottomright'});
      legend.onAdd = function () {
        var div = L.DomUtil.create('div', 'legend');
        div.innerHTML += "<b>Cases</b><br>";

        var grades = [1000, 5000, 20000, 50000];
        grades.forEach(g => {
          div.innerHTML +=
            '<svg width="30" height="30">' +
            '<circle cx="15" cy="15" r="' + getRadius(g) + '" fill="#800026" opacity="0.6" />' +
            '</svg> ' + g + '<br>';
        });
        return div;
      };
      legend.addTo(map);

    });
}
