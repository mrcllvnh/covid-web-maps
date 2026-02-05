// MAP 2: Proportional Symbols (Cases)

var map = L.map("map").setView([39, -96], 4);

// Basemap
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

    // Legend
    var legend = L.control({ position: "bottomright" });
    legend.onAdd = function () {
      var div = L.DomUtil.create("div", "legend");
      div.innerHTML += "<b>Cases</b><br>";
      var grades = [1000, 5000, 20000, 50000];

      grades.forEach(g => {
        div.innerHTML +=
          '<svg width="34" height="34" style="vertical-align:middle;margin-right:6px;">' +
            '<circle cx="17" cy="17" r="' + getRadius(g) + '" fill="#800026" opacity="0.6" />' +
          "</svg>" +
          g.toLocaleString() + "<br>";
      });

      return div;
    };
    legend.addTo(map);
  });
