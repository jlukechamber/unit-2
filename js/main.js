// Add all scripts to the JS folder
/* Map of GeoJSON data from MegaCities.geojson */
//declare map var in global scope
var map;
var minValue;
//function to instantiate the Leaflet map

var Stamen_TonerLite = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}{r}.{ext}', {
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    subdomains: 'abcd',
    minZoom: 0,
    maxZoom: 20,
    opacity: 0.4,
    ext: 'png'
});

//step 1: create map
function createMap() {
    //create the map
    map = L.map('map', {
        center: [43.0722, -89.4008],
        zoom: 12,
        maxZoom: 15,
        minZoom: 10,
        //maxBounds: ([
        //  [43.23085178258045, -89.79559068008334],
        //[42.92005741190916, -89.08330927226481]]) 
    });

    //add OSM base tilelayer
    Stamen_TonerLite.addTo(map);

    //call getData function
    neighborhoods();
    getData(map);

};

//add neighborhood polygons to map
function neighborhoods() {
    fetch("data/mdsn_nbrhds_poly.geojson")
        .then(function (response) {
            return response.json();
        })
        .then(function (json) {
            var neighborhood_polygonOptions = {
                stroke: true,
                color: '#a1918e',
                weight: 1,
                fill: true
            };
            //create polygon options for neighborhoods
            L.geoJSON(json, {
                style: neighborhood_polygonOptions,
            }).addTo(map);
        });
}

function calculateMinValue(data) {
    //create empty array to store all data values
    var allValues = [];
    //loop through each neighborhood
    for (var hood of data.features) {
        //loop through each year
        for (var year = 10; year <= 20; year += 1) {
            //get population for current year
            var value = hood.properties["du_cty" + String(year)];
            //add value to array if value is greater than 0
            if (value > 0) { allValues.push(value); }
        }
    }
    //get minimum value of our array
    var minValue = Math.min(...allValues)

    return minValue;
}

//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
    //constant factor adjusts symbol sizes evenly
    var minRadius = 4;
    //Flannery Apperance Compensation formula
    //conditional if > 0
    if (attValue > -1) {
        var radius = 1.0083 * Math.pow(attValue / minValue, 0.5715) * minRadius;
    }
    else {
        var radius = 2;
    }
    //var radius = 1.0083 * Math.pow(attValue / minValue, 0.5715) * minRadius
    //else radius = minRadius
    return radius;
};

/*
function onEachFeature(feature, layer) {
    //no property named popupContent; instead, create html string with all properties
    var popupContent = "";
    if (feature.properties) {
        //loop to add feature property names and values to html string
        for (var property in feature.properties) {
            popupContent += "<p>" + property + ": " + feature.properties[property] + "</p>";
        }
        layer.bindPopup(popupContent);
    };
};
*/

function pointToLayer(feature, latlng, attributes) {
    //Determine which attribute to visualize with proportional symbols
    var attribute = attributes[0];
    console.log(attribute);
    //create marker options
    var options = {
        fillColor: "#ff7800",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8,
        pane: 'shadowPane'
    };

    //For each feature, determine its value for the selected attribute
    var attValue = Number(feature.properties[attribute]);

    //Give each feature's circle marker a radius based on its attribute value
    options.radius = calcPropRadius(attValue);

    //create circle marker layer
    var layer = L.circleMarker(latlng, options);

    //build popup content string
    var popupContent = "<p><b>Neighborhood:</b> " + feature.properties.geo + "</p>";
    console.log(feature.properties.geo)
    //add formatted attribute to popup content string
    var popupValue = feature.properties[attribute] == -1 ? "No Data" : feature.properties[attribute];
    // ----- EXAMPLE 2.3 I don't see the margins changing?? -----
    var year = attribute.slice(-2);
    popupContent += "<p><b>Housing units in " + "20" + year + ":</b> " + popupValue;

    //bind the popup to the circle marker
    layer.bindPopup(popupContent);

    //return the circle marker to the L.geoJson pointToLayer option
    return layer;
};

//Step 3: Add circle markers for point features to the map
function createPropSymbols(data, attributes) {

    //create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(data, {
        pointToLayer: function (feature, latlng) {
            return pointToLayer(feature, latlng, attributes);
        }
    }).addTo(map);
};

