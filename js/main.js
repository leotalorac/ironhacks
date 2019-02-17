const linkpoligons = "https://services5.arcgis.com/GfwWNkhOj9bNBqoJ/arcgis/rest/services/nycd/FeatureServer/0/query?where=1=1&outFields=*&outSR=4326&f=geojson"
const linkrisk = "https://data.cityofnewyork.us/resource/9s4h-37hy.json?cmplnt_fr_dt=2015-12-31T00:00:00.000"
const linkaff = "https://data.cityofnewyork.us/api/views/hg8x-zxpr/rows.json?accessType=DOWNLOAD"
//const nottoshow = [58, 29, 65, 64, 20, 66, 67, 9, 39, 14]
//const nottoshow = [55, 62, 27, 61, 18, 63, 64, 8, 12, 36, 29]
var districts = {};
let crimes = [];
//let wachapanda ={1: 6, 2: 15, 3: 11, 4: 9, 5: 16, 6: 21, 7: 13, 8: 1, 9: 30, 10: 13, 11: 11, 12: 0, 13: 13, 14: 30, 15: 9, 16: 24, 17: 20, 18: 0, 19: 8, 20: 22, 21: 41, 22: 15, 23: 13, 24: 37, 25: 25, 26: 10, 27: 2, 28: 19, 29: 0, 30: 14, 31: 12, 32: 32, 33: 9, 34: 9, 35: 14, 36: 0, 37: 23, 38: 0, 39: 20, 40: 15, 41: 6, 42: 13, 43: 18, 44: 7, 45: 25, 46: 19, 47: 20, 48: 12, 49: 33, 50: 14, 51: 21, 52: 18, 53: 18, 54: 24, 55: 2, 56: 21, 57: 10, 58: 5, 59: 15, 60: 7, 61: 0, 62: 0, 63: 0, 64: 1, 65: 12, 66: 12, 67: 16, 68: 7, 69: 25, 70: 23, 71: 14}
var poligons = {};
let poglo;
var map;
var mappoligons = [];
var mapmarkers = [];
var upos = {
    "lat": 40.729364,
    "lng": -73.996480
};
var risk = 0;
var dis = 0;
var aff = 0;

var colors = ["#6900FF", "#9954FF", "#BD93FF", "#FFCE1A", "#FFD546","#FFE282","#1DFF93","#7AFFBD","#D1FFEB"]
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

