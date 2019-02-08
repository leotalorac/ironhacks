/*
    Feel free to put your custom js here.
  */
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