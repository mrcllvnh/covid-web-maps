// =====================
// MAP 1: Choropleth (Rates/Counts)
// =====================

// 1) Create the map
const map = L.map("map").setView([37.8, -96], 4);

// 2) Basemap
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

// 3) Pick which field to map (we will use cases from counts geojson)
const FIELD = "cases";

// 4) Color function
function getColor(d) {
  d = Number(d);
  return d > 50000 ? "#800026" :
         d > 20000 ? "#BD0026" :
         d > 10000 ? "#E31A1C" :
         d > 5000  ? "#FC4E2A" :
         d > 1000  ? "#FD8D3C" :
         d > 0     ? "#FEB24C" :
                    "#FFEDA0";
}

// 5) Style function
function style(feature) {
  return {
    fillColor: getColor(feature.properties[FIELD]),
    weight: 0.3,
    opacity: 1,
    color: "white",
    fillOpacity: 0.75
  };
}

let geojsonLayer;

// 6) Load the correct polygon geojson (COUNTS = polygons)
fetch("assets/us-covid-2020-counts.geojson")
  .then(r => r.json())
  .then(data => {

    geojsonLayer = L.geoJSON(data, {
      style: style,
      onEachFeature: (feature, layer) => {
        const p = feature.properties;
        layer.bindPopup(
          `<b>${p.county}, ${p.state}</b><br>
           Cases: ${p.cases}<br>
           Deaths: ${p.deaths}`
        );

        // hover highlight
        layer.on({
          mouseover: (e) => {
            e.target.setStyle({ weight: 2, color: "#000" });
          },
          mouseout: (e) => {
            geojsonLayer.resetStyle(e.target);
          }
        });
      }
    }).addTo(map);

  })
  .catch(err => console.error("GeoJSON load error:", err));

// 7) Legend
const legend = L.control({ position: "bottomright" });

legend.onAdd = function () {
  const div = L.DomUtil.create("div", "legend");
  const grades = [0, 1000, 5000, 10000, 20000, 50000];

  div.innerHTML = "<b>Cases</b><br>";
  for (let i = 0; i < grades.length; i++) {
    const from = grades[i];
    const to = grades[i + 1];
    div.innerHTML +=
      `<i style="background:${getColor(from + 1)}"></i> ${from}${to ? "&ndash;" + to : "+"}<br>`;
  }
  return div;
};

legend.addTo(map);
