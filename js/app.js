// map variable holds an object from MAP class
var map;
// Array of markers to hide them all
// FourSquare ClientID & clientSecret
var clientID = "DFILLPUZKNSZEIVU5VN50KXPF5VSWXVKB1CSJDDS10WBCWAU";
var clientSecret = "EELUR24EMGWNJ2C3R5NXHOJOFRZE2UGOKVA2D0EI4AL2MO4A";
// InfoWindow Object to show information on every marker
var Appinfowindow;
// Markers array holds my markers
var Markers = [];
// These are the real estate listings that will be shown to the user.
var nearByLocaions = [
    {
        title: "Primoz Pizza",
        location: { lat: 30.112503, lng: 31.348311 }
    },
    {
        title: "El-Sadat Park",
        location: { lat: 30.165822, lng: 31.424106 }
    },
    {
        title: "Chili's Al Merghani",
        location: { lat: 30.085275, lng: 31.333463 }
    },
    {
        title: "Saudi German Hospital - Cairo",
        location: { lat: 30.132663, lng: 31.384305 }
    },
    {
        title: "Post Office - El Salam City",
        location: { lat: 30.167742, lng: 31.413091 }
    },
    {
        title: "Citystars Heliopolis",
        location: { lat: 30.072979, lng: 31.346050 }
    }
];


// Konckout Place model
var Place = function (place) {
    // Place Info to use in view
    var self = this;
    self.Name = place.title;
    self.Location = place.location;
    self.URI = "";
    self.ID = "";
    self.Address = "";
    // boolean variable to determine when to set marker
    self.Visible = ko.observable(true);
    // FourSquare API URI
    var FourSquareSearchApiUri = "https://api.foursquare.com/v2/venues/search?ll=" +
        self.Location.lat + "," + self.Location.lng + "&client_id=" + clientID + "&client_secret=" + clientSecret +
        "&v=20180203&query=" + self.Name;
    // Get Request To fetch data Synchronunsly from foursquare API
    var jqXHR = $.ajax({
        url: FourSquareSearchApiUri,
        dataType: 'json',
        async: false
    });
    // Variable holds results
    var mydata = "";
    // On Seccess
    jqXHR.done(function (data) {
        mydata = data;
    }).fail(function () {
        alert("an Error has occured in FourSquare API, try again.");
    });
    // Get results from the get request
    var results = mydata.response.venues[0];
    // extracting Id of location 
    self.ID = results.id;
    // extracting formatted Address of location
    self.Address = getAddress(results.location.formattedAddress);

    // Constructing InfoWindow HTML
    self.InfoWindowContent = '<div>' +
        '<div>' + self.Name + '</div>' +
        '<div><p>' + self.Address + '</p></div>' +
        '</div>';

    // Infow Window Object
    self.InfoWindow = new google.maps.InfoWindow({ content: self.InfoWindowContent });

    // Style the markers a bit. This will be our listing marker icon.
    var defaultIcon = makeMarkerIcon('5bc0de');

    // Create a "highlighted location" marker color for when the user
    // mouses over the marker.
    var highlightedIcon = makeMarkerIcon('ff2828');

    // Marker object
    self.marker = new google.maps.Marker({
        position: new google.maps.LatLng(self.Location.lat, self.Location.lng),
        map: map,
        icon: defaultIcon,
        title: self.Name,
        infowindow: self.InfoWindow
    });

    // Setting Visibilty of marker 
    self.showMarker = ko.computed(function () {
        if (self.Visible() === true) {
            self.marker.setMap(map);
        } else {
            self.marker.setMap(null);
        }
        return true;
    }, this);

    // Adding marker to Markers Array
    Markers.push(self.marker);
    // Adding Listener to click event
    self.marker.addListener('click', function () {
        // Hide All Infow Windows befor showing this info window
        hideAllInfoWindows();
        // Opening Info Window
        self.InfoWindow.open(map, self.marker);
        // Setting Animation bounce
        self.marker.setAnimation(google.maps.Animation.BOUNCE);
        // Setting Time Out To stop marker From Bouncing
        setTimeout(function () {
            self.marker.setAnimation(null);
        }, 2000);
    });
    // Two event listeners - one for mouseover, one for mouseout,
    // to change the colors back and forth.
    self.marker.addListener('mouseover', function () {
        this.setIcon(highlightedIcon);
    });
    self.marker.addListener('mouseout', function () {
        this.setIcon(defaultIcon);
    });

    // Setting trigger Bounce event marker to call it from the view
    self.bounceElement = function () {
        google.maps.event.trigger(self.marker, 'click');
    };
};

