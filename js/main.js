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
let table = $("#tablebody")
let $holetable =$(".table")
let youcan = false
let csvbutton = $("#savecsv")


//-------------------------------map global variables-------------------
var map;
var mappoligons = [];
var mapmarkers = [];
var colors = [ "#BD93FF", "#9954FF","#0097B2", "#FFE282", "#FFD546","#FFCE1A",  "#D1FFEB", "#7AFFBD","#1DFF93"];
var discolors = ["#6900FF","#FF7400"];
var riskcolors = ["#FFE300","#3000FF"];
var affcolors =["#51FF00","#FF00F3"]
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
                        type,
                        points:0, 
                        dpoints :0,
                        apoints :0,
                        rpoints:0
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
                yieldingLoop(riskdata.length,10,(i)=>{
                    //get the coords of the crime 
                    let coords = riskdata[i]["lat_lon"]["coordinates"]
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
                })
                    
                //ready and go back
                console.log("risk ready");
                youcan = true;
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
                let sum,avg;
                yieldingLoop(affdata.length,20,(i) =>{
                    if(affdata[i][23] != null){
                        const jsoncoods = {"lat":parseFloat(affdata[i][23]),"lng":parseFloat(affdata[i][24])};
                        //calculate the ponderate average
                        const total= affdata[i][31]+affdata[i][32]+affdata[i][33]+affdata[i][34]+affdata[i][35];
                        const prom = (6*affdata[i][31] + 5*affdata[i][31]+4*affdata[i][32]+3*affdata[i][33]+2*affdata[i][34]+affdata[i][35])/total;
                        //add the prom to the data structure
                        //console.log(prom)
                        for(j in districts){
                            districts[j]["poligs"].forEach((e)=>{
                                if(isinPolygon(jsoncoods,e)){
                                    //saved on the district
                                    districts[j].promaff.push(prom);
                                    let arr = districts[j].promaff
                                        sum = arr.reduce(function(a, b) { return a + b; });
                                        avg = sum / arr.length;
                                        districts[j].promaffn = avg
                                }
                            });
                        }
                    }   
                },()=>{
                    alert("enjoy the full experience")
                    calculateProms();   
                    console.log("finish");
                });                    
                //calculateProms();
                resolve("ready")
            });
    })
}


function calculateProms(){
    for(j in districts){
        let arr = districts[j].promaff
        if(arr.length){
            sum = arr.reduce(function(a, b) { 
                if(!isNaN(a) && !isNaN(b)){
                    return a + b; 
                }else{
                    return 0
                }
            });
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
        drawDistance(dis)
    }else if(parseInt(risk) ===0 && parseInt(aff) ===0 && parseInt(dis) === 0){
        defaultdraw();
    }else{
        drawAll()
    }
})
//draw the distance 
function drawDistance(value){
    for(i in districts){
        let pol = districts[i].poligs;
        let d = districts[i].distance;
        let inten=0;
        let color;
        if(value ===1){
            inten =  1 - (d * 3);
            color = discolors[0];
        }else{
            color = discolors[1];
            inten = (d*3)
        }
        pol.forEach((poligon) => {
            poligon.setOptions({
                strokeColor: "white",
                strokeOpacity: 0.8,
                strokeWeight: 1,
                fillColor: color,
                fillOpacity: inten
            });
        });
    }
    if(youcan){calculatetable()}
}


//risk slider
riskslider.change((event) =>{
    //parse the value 
    risk = parseInt(event.target.value);
    //draw just risk
    if(parseInt(risk) !=0 && parseInt(aff) ===0 && parseInt(dis) === 0){
        drawRisk(risk)
    }else if(parseInt(risk) ===0 && parseInt(aff) ===0 && parseInt(dis) === 0){
        defaultdraw();
    }else{
        drawAll()
    }
});

//draw risks
function drawRisk(value){
    for(i in districts){
        //get the crimes by district
        let pol = districts[i].poligs;
        let d = districts[i].crimes;
        let inten =0;
        let color;
        if(value === 1){
            color = riskcolors[0];
            inten = 1 - (d/60)
        }else{
            color = riskcolors[1]
            inten = (d/60)
        }
        pol.forEach((poligon) => {
            poligon.setOptions({
                strokeColor: "white",
                strokeOpacity: 0.8,
                strokeWeight: 1,
                fillColor: color,
                fillOpacity: inten
            });
        });
    }
    if(youcan){calculatetable()}
}

//affort slider
affslider.change((event) =>{
    //parse the value 
    aff = parseInt(event.target.value);
    //draw just risk
    if(parseInt(risk) ===0 && parseInt(aff) !==0 && parseInt(dis) === 0){
        drawAff(aff)
    }else if(parseInt(risk) ===0 && parseInt(aff) ===0 && parseInt(dis) === 0){
        defaultdraw();
    }else{
        drawAll()
    }
});


