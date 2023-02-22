// Add all scripts to the JS folder
/* Map of GeoJSON data from MegaCities.geojson */
//declare map var in global scope
var map;
//function to instantiate the Leaflet map

var Stamen_TonerLite = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}{r}.{ext}', {
	attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	subdomains: 'abcd',
	minZoom: 0,
	maxZoom: 20,
	ext: 'png'
});

function createMap(){
    //create the map
    map = L.map('map', {
        center: [43.0722, -89.4008],
        zoom: 12,
        maxZoom: 15,
        minZoom: 10,
        /*maxBounds: ([
            [43.23085178258045, -89.79559068008334],
            [42.92005741190916, -89.08330927226481]]) */
    });

    //add OSM base tilelayer
    Stamen_TonerLite.addTo(map);

    //call getData function
    getData();
};

function onEachFeature(feature, layer) {
    //no property named popupContent; instead, create html string with all properties
    var popupContent = "";
    if (feature.properties) {
        //loop to add feature property names and values to html string
        for (var property in feature.properties){
            popupContent += "<p>" + property + ": " + feature.properties[property] + "</p>";
        }
        layer.bindPopup(popupContent);
    };
};

//function to retrieve the data and place it on the map
function getData(){
    //trying to add the polygon layer for the neighborhoods underneath the circles
    
    /* ----- WORK ON THIS SECTION -----
    fetch("data/mdsn_nbrhds_poly.geojson")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            //create polygon options for neighborhoods

            json.forEach(function(neighborhood) {
                var neighborhood_polygonOptions = {
                    stroke: true,
                    color: '#a1918e',
                    weight: 1,
                    fill: false
                };
            }).addTo(map);
        });
    */ //------ ASK OUT THIS SECTION -----
    
    fetch("data/mdsn_nbrhds.geojson")
        .then(function(response){
            return response.json();
        })
        .then(function(json){            
            //create marker options
            var geojsonMarkerOptions = {
                radius: 8,
                fillColor: "#ff7800",
                color: "#000",
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            };
            //create a Leaflet GeoJSON layer and add it to the map
            L.geoJson(json, {
                pointToLayer: function (feature, latlng){
                    return L.circleMarker(latlng, geojsonMarkerOptions);
                },
                onEachFeature: onEachFeature
            }).addTo(map);
        });
};

document.addEventListener('DOMContentLoaded',createMap)