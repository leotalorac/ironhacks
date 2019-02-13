//map.js create by: Luis Eduardo Otalora Cubides
var map;
var mappoligons=[];
var mapmarkers=[];
var upos = {"lat": 40.729364,"lng": -73.996480};
var colors =["red","blue","green","black","yellow"]
var maxdist = 0.2658503482103375
//put the poligons on the map
//draw the poligons
async function drawpoligons() {
  //map.data.loadGeoJson(linkpoligons);
  await getDatageo(linkpoligons);
  for(i in poligons){
    if(poligons[i].type == "Polygon"){
      putpoligon(poligons[i].coords);
    }else{
      poligons[i].coords.forEach((element) =>{
        putpoligon(element);
      })
    }
  }
}
function putpoligon(coords){
  var tempol = new google.maps.Polygon({
    paths: coords,
    strokeColor: '#FF0000',
    strokeOpacity: 0.8,
    strokeWeight: 3,
    fillColor: '#FF0000',
    fillOpacity: 0.35
  });
  tempol.setMap(map);
  mappoligons.push(tempol);

}
function putmarker(position,icon,title){
  var marker = new google.maps.Marker({
    position:position,
    map: map,
    icon: icon,
    title:title
  });
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
  putmarker(upos,{url: "https://img.icons8.com/color/48/000000/region-code.png"},"NYU");
  drawpoligons();
}