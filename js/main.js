const linkpoligons = "https://services5.arcgis.com/GfwWNkhOj9bNBqoJ/arcgis/rest/services/nycd/FeatureServer/0/query?where=1=1&outFields=*&outSR=4326&f=geojson"
const nottoshow = [58,29,65,64,20,66,67,9,39,14]
var districts ={}
var poligons ={};
let poglo;
//scroll down
$("#tablebutton").click(function() {
    $('.infodisplay').animate({
        scrollTop: $(".showdata").offset().top},
        "slow");
});
//scroll up
$("#mapbutton").click(function() {  
    $('.infodisplay').animate({
        scrollTop: $(".mapcontainer").offset().top},
        "slow");
});
function getDatageo(url){
	let datafull;
	let data = $.get(url,()=>{})
		.done(() => {
            let tem = JSON.parse(data.responseText).features;
            poglo = tem
            console.log(tem[9])    
            for (i in tem){
                if(!(nottoshow.includes(tem[i]["id"]))){
                    let coords = tem[i]["geometry"]["coordinates"][0]
                    let jsoncoods =[]
                    if(tem[i]["geometry"]["type"] === "Polygon"){
                        let coords = tem[i]["geometry"]["coordinates"][0]
                        coords.forEach((element) =>{
                            jsoncoods.push({
                                "lat":element[1],
                                "lng":element[0]
                            })
                        })
                    }else{
                        let coords = tem[i]["geometry"]["coordinates"]
                        coords.forEach((element) =>{
                            let jarr = []
                            element.forEach((e) =>{
                                e.forEach((v) =>{
                                    jarr.push({
                                        "lat":v[1],
                                        "lng":v[0]
                                    })
                                })
                            });
                            jsoncoods.push(jarr)
                        })
                    }
                    poligons[i] = {
                        "id": tem[i]["id"],
                        "type":tem[i]["geometry"]["type"],
                        "coords":jsoncoods
                    }
                }
            }
		});
	return new Promise(resolve => {
        setTimeout(()=>{
            resolve("yess");
        },1000);
	});
}
function calculateCenter(){
    let d = Object.keys(districts);
    for(let i =0;i<2;i++){
        let lat = 0;
        let lng =0;
        let t =districts[d[i]]["form"].length;
        //console.log(districts[d[i]]["form"])
        for(let y =0;y<t;t++){
            lat += districts[d[i]]["form"][y][0];
            lng += districts[d[i]]["form"][y][1];
        }
        lat = lat/t;
        lng = lng/t
        districts[d[i]]["center"] = {lat:lat,lng:lng};
        //console.log(districts[i])
    }
}