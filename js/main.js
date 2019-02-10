const linkpoligons = "https://services5.arcgis.com/GfwWNkhOj9bNBqoJ/arcgis/rest/services/nycd/FeatureServer/0/query?where=1=1&outFields=*&outSR=4326&f=geojson"
const nottoshow = [58,29,65,64,20,66,67,9,39,14]
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

var poligons
function getDatageo(url){
	let datafull;
	let data = $.get(url,()=>{})
		.done(() => {
		    poligons = JSON.parse(data.responseText).features;
		});
	return new Promise(resolve => {
        setTimeout(()=>{
            resolve("yessd");
        },1000);
	});
}