async function getDatageo(url) {
    let datafull;
    let data = $.get(url, () => {})
        .done(() => {
            let tem = JSON.parse(data.responseText).features;
            poglo = tem
            for (i in tem) {
                    let coords = tem[i]["geometry"]["coordinates"]
                    let jsoncoods = []
                    let type ="Polygon"
                    if (coords.length ===1) {
                        let coords = tem[i]["geometry"]["coordinates"][0]
                        coords.forEach((element) => {
                            jsoncoods.push({
                                "lat": element[1],
                                "lng": element[0]
                            })
                        })
                    } else {
                        let coords = tem[i]["geometry"]["coordinates"]
                        type = "Multipolygon"
                        coords.forEach((element) => {
                            let jarr = []
                            element.forEach((e) => {
                                e.forEach((v) =>{
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
                        "type": type,
                        "coords": jsoncoods,
                    }
                    districts[i] = {
                        "boro": (tem[i]["properties"]["BoroCD"] - (tem[i]["properties"]["BoroCD"] % 100)) / 100,
                        "code":tem[i]["properties"]["BoroCD"],
                        "crimes":0,
                        "projects":0
                    }
                }
        });
    return new Promise(resolve => {
        setTimeout(() => {
            resolve("yess");
        }, 1500);
    });
}
async function getDatarisk(url){
    let data = $.get(url)
        .done(()  => {
            let tem = JSON.parse(data.responseText);
            // for(i in districts){
            //     districts[i]["crimes"] = wachapanda[districts[i].id];
            // }
            // for (j in districts){
            //     wachapanda[districts[j].id] = 0
            // }
            var coordinate;
            var coords;
            var jsoncoods;
            //alert("please wait...")
            yieldingLoop(tem.length,10,(i)=>{
                let coords = tem[i]["lat_lon"]["coordinates"]
                let jsoncoods = {"lat":coords[1],"lng":coords[0]};
                coordinate = new google.maps.LatLng(jsoncoods);//replace with your lat and lng values
                //console.log(i)
                for(j in districts){
                    districts[j]["poligs"].forEach((e)=>{
                        var isWithinPolygon = google.maps.geometry.poly.containsLocation(coordinate, mappoligons[e]);
                        if(isWithinPolygon){
                            districts[j].crimes++;
                        }
                    });
                }
            },()=>{alert("done")})
            //     for(let i =0;i<tem.length;i++){
            //         let coords = tem[i]["lat_lon"]["coordinates"]
            //         let jsoncoods = {"lat":coords[1],"lng":coords[0]};
            //         coordinate = new google.maps.LatLng(jsoncoods);//replace with your lat and lng values
            //         //console.log(i)
            //         for(j in districts){
            //             districts[j]["poligs"].forEach((e)=>{
            //                 var isWithinPolygon = google.maps.geometry.poly.containsLocation(coordinate, mappoligons[e]);
            //                 if(isWithinPolygon){
            //                     districts[j].crimes++;
            //                 }
            //             });
            //         }
            //     }
            // alert("done")
        });
        return new Promise(resolve => {
            setTimeout(() => {
                resolve("yess");
            }, 1500);
        });
}
async function getDataaff(url){
    let data = $.get(url)
        .done(() =>{
            let tem = JSON.parse(data.responseText)["data"];
            let coords;
            let jsoncoords;
            //let projects=[]
            yieldingLoop(tem.length,10,(i)=>{
                coords = [parseFloat(tem[i][23]),parseFloat(tem[i][24])];
                if(coords[0] != null){
                    jsoncoords = {"lat":coords[0],"lng":coords[1]}
                    coordinate = new google.maps.LatLng(jsoncoords);//replace with your lat and lng values
                    for(j in districts){
                        districts[j]["poligs"].forEach((e)=>{
                            var isWithinPolygon = google.maps.geometry.poly.containsLocation(coordinate, mappoligons[e]);
                            //console.log(isWithinPolygon)
                            if(isWithinPolygon){
                                districts[j].projects++;
                            }
                        });
                    }
                    //projects.push(jsoncoords);
                }
            },() => {alert("done2")})
            // for(let i =0;i<tem.length;i++){
            //     coords = [tem[i][23],tem[i][24]];
            //     if(coords[0] != null){
            //         jsoncoords = {"lat":coords[0],"lng":coords[1]}
            //         coordinate = new google.maps.LatLng(jsoncoords);
            //         for(j in districts){
            //             districts[j]["poligs"].forEach((e)=>{
            //                 var isWithinPolygon = google.maps.geometry.poly.containsLocation(coordinate, mappoligons[e]);
            //                 if(isWithinPolygon){
            //                     districts[j].projects++;
            //                 }
            //             });
            //         }
            //         projects.push(jsoncoords);
            //     }
            // }
            //  console.log(projects)
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
    if (parseInt(aff) === 0 && parseInt(dis) === 0) {
        if (event.target.value == 3) {
            for (i in districts) {
                let pol = districts[i].poligs;
                let d = districts[i].crimes
                pol.forEach((poligon) => {
                    mappoligons[poligon].setOptions({
                        strokeColor: "white",
                        strokeOpacity: 0.8,
                        strokeWeight: 1,
                        fillColor: colors[3],
                        fillOpacity: 1 - (d/60)
                    });
                });

            }
        }else if (event.target.value == 2) {
            for (i in districts) {
                let pol = districts[i].poligs;
                let d = districts[i].crimes
                pol.forEach((poligon) => {
                    mappoligons[poligon].setOptions({
                        strokeColor: "white",
                        strokeOpacity: 0.8,
                        strokeWeight: 1,
                        fillColor: colors[4],
                        fillOpacity: 1 - (d/60)
                    });
                });
            }
        } else if (event.target.value == 1) {
            for (i in districts) {
                let pol = districts[i].poligs;
                let d = districts[i].crimes
                pol.forEach((poligon) => {
                    mappoligons[poligon].setOptions({
                        strokeColor: "white",
                        strokeOpacity: 0.8,
                        strokeWeight: 1,
                        fillColor: colors[5],
                        fillOpacity: 1 - (d/60)
                    });
                });
            }
        } else {
            mappoligons.forEach((element) => {
                element.setOptions({
                    strokeColor: '#C29CFF',
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    fillColor: '#C29CFF',
                    fillOpacity: 0.35
                });
            })
        }
    }
});
$("#distanceslider").change((event) => {
    dis = event.target.value;
    if (parseInt(aff) === 0 && parseInt(risk) === 0) {
        if (event.target.value == 3) {
            for (i in districts) {
                let pol = districts[i].poligs;
                let d = districts[i].distance
                pol.forEach((poligon) => {
                    mappoligons[poligon].setOptions({
                        strokeColor: "white",
                        strokeOpacity: 0.8,
                        strokeWeight: 1,
                        fillColor: colors[0],
                        fillOpacity: 1 - (d * 3)
                    });
                });

            }
        } else if (event.target.value == 2) {
            for (i in districts) {
                let pol = districts[i].poligs;
                let d = districts[i].distance
                pol.forEach((poligon) => {
                    mappoligons[poligon].setOptions({
                        strokeColor: "white",
                        strokeOpacity: 0.8,
                        strokeWeight: 1,
                        fillColor: colors[1],
                        fillOpacity: 1 - (d * 3)
                    });
                });
            }
        } else if (event.target.value == 1) {
            for (i in districts) {
                let pol = districts[i].poligs;
                let d = districts[i].distance
                pol.forEach((poligon) => {
                    mappoligons[poligon].setOptions({
                        strokeColor: "white",
                        strokeOpacity: 0.8,
                        strokeWeight: 1,
                        fillColor: colors[2],
                        fillOpacity: 1 - (d * 4)
                    });
                });
            }
        } else {
            mappoligons.forEach((element) => {
                element.setOptions({
                    strokeColor: '#C29CFF',
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    fillColor: '#C29CFF',
                    fillOpacity: 0.35
                });
            })
        }
        var sortable = [];
        for (var distric in districts) {
            sortable.push([distric, districts[distric]["distance"]]);
        }
        sortable.sort(function (a, b) {
            return a[1] - b[1];
        }).reverse();
        let table = $("#tablebody");
        let o = 1;
        for(let i =sortable.length-1;i>=sortable.length-11;i--){
            table.append("<tr><th scope='row'>" + o + "</th> <td>District " + sortable[i][0] + "</td> " + "<td>" + sortable[i][1] + "</td></tr>");
            o++;
        }        
    } else {
        mappoligons.forEach((element) => {
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




//utils
//taken from https://stackoverflow.com/questions/26615966/how-to-make-non-blocking-javascript-code
function yieldingLoop(count, chunksize, callback, finished) {
    var i = 0;
    (function chunk() {
        var end = Math.min(i + chunksize, count);
        for ( ; i < end; ++i) {
            callback.call(null, i);
        }
        if (i < count) {
            setTimeout(chunk, 0);
        } else {
            finished.call(null);
        }
    })();
}