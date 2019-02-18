//--------------------------global variables-------------------------
//datasets
const linkpoligons = "https://services5.arcgis.com/GfwWNkhOj9bNBqoJ/arcgis/rest/services/nycd/FeatureServer/0/query?where=1=1&outFields=*&outSR=4326&f=geojson"
const linkrisk = "https://data.cityofnewyork.us/resource/9s4h-37hy.json?cmplnt_fr_dt=2015-12-31T00:00:00.000"
const linkaff = "https://data.cityofnewyork.us/api/views/hg8x-zxpr/rows.json?accessType=DOWNLOAD"
const linknighthoods = "https://data.cityofnewyork.us/api/views/xyye-rtrs/rows.json?accessType=DOWNLOAD"
//extra
const linkgalleries = "https://data.cityofnewyork.us/api/views/43hw-uvdj/rows.json?accessType=DOWNLOAD"
const linkmuseums = "https://data.cityofnewyork.us/api/views/fn6f-htvy/rows.json?accessType=DOWNLOAD"


// position of the university
var upos = {
    "lat": 40.729364,
    "lng": -73.996480
};
var districts = {};



//elements from html

let chargebar = $("#progressbarmap");
let pcharge = $("#textchargin");

//-------------------------------map global variables-------------------
var map;
var mappoligons = [];
var mapmarkers = [];
var colors = ["#6900FF", "#9954FF", "#BD93FF", "#FFCE1A", "#FFD546", "#FFE282", "#1DFF93", "#7AFFBD", "#D1FFEB"]
var boros = ["Manhattan", "Brooklyn", "Queens", "Staten Island", "Bronx"]

//--------------------------------front animations---------------------------
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


//---------------------------------------sliders variables----------------------------
var risk = 0;
var dis = 0;
var aff = 0;


//--------------------------------------data analisis---------------------------------

//-------------------------------------poligons--------------------------------------
//get the poligons
async function getGeoData(url) {
    //try to wait until charge 
    return new Promise((resolve,reject) => {
        setTimeout(() => {
            //get the data
            let data = $.get(url, () => {
                //success
                console.log("geo data gotten")
            }).done(() => {
                //parse the json
                let datajson = JSON.parse(data.responseText).features;
                //log to revision
                //console.log(datajson)
                //convert to poligons
                datajson.forEach((element) => {
                    //the the coords to create a poligon
                    let coords = getbounds(element["geometry"]["coordinates"]);
                    //get the id
                    let id = element.id;
                    //get the boro cd and code
                    let borocd = element.properties.BoroCD
                    //get the boro for the array
                    let boro = Math.floor(borocd / 100) - 1
                    //put the info in the general datastructure
                    districts[id] = {
                        id,
                        borocd,
                        boro,
                        coords,
                        poligs:[],
                        crimes:[],
                        nightboors:[],
                        nnighboors:0,
                        center:{},
                        distance:0
                    }
                })
                console.log("geoshapes saved")
                resolve("geo data saved")
            })
            
        }, 300);
    })

}
//get the coords for  the poligon
function getbounds(jsonelement) {
    //variables to save 
    let coordsarr = [];
    let jsoncoods = {};
    let subarr;
    //round the array of coords 
    jsonelement.forEach((arr) => {
        subarr = []
        arr.forEach((coords) => {
            //transform on latlng objects
            jsoncoods = {
                "lat": coords[1],
                "lng": coords[0]
            }
            //save it
            subarr.push(jsoncoods)
        })
        //save it
        coordsarr.push(subarr);
    });
    //return the final array
    return coordsarr;
}

//---------------------------------------------nighboors----------------------------------

function getNightboors(url){
    return new Promise((resolve,reject)=>{
        setTimeout(() => {
            let data = $.get(url,()=>{
                console.log("neighbors gotten");
            })
            .done(()=>{
                let jsondata = JSON.parse(data.responseText).data
                let coords;
                jsondata.forEach((element)=>{
                    //get the coords
                    coords = element[8].replace("(","").replace(")","").split(" ")
                    coords = {
                        "lat":parseFloat(coords[2]),
                        "lng":parseFloat(coords[1])
                    }
                    //log for districts without nightboors 
                    let keys = Object.keys(districts)
                    yieldingLoop(keys.length,10,(i)=>{
                        console.log(keys[i]);
                        districts[keys[i]].poligs.forEach((pol)=>{
                            if(isinPolygon(coords,pol)){
                                //add the nightboors info
                                districts[keys[i]].nightboors.push(coords);
                                districts[keys[i]].nnighboors++;
                            }
                        })
                    })
                    // for(i in districts){
                    //     districts[i].poligs.forEach((pol)=>{
                    //         if(isinPolygon(coords,pol)){
                    //             //add the nightboors info
                    //             districts[i].nightboors.push(coords);
                    //             districts[i].nnighboors++;
                    //         }
                    //     })
                    // }
                })
                //delete the districts without inportance
                cleandistricts();
                console.log("done clear")
                progressbar("75%","done")
            })
        }, 500);
    });
}
//fucntion to delete the districts without nightboors
function cleandistricts(){
    for(i in districts){
        if(districts[i].nnighboors ===0){
            //delete from the map and data structure
            districts[i].poligs.forEach((pol)=>{
                pol.setMap(null)
                delete districts[i]
            });
        }
    }
}


//-------------------------------------------utils------------------------------------
function progressbar(value,text){
    pcharge.text(text);
    chargebar.css("width",value);
}


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


//---------------------------------------start function----------------------------------

$(document).ready(async () => {
    progressbar("0%","Charging poligons...")
    await getGeoData(linkpoligons);
    progressbar("25%","drawing poligons...")
    await drawPolygons();
    progressbar("50%","getting nightboors...")
    getNightboors(linknighthoods);
    console.log("wiii")
    
});