// Format Address
function getAddress(array) {
    var tmp = "";
    for (var i = 0; i < array.length; i++) {
        tmp += array[i];
        if (i == array.length - 1) {
            tmp += " .";
        }
        else {
            tmp += ", ";
        }
    }
    return tmp;
}


// Hide All Markers
function hideAllInfoWindows() {
    Markers.forEach(function (marker) {
        marker.infowindow.close(map, marker);
    });
    Markers.forEach(function (marker) {
        marker.setAnimation(null);
    });
}


// Knockout ViewModel variable
var ViewModel = function () {
    var self = this;

    // Search Phrase to filter the list
    self.searchPhrase = ko.observable("");

    // List Of places
    self.Places = ko.observableArray([]);

    // Constructor creates a new map - only center and zoom are required.
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 30.165822, lng: 31.424106 },
        zoom: 13
    });

    // Boundary Object to fit locations in the map
    var bounds = new google.maps.LatLngBounds();
    //
    nearByLocaions.forEach(function (location) {
        bounds.extend(location.location);
    });
    // Extend the boundaries of the map for each marker
    map.fitBounds(bounds);

    // Adding all nearByLocations items to Places list to filter them
    nearByLocaions.forEach(function (location) {
        self.Places.push(new Place(location));
    });

    // Filtering functionality based on word bounded to the search box in the view
    self.filterdPlaces = ko.computed(function () {
        var filteredItem = self.searchPhrase().toLowerCase();
        if (!filteredItem) {
            self.Places().forEach(function (place) {
                place.Visible(true);
            });
            return self.Places();
        }
        else {
            return ko.utils.arrayFilter(self.Places(), function (place) {
                var placeName = place.Name.toLowerCase();
                var match = (placeName.search(filteredItem) >= 0);
                place.Visible(match);
                return match;
            });
        }
    }, this);
};


// Starting the app and called in google API URI
function startApp() {
    ko.applyBindings(new ViewModel());
}


// Handling possible errors from google API
function googleAPIError() {
    alert("Snap! Something error happened in google map API");
}


// This function takes in a COLOR, and then creates a new marker
// icon of that color. The icon will be 21 px wide by 34 high, have an origin
// of 0, 0 and be anchored at 10, 34).
function makeMarkerIcon(markerColor) {
    var markerImage = new google.maps.MarkerImage(
        'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor +
        '|40|_|%E2%80%A2',
        new google.maps.Size(21, 34),
        new google.maps.Point(0, 0),
        new google.maps.Point(10, 34),
        new google.maps.Size(21, 34));
    return markerImage;
}


// Sliders Animation functionsS
$(document).ready(function () {
    $("#sidebar").mCustomScrollbar({
        theme: "minimal"
    });

    $('#dismiss, .overlay').on('click', function () {
        $('#sidebar').removeClass('active');
        $('.overlay').fadeOut();
    });

    $('#sidebarCollapse').on('click', function () {
        $('#sidebar').addClass('active');
        $('.overlay').fadeIn();
        $('.collapse.in').toggleClass('in');
        $('a[aria-expanded=true]').attr('aria-expanded', 'false');
    });
});


// Close Side Bar
function closeSideBar() {
    $('#sidebar').removeClass('active');
    $('.overlay').fadeOut();
}
