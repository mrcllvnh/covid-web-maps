// =======================
// Shared: Albers CRS
// =======================
function makeAlbersCRS() {
  // ESRI:102003 (NAD83 / Conus Albers)
  proj4.defs(
    "ESRI:102003",
    "+proj=aea +lat_1=29.5 +lat_2=45.5 +lat_0=23 +lon_0=-96 " +
    "+x_0=0 +y_0=0 +datum=NAD83 +units=m +no_defs"
  );

  return new L.Proj.CRS(
    "ESRI:102003",
    proj4.defs("ESRI:102003"),
    {
      resolutions: [8192,4096,2048,1024,512,256,128,64,32,16,8,4,2,1]
    }
  );
}

// =======================
// MAP 1: Choropleth Rates
// =======================
function loadMap1() {
  var crs = makeAlbersCRS();

  // IMPORTANT: don't set center/zoom for projected CRS — use fitBounds after data loads
  var map = L.map("map", { crs: crs });

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

  var geojson; // will hold layer for resetStyle()

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
    .then(r => {
      if (!r.ok) throw new Error("Could not load rates GeoJSON (check filename/path).");
      return r.json();
    })
    .then(data => {
      geojson = L.Proj.geoJson(data, {
        style: style,
        onEachFeature: onEachFeature
      }).addTo(map);

      // ✅ This is what makes projected CRS render correctly
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
    })
    .catch(err => {
      console.error(err);
      alert(err.message);
    });
}

// ==============================
// MAP 2: Proportional Symbols
// ==============================
function loadMap2() {
  var crs = makeAlbersCRS();

  // IMPORTANT: don't set center/zoom for projected CRS — use fitBounds after data loads
  var map = L.map("map", { crs: crs });

  fetch("assets/us-covid-2020-counts.geojson")
    .then(r => {
      if (!r.ok) throw new Error("Could not load counts GeoJSON (check filename/path).");
      return r.json();
    })
    .then(data => {

      function getRadius(cases) {
        // sqrt scaling so big counties don’t dominate
        return Math.sqrt(Number(cases)) * 0.15;
      }

      var pointsLayer = L.Proj.geoJson(data, {
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
          layer.on({
            mouseover: function () {
              layer.setStyle({ fillOpacity: 0.85 });
            },
            mouseout: function () {
              layer.setStyle({ fillOpacity: 0.6 });
            }
          });

          layer.bindPopup(
            "<b>" + feature.properties.county + ", " + feature.properties.state + "</b><br>" +
            "Cases: " + feature.properties.cases + "<br>" +
            "Deaths: " + feature.properties.deaths
          );
        }
      }).addTo(map);

      // ✅ This makes the projected CRS view correct
      map.fitBounds(pointsLayer.getBounds());

      // Legend (example circles)
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
    })
    .catch(err => {
      console.error(err);
      alert(err.message);
    });
}
