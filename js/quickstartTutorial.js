//Leaflet quick start guide

//map method creates a map within the 'map' div.
//the setView method modifies the map to set the coordinates and zoom level upon load
var map = L.map('map').setView([51.505, -0.09], 13);

//add tile layer method takes a url string and has other options including minZoom, maxZoom
L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

//add marker
// marker method places a marker based on coordinates and other optional options including icon customization
var marker = L.marker([51.5, -0.09]).addTo(map);

//add a circle. coordinates required, other options include stroke, color, opacity, radius, fill, etc.
var circle = L.circle([51.508, -0.11], {
    color: 'red',
    fillColor: '#f03',
    fillOpacity: 0.5,
    radius: 500
}).addTo(map);

//add a polygon method requires vertices specified. additional attributes similar to circle.
var polygon = L.polygon([
    [51.509, -0.08],
    [51.503, -0.06],
    [51.51, -0.047]
]).addTo(map);

//pop-ups
//bindPopup binds a popup (specified within div) to var 'marker' and var 'circle' and var 'polygon'
marker.bindPopup("<b>Hello world!</b><br>I am a popup.").openPopup();
circle.bindPopup("I am a circle.");
polygon.bindPopup("I am a polygon.");

/*
//pop-up as layer (standalone)
var popup = L.popup()
    .setLatLng([51.513, -0.09])
    .setContent("I am a standalone popup.")
    .openOn(map);

//on click display lat lon
function onMapClick(e) {
    alert("You clicked the map at " + e.latlng);
}
*/

var popup = L.popup();

function onMapClick(e) {
    popup
        .setLatLng(e.latlng)
        .setContent("You clicked the map at " + e.latlng.toString())
        .openOn(map);
}

map.on('click', onMapClick);