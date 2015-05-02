var heatSession = new HeatSession() ;

chrome.storage.sync.get(["heatUserID", "heatPassword", "ticketRegEx"],function(items){
  heatSession.setUser(items.heatUserID, items.heatPassword) ;
  heatSession.setTicketRegExp(items.ticketRegEx)
}) ;

chrome.alarms.create("update_tickets", {
  periodInMinutes: 30,
  delayInMinutes: 1 
}) ;

chrome.alarms.onAlarm.addListener(function(alarm){
  heatSession.openCallGroups() ;
}) ;
