//map.js create by: Luis Eduardo Otalora Cubides
var map;
var upos = {lat: 40.729364,lng: -73.996480};
var colors =["red","blue","green","black","yellow"]
var districts ={}
//put the poligons on the map
//draw the poligons
async function drawpoligons() {
  map.data.loadGeoJson(linkpoligons);
  await getDatageo(linkpoligons);
  map.data.setStyle(function (feature){  
    let id = feature.l.OBJECTID;
    let boor = parseInt(String(feature.l.BoroCD)[0]);
    let show = true;
    if(nottoshow.includes(id)){
      show = false;
    }else{
      districts[id] = {
        "nb":boor,
        "form":poligons[id-1].geometry.coordinates[0]
      }
    }
    return({
      title:id,
      fillColor: "#b097c1",
      strokeColor: "#b097c1",
      visible:show
    })
  });  
}
function putmarker(position,icon,title){
  var marker = new google.maps.Marker({
    position:position,
    map: map,
    icon: icon,
    title:title,
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