//Step 10: Resize proportional symbols according to new attribute values
function updatePropSymbols(attribute) {
    map.eachLayer(function (layer) {
        //Example 3.18 line 4
        if (layer.feature && layer.feature.properties[attribute] && layer.feature.geometry.type == "Point") {
            
            //access feature properties
            var props = layer.feature.properties;
            //update each feature's radius based on new attribute values
            var radius = calcPropRadius(props[attribute]);
            
            layer.setRadius(radius);
            
            //add city to popup content string
            var popupContent = "<p><b>Neighborhood:</b> " + props.geo + "</p>";
            //set missing data to -1 so that it doesn't register as "missing" data
            var popupValue = props[attribute] == -1 ? "No Data" : props[attribute];

            /*var popupValue;
            if (props[attribute] == -1){
                popupValue = "No Data";
            }
            else {
                popupValue = props[attribute];
            }*/

            //add formatted attribute to panel content string
            var year = attribute.slice(-2);
            popupContent += "<p><b>Housing units in " + "20" + year + ":</b> " + popupValue;

            //update popup content            
            popup = layer.getPopup();
            popup.setContent(popupContent).update();
        };
    });
};

//Step 1: Create new sequence controls
function createSequenceControls(attributes) {
    //create range input element (slider)
    var slider = "<input class='range-slider' type='range'></input>";
    document.querySelector("#panel").insertAdjacentHTML('beforeend', slider);

    document.querySelector(".range-slider").max = 10;
    document.querySelector(".range-slider").min = 0;
    document.querySelector(".range-slider").value = 0;
    document.querySelector(".range-slider").step = 1;

    document.querySelector('#panel').insertAdjacentHTML('beforeend', '<button class="step" id="reverse"></button>');
    document.querySelector('#panel').insertAdjacentHTML('beforeend', '<button class="step" id="forward"></button>');
    document.querySelector('#reverse').insertAdjacentHTML('beforeend', "<img src='img/arrow_left.png'>")
    document.querySelector('#forward').insertAdjacentHTML('beforeend', "<img src='img/arrow_right.png'>")

    //Step 5: click listener for buttons
    document.querySelectorAll('.step').forEach(function (step) {
        step.addEventListener("click", function () {
            var index = document.querySelector('.range-slider').value;

            //Step 6: increment or decrement depending on button clicked
            if (step.id == 'forward') {
                index++;
                //Step 7: if past the last attribute, wrap around to first attribute
                index = index > 10 ? 0 : index;
            } else if (step.id == 'reverse') {
                index--;
                //Step 7: if past the first attribute, wrap around to last attribute
                index = index < 0 ? 10 : index;
            };

            //Step 8: update slider
            document.querySelector('.range-slider').value = index;

            //Step 9: pass new attribute to update symbols
            updatePropSymbols(attributes[index]);
        })
    })

    document.querySelector('.range-slider').addEventListener('input', function () {
        //Step 6: get the new index value
        var index = this.value;
        
        //Step 9: pass new attribute to update symbols
        updatePropSymbols(attributes[index]);
    });
};

function processData(data) {
    //empty array to hold attributes
    var attributes = [];

    //properties of the first feature in the dataset
    var properties = data.features[0].properties;

    //push each attribute name into attributes array
    for (var attribute in properties) {
        //only take attributes with population values
        //EXPLAIN THIS PART
        if (attribute.indexOf("du") > -1) {
            attributes.push(attribute);
        };
    };

    //check result
    console.log(attributes);

    return attributes;
};

//function to retrieve the data and place it on the map
function getData(map) {
    fetch("data/mdsn_nbrhds_copy.geojson")
        .then(function (response) {
            return response.json();
        })
        .then(function (json) {
            //create an attributes array
            var attributes = processData(json);
            //calculate minimum data value
            minValue = calculateMinValue(json);
            //call function to create proportional symbols
            createPropSymbols(json, attributes);
            createSequenceControls(attributes);
        });
};

document.addEventListener('DOMContentLoaded', createMap)


//ISSUE: Once the prop symbol draws, it doesn't go back to not being drawn when the value
//is zero again.