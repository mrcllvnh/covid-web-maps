// MAP 1: Choropleth (Rates)

var map = L.map("map").setView([39, -96], 4);

// Basemap
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 10,
  attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

// Color scale
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

    // Legend
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
