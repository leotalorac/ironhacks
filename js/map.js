//map.js create by: Luis Eduardo Otalora Cubides
var map;
//put the poligons on the map
function getpoligons() {
  map.data.loadGeoJson('https://services5.arcgis.com/GfwWNkhOj9bNBqoJ/arcgis/rest/services/nycd/FeatureServer/0/query?where=1=1&outFields=*&outSR=4326&f=geojson');
  map.data.setStyle({
    fillColor: '#b097c1',
    strokeColor: "#b097c1"
  });
}
//draw the poligons
function drawpoligons() {
  getpoligons();
}
//map response
function onGoogleMapResponse() {
  map = new google.maps.Map(document.getElementById('googleMapContainer'), {
    center: {
      lat: 40.7291,
      lng: -73.9965
    },
    zoom: 11
  });
  //put the university marker
  var marker = new google.maps.Marker({
    position: {
      lat: 40.729364,
      lng: -73.996480
    },
    map: map,
    icon: {
      url: "https://img.icons8.com/color/48/000000/region-code.png"
    },
    title: 'NYU'
  });
  drawpoligons();
}