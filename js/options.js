var bgPage=chrome.extension.getBackgroundPage() ;

$(document).ready(function(){

  chrome.storage.sync.get(["heatUserID", "heatPassword", "ticketRegEx"], function(items){
    $("#heatUserID").val(items.heatUserID || "") ;
    $("#heatPassword").val(items.heatPassword ||"") ;
    $("#ticketRegEx").val(items.ticketRegEx || "3rd|Third") ;
  }) ;

  $("#save").on("click", function(){
    var heatUserID = $("#heatUserID").val() ; 
    var heatPassword = $("#heatPassword").val() ;
    var ticketRegEx = $("#ticketRegEx").val() ;

    bgPage.heatSession.setUser(heatUserID, heatPassword) ;
    bgPage.heatSession.setTicketRegExp(ticketRegEx) ;

    chrome.storage.sync.set({
        heatUserID: heatUserID,
        heatPassword: heatPassword,
        ticketRegEx: ticketRegEx 
      }, function(){
      $("#message").html("Updated!").show().delay(5000).hide(1) ;
    });

  }) ;
}) ;
