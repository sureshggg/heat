
var bgPage=chrome.extension.getBackgroundPage() ;

var matchedTicketsMap= bgPage.heatSession.getMatchedTickets() ;
var lastUpdatedAt= bgPage.heatSession.getLastUpdatedAt() ;

$(document).ready(function() {
  var header="";
  header = "<thead>" ;
  header += "<th class='small'>Ticket</th>" ;
  header += "<th class='small'> Site</th>" ;
  header += "<th >Desc</th>" ;
  header += "<th class='small'> With</th>" ;
  header += "<th class='small'>Resolution Expected</th>" ;
  header += "</thead>" ;

  if( matchedTicketsMap["count"] > 0)
    $("#containerTable").prepend(header) ;

  var toggle=1;
  $.each(matchedTicketsMap, function(ticketWith, tickets){
      toggle = toggle == 1 ? 0 : 1 ;
      $.each(tickets,function(index, ticket){
        var ticketStr="";
        ticketStr = "<tr class=\"row"+ toggle +"\">" ;
        ticketStr += "<td>" + ticket.id + "</td>" ;
        ticketStr += "<td>" + ticket.site + "</td>" ;
        ticketStr += "<td>" + ticket.desc+ "</td>" ;
        ticketStr += "<td>" + ticket.with + "</td>" ;
        ticketStr += "<td>" + ticket.resolution_at + "</td>" ;
        ticketStr += "</tr>" ;
        $('#containerTable').append(ticketStr) ;
      }) ;
  }) ;

  if(lastUpdatedAt) 
    $("#lastUpdatedAt").html("Last Updated: " + lastUpdatedAt.toLocaleString()) ;

  $("#refresh").on('click', function(){
    bgPage.heatSession.openCallGroups() ;
  }) ;
} ) ;

chrome.runtime.onMessage.addListener(function(request, sender, response){
  if(request.message) 
    $("#message").html(request.message) ;

  if(request.reload)
    window.location.reload() ;
});
