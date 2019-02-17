//map.js create by: Luis Eduardo Otalora Cubides

//put the poligons on the map
//draw the poligons
async function drawpoligons() {
  //map.data.loadGeoJson(linkpoligons);
  await getDatageo(linkpoligons);
  for(i in poligons){
    districts[i]["poligs"]=[]
    districts[i]["center"]={}
    districts[i]["id"]=poligons[i].id
    if(poligons[i].type == "Polygon"){
      putpoligon(poligons[i].coords,i);
    }else{
      poligons[i].coords.forEach((element) =>{
        putpoligon(element,i);
      })
    }
  }
  await calculateDistances(); 
  
}
function putpoligon(coords,i){
  var tempol = new google.maps.Polygon({
    paths: coords,
    strokeColor: '#C29CFF',
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: '#C29CFF',
    fillOpacity: 0.35,
    title: String(poligons[i].id)
  });
  tempol.setMap(map);
  mappoligons.push(tempol);
  tempol.addListener('click', (event) => {console.log(districts[i])});
  districts[i]["poligs"].push(mappoligons.length-1);
  let bounds = new google.maps.LatLngBounds();
  coords.forEach(element => {
    bounds.extend(element);
  });
  if(Object.keys(districts[i]["center"]).length === 0){
    districts[i]["center"]={"lat":bounds.getCenter().lat(),"lng":bounds.getCenter().lng()}
  }else{
    let lat = (districts[i]["center"]["lat"]+bounds.getCenter().lat())/2;
    let lng = (districts[i]["center"]["lng"]+bounds.getCenter().lng())/2; 
    districts[i]["center"]={"lat":lat,"lng":lng}
  }
  
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
async function onGoogleMapResponse() {
  map = new google.maps.Map(document.getElementById('googleMapContainer'), {
    center: {
      lat: 40.7291,
      lng: -73.9965
    },
    zoom: 11
  });
  //put the university marker
  putmarker(upos,{url: "https://img.icons8.com/color/48/000000/region-code.png"},"NYU");
  await drawpoligons();
  getDatarisk(linkrisk);
}