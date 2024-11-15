function initialize() {
    // alert("hello"); //Debug
    //hide Tip on Startup.
    document.getElementById("tip").style.display = "none";
    document.getElementById("each").style.display = "none";
    
    //setup calculate tip code.
    document.getElementById("calculate").onclick = function() {calculateTip();};
}

function calculateTip() {
    //alert("Button Clicked."); //Debug
    //"importing" variables from tipCalc.html.
    var subtotal = document.getElementById("subtotal").value;
    var percent = document.getElementById("service").value;
    var group    = document.getElementById("group").value;
    
    //validate input.
    if (subtotal === "")
        {
            alert("Please Enter a Price!");
            return;
        }
    
    //validate service.
    if (percent === -1)
        {
            alert("Please Enter your Satisfction!");
            return;
        }
    
    //confirm size>=1.
    if (group === "" || group <= 1)
        {
            group = 1;
            document.getElementById("each").style.display = "none";
        }
    else 
        {
            document.getElementById("each").style.display = "block";
        }
    
    //calculating tip.
    
    //alert(subtotal); //Debug
    //alert(percent); //Debug
    //alert(group); //Debug
    var pretotal = subtotal * percent;
    var finalTip = pretotal / group;
    
    //round to 2 decimal places & always show decimals.
    finalTip = Math.round(finalTip * 100) / 100;
    finalTip = finalTip.toFixed(2);
    
    document.getElementById("tip").style.display = "block";
    document.getElementById("value").innerHTML = finalTip;
}