//Luke Chamberlain
//March 8 2023

//declare empty variables
var map;
var minValue;
var dataStats = {};

//basemap
var Stamen_TonerLite = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}{r}.{ext}', {
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    subdomains: 'abcd',
    minZoom: 0,
    maxZoom: 20,
    opacity: 0.4,
    ext: 'png'
});

//Constructor function creating PopupContent object to reduce redundant code
function PopupContent(properties, attribute) {
    this.properties = properties;
    this.attribute = attribute;
    this.year = attribute.slice(-2);
    this.units = ""
    if (this.properties[attribute] == -1) {
        this.units = "MISSING DATA"
    }
    else (this.units = this.properties[attribute]);
    this.formatted = "<p><b>Neighborhood:</b> " + this.properties.geo + "</p><p><b>Dwelling Units in 20" + this.year + ":</b> " + this.units + " </p>";

};

//step 1: create map
function createMap() {
    //where the map loads
    map = L.map('map', {
        center: [43.0722, -89.4008],
        zoom: 11.7,
        maxZoom: 15,
        minZoom: 10,
        maxBounds: ([
        [43.23085178258045, -89.9],
        [42.92005741190916, -88.95]]) 
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

//function calculates the minimum value of the dataset for determining proportional symbol scaling
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
    dataStats.min = Math.min(...allValues);
    dataStats.max = Math.max(...allValues);
    //calculate meanValue
    var sum = allValues.reduce(function (a, b) { return a + b; });
    dataStats.mean = sum / allValues.length;

    return minValue;
}

//function calculates the radius of each proportional symbol
function calcPropRadius(attValue) {
    //constant factor adjusts symbol sizes evenly -- I added the 0.8 to test different scaling
    var minRadius = 0.8 * 4;
    //Flannery Apperance Compensation formula
    //conditional if > -1
    //-1 used for "MISSING DATA"
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

//Function creates the circles on each point feature
function pointToLayer(feature, latlng, attributes) {
    //Determine which attribute to visualize with proportional symbols
    var attribute = attributes[0];
    //create marker options
    var options = {
        fillColor: "#81cce3",
        color: "#e6f0f2",
        weight: 0.8,
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

    var popup = new PopupContent(feature.properties, attribute);

    //bind the popup to the circle marker
    layer.bindPopup(popup.formatted);

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
    //this line updates the legend as you sequence. updates the "year" within the span div on line 260
    document.querySelector(".year").innerHTML = "20" + attribute.slice(-2);
    map.eachLayer(function (layer) {
        //this if statement filters based on attribute and geometry type. Filters out the polygon layer and the basemap
        if (layer.feature && layer.feature.properties[attribute] && layer.feature.geometry.type == "Point") {

            //access feature properties
            var props = layer.feature.properties;
            //update each feature's radius based on new attribute values
            var radius = calcPropRadius(props[attribute]);

            layer.setRadius(radius);

            var popupContent = new PopupContent(props, attribute);

            //update popup content            
            popup = layer.getPopup();
            popup.setContent(popupContent.formatted).update();
        };
    });
};

//create the slider and button controls to sequence through years
function createSequenceControls(attributes) {
    var SequenceControl = L.Control.extend({
        options: {
            position: 'bottomleft'
        },

        onAdd: function () {
            // create the control container div with a particular class name
            var container = L.DomUtil.create('div', 'sequence-control-container');

            //create range input element (slider)
            container.insertAdjacentHTML('beforeend', '<input class="range-slider" type="range">')
            container.insertAdjacentHTML('beforeend', '<button class="step" id="reverse" title="Reverse"><img src="img/arrow_left.png"></button>')
            container.insertAdjacentHTML('beforeend', '<button class="step" id="forward" title="Forward"><img src="img/arrow_right.png"></button>');

            //disable any mouse event listeners for the container
            L.DomEvent.disableClickPropagation(container);

            return container;
        }
    });

    map.addControl(new SequenceControl());    // add listeners after adding control}

    //set the range for the slider (10 steps)
    document.querySelector(".range-slider").max = 10;
    document.querySelector(".range-slider").min = 0;
    document.querySelector(".range-slider").value = 0;
    document.querySelector(".range-slider").step = 1;

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

//function makes the legend
function createLegend(attributes) {
    var LegendControl = L.Control.extend({
        options: {
            position: 'bottomright'
        },

        onAdd: function () {
            // create the control container with a particular class name
            var container = L.DomUtil.create('div', 'legend-control-container');
            //legend title
            container.innerHTML = '<p class="temporalLegend">Dwelling Units in <span class="year">2010</span></p>';

            //Step 1: start attribute legend svg string for the legend circles
            var svg = '<svg id="attribute-legend" width="100%" height="100%">';

            //array of circle names to base loop on
            var circles = ["max", "mean", "min"];

            //loop to add each circle and text to svg string
            for (var i = 0; i < circles.length; i++) {
                //circle string

                var radius = calcPropRadius(dataStats[circles[i]]);
                var cy = 137 - radius
                var cx = 80

                svg += '<circle class="legend-circle" id="' + circles[i] +
                    '" r="' + radius +
                    '" cx="' + cx +
                    '" cy="' + cy +
                    '" fill="#81cce3" fill-opacity="0.8" stroke="#E6F0F2" cx="65"/>';
                //evenly space out labels            
                var textY = i * 29 + 75;
                console.log(textY)
                            //text string            
            svg += '<text id="' + circles[i] + '-text" x="160" y="' + textY + '">' + Math.round(dataStats[circles[i]]*100)/100 + '</text>';
            };

            //close svg string
            svg += "</svg>";

            //add attribute legend svg to container
            container.insertAdjacentHTML('beforeend', svg);

            return container;
        }
    });
    //finally add legend to the map
    map.addControl(new LegendControl());
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
            //call functions to create proportional symbols, sequence controls, and legend
            createPropSymbols(json, attributes);
            createSequenceControls(attributes);
            createLegend(attributes);
        });
};

document.addEventListener('DOMContentLoaded', createMap)