//draw
function drawAff(value){
    for(i in districts){
        //get the crimes by district
        let pol = districts[i].poligs;
        let d = districts[i].promaffn;
        let color;
        let inten;
        if(value ===1){
            color = affcolors[0];
            inten = d/2;
        }else{
            color = affcolors[1];
            inten = 1-d/2;
        }
        pol.forEach((poligon) => {
            poligon.setOptions({
                strokeColor: "white",
                strokeOpacity: 0.8,
                strokeWeight: 1,
                fillColor: color,
                fillOpacity: inten
            });
        });
    }
    if(youcan){calculatetable()}
}   

//-----------------------------------STANDART DATA---------------------------------
function standartdis(data,type){
    if(type == "inverse"){
        return (data*3)
    }else{
        return (1 - (data * 3))
    }
}
function standartrisk(data,type){
    if(type == "inverse"){
        return (data/60)
    }else{
        return (1 - (data/60))
    }
}
function standartaff(data,type){
    if(type == "inverse"){
        return (data/2)
    }else{
        return (1 - (data/2))
    }
}

//----------------------------------table------------------------------------------

function calculatetable(){
    for(i in districts){
        let p=0;
        let ap=0,rp=0,dp=0;
        //risk
        if(risk ===1){
            rp = 1000*(standartrisk(districts[i].crimes,"normal"));
        }else if(risk ===-1){
            rp = 1000*(standartrisk(districts[i].crimes,"inverse"));
        }
        //distance 
        if(dis ===1){
            dp = 1000*(standartdis(districts[i].distance,"normal"));
        }else if(dis ===-1){
            dp = 1000*(standartrisk(districts[i].distance,"inverse"));
        }
        //affort
        if(aff ===1){
            ap = 1000*(standartrisk(districts[i].promaffn,"normal"));
        }else if(aff ===-1){
            ap = 1000*(standartrisk(districts[i].promaffn,"inverse"));
        }
        p = ap + rp + dp
        districts[i].points = p
        districts[i].dpoints =dp
        districts[i].apoints =ap
        districts[i].rpoints=rp
    }
    filltable();
}

function filltable(){
    var sortable = [];
        for (var distric in districts) {
            sortable.push([distric, districts[distric]["points"]]);
        }
    sortable.sort(function (a, b) {
        return a[1] - b[1];
    }).reverse();
    //console.log(sortable);
    table.html("")
    for(let o=1;o<11;o++){
        let dis = districts[sortable[o][0]]
        table.append(
            "<tr><th scope='row'>" + o + "</th> <td>District " + sortable[o][0] + "</td> " + "<td>" + dis["dpoints"] + "</td>"+"<td>" + dis["rpoints"] + "</td>"+ "<td>" + dis["apoints"] + "</td>"+"<td>" + dis["points"] + "</td>"+"</tr>"
        );
    }
    
}

function download_csv(csv, filename) {
    var csvFile;
    var downloadLink;

    // CSV FILE
    csvFile = new Blob([csv], {type: "text/csv"});

    // Download link
    downloadLink = document.createElement("a");

    // File name
    downloadLink.download = filename;

    // We have to create a link to the file
    downloadLink.href = window.URL.createObjectURL(csvFile);

    // Make sure that the link is not displayed
    downloadLink.style.display = "none";

    // Add the link to your DOM
    document.body.appendChild(downloadLink);

    // Lanzamos
    downloadLink.click();
}

function export_table_to_csv(html, filename) {
	var csv = [];
	var rows = document.querySelectorAll("table tr");
	
    for (var i = 0; i < rows.length; i++) {
		var row = [], cols = rows[i].querySelectorAll("td, th");
		
        for (var j = 0; j < cols.length; j++) 
            row.push(cols[j].innerText);
        
		csv.push(row.join(","));		
	}

    // Download CSV
    download_csv(csv.join("\n"), filename);
}

csvbutton.click(function () {
    var html = document.querySelector("table").outerHTML;
    export_table_to_csv(html, "table.csv");
});
//------------------------------- for all ---------------------------------------
function drawAll(){
    if(youcan){calculatetable()}
    for(i in districts){
        //get the crimes by district
        let pol = districts[i].poligs;
        let inten = districts[i].points/2808;
        pol.forEach((poligon) => {
            poligon.setOptions({
                strokeColor: "white",
                strokeOpacity: 0.8,
                strokeWeight: 1,
                fillColor: "#12A9FF",
                fillOpacity: inten
            });
        });
    }
}



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


function attachPolygonInfoWindow(polygon,name) {
    var infoWindow = new google.maps.InfoWindow();
    google.maps.event.addListener(polygon, 'mouseover', function (e) {
        infoWindow.setContent(name);
        var latLng = e.latLng;
        infoWindow.setPosition(latLng);
        infoWindow.open(map);
    });
    google.maps.event.addListener(polygon, 'mouseout', function (e) {
        infoWindow.close(map);
    });
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
    await getNightboors(linknighthoods);
    //calculate risk data and save it    
    progressbar("60%","Calculating risk data....")
    getRisk(linkrisk);
    progressbar("80%","Calculating affortable data....")
    getAffData(linkaff);
    progressbar("90%","Still calculating....")
    progressbar("99%","Ready")
    setTimeout(() => {
        progressbar("100%")
    }, 200);
});