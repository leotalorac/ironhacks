const linkpoligons = "https://services5.arcgis.com/GfwWNkhOj9bNBqoJ/arcgis/rest/services/nycd/FeatureServer/0/query?where=1=1&outFields=*&outSR=4326&f=geojson"
const nottoshow = [58, 29, 65, 64, 20, 66, 67, 9, 39, 14]
var districts = {};
var poligons = {};
let poglo;
var map;
var mappoligons = [];
var mapmarkers = [];
var upos = {
    "lat": 40.729364,
    "lng": -73.996480
};

var risk=0;
var dis=0;
var aff =0;

var colors = ["#FF0000", "#FF5D5C", "#FFA7A4", "black", "yellow"]
//scroll down
$("#tablebutton").click(function () {
    $('.infodisplay').animate({
            scrollTop: $(".showdata").offset().top
        },
        "slow");
});
//scroll up
$("#mapbutton").click(function () {
    $('.infodisplay').animate({
            scrollTop: $(".mapcontainer").offset().top
        },
        "slow");
});

function getDatageo(url) {
    let datafull;
    let data = $.get(url, () => {})
        .done(() => {
            let tem = JSON.parse(data.responseText).features;
            //poglo = tem
            for (i in tem) {
                if (!(nottoshow.includes(tem[i]["id"]))) {
                    let coords = tem[i]["geometry"]["coordinates"][0]
                    let jsoncoods = []
                    if (tem[i]["geometry"]["type"] === "Polygon") {
                        let coords = tem[i]["geometry"]["coordinates"][0]
                        coords.forEach((element) => {
                            jsoncoods.push({
                                "lat": element[1],
                                "lng": element[0]
                            })
                        })
                    } else {
                        let coords = tem[i]["geometry"]["coordinates"]
                        coords.forEach((element) => {
                            let jarr = []
                            element.forEach((e) => {
                                e.forEach((v) => {
                                    jarr.push({
                                        "lat": v[1],
                                        "lng": v[0]
                                    })
                                })
                            });
                            jsoncoods.push(jarr)
                        })
                    }
                    poligons[i] = {
                        "id": tem[i]["id"],
                        "type": tem[i]["geometry"]["type"],
                        "coords": jsoncoods,
                    }
                    districts[i] = {
                        "boro": (tem[i]["properties"]["BoroCD"] - (tem[i]["properties"]["BoroCD"] % 100)) / 100
                    }
                }
            }
        });
    return new Promise(resolve => {
        setTimeout(() => {
            resolve("yess");
        }, 1000);
    });
}

function calculateDistances() {
    for (i in districts) {
        let sumlat = districts[i].center.lat - upos.lat;
        let sumlng = districts[i].center.lng - upos.lng;
        let distance = Math.sqrt((sumlat ** 2) + (sumlng ** 2))
        districts[i]["distance"] = distance
    }
}

//slider
$("#afforslider").change((event) => {
    aff = event.target.value;
});
$("#riskslider").change((event) => {
    risk = event.target.value;
});
$("#distanceslider").change((event) => {
    dis = event.target.value;
    if (parseInt(aff) === 0 && parseInt(risk) === 0) {
        if (event.target.value >= 90) {
            for (i in districts) {
                let pol = districts[i].poligs;
                let d = districts[i].distance
                pol.forEach((poligon) => {
                    mappoligons[poligon].setOptions({
                        strokeColor: "black",
                        strokeOpacity: 0.8,
                        strokeWeight: 1,
                        fillColor: colors[0],
                        fillOpacity: 1 - (d * 3)
                    });
                });
                
            }
        } else if (event.target.value >= 50) {
            for (i in districts) {
                let pol = districts[i].poligs;
                let d = districts[i].distance
                pol.forEach((poligon) => {
                    mappoligons[poligon].setOptions({
                        strokeColor: "black",
                        strokeOpacity: 0.8,
                        strokeWeight: 1,
                        fillColor: colors[1],
                        fillOpacity: 1 - (d * 3)
                    });
                });
            }
        } else {
            for (i in districts) {
                let pol = districts[i].poligs;
                let d = districts[i].distance
                pol.forEach((poligon) => {
                    mappoligons[poligon].setOptions({
                        strokeColor: "black",
                        strokeOpacity: 0.8,
                        strokeWeight: 1,
                        fillColor: colors[2],
                        fillOpacity: 1 - (d * 3)
                    });
                });
            }
        }
        var sortable = [];
        for (var distric in districts) {
            sortable.push([distric, districts[distric]["distance"]]);
        }
        sortable.sort(function(a, b) {
            return a[1] - b[1];
        }).reverse();
        console.log(sortable)
        let table = $("#tablebody");
        let o =0;
        sortable.forEach((element) =>{
            table.append("<tr><th scope='row'>"+o+"</th> <td>District "+element[0]+"</td> "+"<td>"+element[1]+"</td></tr>");
            o++;
        });
    }else{
        mappoligons.forEach((element) =>{
            element.setOptions({
                strokeColor: '#C29CFF',
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: '#C29CFF',
                fillOpacity: 0.35
            });
        })
    }

});