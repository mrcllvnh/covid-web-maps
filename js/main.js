// =======================
// MAP 1: Choropleth Rates
// =======================
function loadMap1() {
  var map = L.map("map").setView([39, -96], 4);

  // basemap (works in Leaflet default CRS)
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 10,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  function getColor(d) {
    return d > 80 ? "#084081" :
           d > 60 ? "#0868ac" :
           d > 40 ? "#2b8cbe" :
           d > 20 ? "#4eb3d3" :
           d > 10 ? "#7bccc4" :
                    "#a8ddb5";
  }

  function style(feature) {
    return {
      fillColor: getColor(feature.properties.rates),
      weight: 0.6,
      opacity: 1,
      color: "white",
      fillOpacity: 0.85
    };
  }

  var geojson;

  function highlightFeature(e) {
    var layer = e.target;
    layer.setStyle({
      weight: 2,
      color: "#333",
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
          "Rate: " + Number(feature.properties.rates).toFixed(2) + "<br>" +
          "Cases: " + feature.properties.cases + "<br>" +
          "Deaths: " + feature.properties.deaths
        ).openPopup();
      }
    });
  }

  fetch("assets/us-covid-2020-rates.geojson")
    .then(r => r.json())
    .then(data => {
      geojson = L.geoJSON(data, {
        style: style,
        onEachFeature: onEachFeature
      }).addTo(map);

      map.fitBounds(geojson.getBounds());

      // legend
      var legend = L.control({ position: "bottomright" });
      legend.onAdd = function () {
        var div = L.DomUtil.create("div", "legend"),
            grades = [0, 10, 20, 40, 60, 80];

        div.innerHTML += "<b>Rate</b><br>";
        for (var i = 0; i < grades.length; i++) {
          div.innerHTML +=
            '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
            grades[i] + (grades[i + 1] ? "&ndash;" + grades[i + 1] + "<br>" : "+");
        }
        return div;
      };
      legend.addTo(map);
    });
}


// ==================================
// MAP 2: Proportional Symbols (Cases)
// ==================================
function loadMap2() {
  var map = L.map("map").setView([39, -96], 4);

  // basemap
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 10,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  function getRadius(cases) {
    return Math.sqrt(Number(cases)) * 0.15;
  }

  fetch("assets/us-covid-2020-counts.geojson")
    .then(r => r.json())
    .then(data => {
      var layer = L.geoJSON(data, {
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
        onEachFeature: function (feature, lyr) {
          lyr.bindPopup(
            "<b>" + feature.properties.county + ", " + feature.properties.state + "</b><br>" +
            "Cases: " + feature.properties.cases + "<br>" +
            "Deaths: " + feature.properties.deaths
          );
        }
      }).addTo(map);

      map.fitBounds(layer.getBounds());

      // legend
      var legend = L.control({ position: "bottomright" });
      legend.onAdd = function () {
        var div = L.DomUtil.create("div", "legend");
        div.innerHTML += "<b>Cases</b><br>";
        var grades = [1000, 5000, 20000, 50000];
        grades.forEach(g => {
          div.innerHTML +=
            '<svg width="34" height="34" style="vertical-align:middle;margin-right:6px;">' +
              '<circle cx="17" cy="17" r="' + getRadius(g) + '" fill="#800026" opacity="0.6" />' +
            '</svg>' +
            g.toLocaleString() + "<br>";
        });
        return div;
      };
      legend.addTo(map);
    });
}
