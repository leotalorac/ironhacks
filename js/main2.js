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
let bar = $("#floatbar")
let riskslider = $("#riskslider")
let affslider =$("#afforslider")
let disslider =$("#distanceslider")




//-------------------------------map global variables-------------------
var map;
var mappoligons = [];
var mapmarkers = [];
var colors = [ "#BD93FF", "#9954FF","#6900FF", "#FFE282", "#FFD546","#FFCE1A",  "#D1FFEB", "#7AFFBD","#1DFF93"]
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
                // console.log(datajson)
                //convert to poligons
                datajson.forEach((element) => {
                    //the the coords to create a poligon
                    let type = element["geometry"]["type"]
                    let coords = getbounds(element["geometry"]["coordinates"],type);
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
                        distance:0,
                        promaff:[],
                        promaffn:0,
                        type
                    }
                })
                console.log("geoshapes saved")
                resolve("geo data saved")
            })
            
        }, 100);
    })

}
//get the coords for  the poligon
function getbounds(jsonelement,type) {
    //variables to save 
    let coordsarr = [];
    let jsoncoods = {};
    let subarr;
    //round the array of coords 
    jsonelement.forEach((arr) => {
        let arrfor=arr;
        if(type != "Polygon"){
            arrfor = arr[0]
        }
            subarr = []
            arrfor.forEach((coords) => {
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

async function getNightboors(url){
    return new Promise((resolve,reject)=>{
        setTimeout(() => {
            let data = $.get(url,()=>{
                console.log("neighbors gotten");
            })
            .done(()=>{
                let jsondata = JSON.parse(data.responseText).data
                let coords;
                console.log("start calculations")
                jsondata.forEach((element)=>{
                    //get the coords
                    coords = element[8].replace("(","").replace(")","").split(" ")
                    coords = {
                        "lat":parseFloat(coords[2]),
                        "lng":parseFloat(coords[1])
                    }
                    //log for districts without nightboors 
                    for(i in districts){
                        districts[i].poligs.forEach((pol)=>{
                            if(isinPolygon(coords,pol)){
                                //add the nightboors info
                                districts[i].nightboors.push(coords);
                                districts[i].nnighboors++;
                            }
                        })
                    }
                })
                //delete the districts without inportance
                cleandistricts();
                calculateDistances();
                console.log("done clear")
                resolve("ready")
            })
        }, 100);
    });
}
//func  tion to delete the districts without nightboors
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

function calculateDistances() {
    //calculate distances from the centers
    for (i in districts) {
        let sumlat = districts[i].center.lat - upos.lat;
        let sumlng = districts[i].center.lng - upos.lng;
        let distance = Math.sqrt((sumlat ** 2) + (sumlng ** 2))
        // add it to the object
        districts[i]["distance"] = distance
    }
}


//------------------------------------------risk------------------------------------
async function getRisk(url){
    return new Promise((resolve,reject)=>{
        setTimeout(() => {
            let data = $.get(url,()=>{
                console.log("Risk data down");
            })
            .done(()=>{
                //parse the data
                let riskdata = JSON.parse(data.responseText);
                riskdata.forEach((element) =>{
                    //get the coords of the crime 
                    let coords = element["lat_lon"]["coordinates"]
                    //create latlng object
                    let jsoncoods = {"lat":coords[1],"lng":coords[0]};
                    //add the crime to the data structure
                    for(j in districts){
                        districts[j]["poligs"].forEach((e)=>{
                            if(isinPolygon(jsoncoods,e)){
                                //saved on the district
                                districts[j].crimes++;
                            }
                        });
                    }
                });
                //ready and go back
                console.log("risk ready");
                resolve("ready");
            });
            
            
        },100);
    });
    
}

//----------------------------------------------- affordable -----------------------------------------------------
async function getAffData(url){
    return new Promise((resolve,reject) =>{
        let data = $.get(url,()=>{console.log("getting affort data")})
            .done(()=>{
                let affdata = JSON.parse(data.responseText);
                // console.log(affdata.meta.view.columns);
                affdata = affdata.data
                console.log("start")
                affdata.forEach((element)=>{
                    if(element[23] != null){
                        let jsoncoods = {"lat":parseFloat(element[23]),"lng":parseFloat(element[24])};
                        //calculate the ponderate average
                        let total= element[31]+element[32]+element[33]+element[34]+element[35];
                        let prom = (6*element[31] + 5*element[31]+4*element[32]+3*element[33]+2*element[34]+element[35])/total;
                        //add the prom to the data structure
                        //console.log(prom)
                        for(j in districts){
                            districts[j]["poligs"].forEach((e)=>{
                                if(isinPolygon(jsoncoods,e)){
                                    //saved on the district
                                    districts[j].promaff.push(prom);
                                }
                            });
                        }
                    }   
                })                    
                console.log("finish");
                calculateProms();
                resolve("ready")
            });
    })
}


function calculateProms(){
    for(j in districts){
        let arr = districts[j].promaff
        if(arr.length){
            sum = arr.reduce(function(a, b) { return a + b; });
            avg = sum / arr.length;
            districts[j].promaffn = avg
        }
    }
}






//--------------------------------------------------visualization data------------------------------------------

//----------------------------------------------------distance------------------------------------------------
//distance slider
disslider.change((event)=>{
    dis = parseInt(event.target.value);
    if(parseInt(risk)===0 && parseInt(aff) ===0 && parseInt(dis) != 0){
        drawDistance(colors[dis-1])
    }else{
        defaultdraw();
    }
})
//draw the distance 
function drawDistance(color){
    for(i in districts){
        let pol = districts[i].poligs;
        let d = districts[i].distance
        pol.forEach((poligon) => {
            poligon.setOptions({
                strokeColor: "white",
                strokeOpacity: 0.8,
                strokeWeight: 1,
                fillColor: color,
                fillOpacity: 1 - (d * 3)
            });
        });
    }
}


//risk slider
riskslider.change((event) =>{
    //parse the value 
    risk = parseInt(event.target.value);
    //draw just risk
    if(parseInt(risk) !=0 && parseInt(aff) ===0 && parseInt(dis) === 0){
        drawRisk(colors[2+parseInt(event.target.value)])
    }else{
        defaultdraw();
    }
});

//draw risks
function drawRisk(color){
    for(i in districts){
        //get the crimes by district
        let pol = districts[i].poligs;
        let d = districts[i].crimes;
        pol.forEach((poligon) => {
            poligon.setOptions({
                strokeColor: "white",
                strokeOpacity: 0.8,
                strokeWeight: 1,
                fillColor: color,
                fillOpacity: 1 - (d/60)
            });
        });
    }
}

//affort slider
affslider.change((event) =>{
    //parse the value 
    aff = parseInt(event.target.value);
    //draw just risk
    if(parseInt(risk) ===0 && parseInt(aff) !==0 && parseInt(dis) === 0){
        drawAff(colors[5+parseInt(event.target.value)])
    }else{
        defaultdraw();
    }
});


//draw
function drawAff(color){
    for(i in districts){
        //get the crimes by district
        let pol = districts[i].poligs;
        let d = districts[i].promaffn;
        pol.forEach((poligon) => {
            poligon.setOptions({
                strokeColor: "white",
                strokeOpacity: 0.8,
                strokeWeight: 1,
                fillColor: color,
                fillOpacity: d/2
            });
        });
    }
}   





//------------------------------- for all ---------------------------------------
//back to normal
function defaultdraw(){
    for(i in districts){
        let pol = districts[i].poligs;        
        pol.forEach((poligon) => {
            poligon.setOptions({
                strokeColor: "#C29CFF",
                strokeOpacity: 0.8,
                strokeWeight: 1,
                fillColor: "#C29CFF",
                fillOpacity: 0.35
            });
        });
    }
}

//-------------------------------------------utils------------------------------------
function progressbar(value,text){
    pcharge.text(text);
    chargebar.css("width",value);
    if(value === "100%"){
        bar.remove();
    }
}


//taken from https://stackoverflow.com/questions/26615966/how-to-make-non-blocking-javascript-code
//processing on blocks
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
    //get and shave the poligons 
    progressbar("0%","Charging poligons...")
    await getGeoData(linkpoligons);
    progressbar("20%","Drawing poligons...")
    //show the poligons 
    await drawPolygons();
    progressbar("40%","Getting nightboors and calculating distances...")
    //see the district withouth nighthoods
    //await getNightboors(linknighthoods);
    //calculate risk data and save it    
    progressbar("60%","Calculating risk data....")
    
    //await getRisk(linkrisk);
    progressbar("80%","Calculating affortable data....")
    //await getAffData(linkaff);
    progressbar("90%","Still calculating....")
    progressbar("99%","Ready")
    setTimeout(() => {
        progressbar("100%")
    }, 200);
});
