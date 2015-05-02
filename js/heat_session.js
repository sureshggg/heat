function HeatSession(){
  this.HEAT_URL="http://10.113.49.144:8180" ;
  this.POST_URI="/HeatWebUI/JSON-RPC/" ;
  this.REQUEST_URL= this.HEAT_URL + this.POST_URI ;

  this.heatUserID="" ;
  this.heatPassword="" ;
  this.ticketRegEx=""  ;

  this.heatTickets= [];
  this.heatTicketmap = {};
  this.matchedTicketsMap={};

  this.runID=1;
  this.workspaceId;
  this.controllerObjectID;
  this.cursorObjectID;
  this.totalTicketCount;
  this.lastUpdatedAt ; 
} ;

HeatSession.prototype = {

  setUser: function(heatUserID, heatPassword){
    this.heatUserID=heatUserID ;
    this.heatPassword=heatPassword ;
  },

  setTicketRegExp: function(regExp){
    this.ticketRegEx=regExp ;
  },

  getMatchedTickets: function(){
    return this.matchedTicketsMap ;
  },

  getLastUpdatedAt: function(){
    return this.lastUpdatedAt ;
  },

  login: function(){
    var request = $.ajax({
        context: this,
        url: this.REQUEST_URL, 
        method: 'POST',
        contentType : 'application/json',
        headers: {
          "X-RequestId" : 1,
        },
        data: JSON.stringify({
          "params": [this.heatUserID, this.heatPassword,null,true,false], 
        "id":1, 
        "method":"callLoggingLoginHandler.login"
      })
    }) ;

    request.done(function(data) {
      if(data["result"]["message"] != "OK")
      {
        chrome.runtime.sendMessage({ message: data["result"]["message"] }) ;
        return ;
      }
      this.workspaceId = data["result"]["workspace"]["objectID"] ;
      this.runID = 2;
      this.openCallGroups() ;
    }) ;

    chrome.runtime.sendMessage({ message: 'Logging in...' }) ;
  } ,

  openCallGroups : function(){
    if(! this.workspaceId)
    {
      this.login() ;
      return ;
    }

    var request = $.ajax({
        context: this,
        url: this.REQUEST_URL, 
        method: 'POST',
        contentType : 'application/json',
        headers: {
         "X-RequestId" : this.runID,
        },
        data: JSON.stringify({
          "params": ["My Active Calls","G","Global"], 
          "id": this.runID, 
          "method": ".obj[" + this.workspaceId +"].openCallGroup"
        })
    }) ;

    request.done(function(data) {
        if(data["error"])
          this.login() ;

        this.controllerObjectID = data["result"]["controller"]["objectID"] ;
        this.cursorObjectID =data["result"]["cursor"]["objectID"]  
        this.refreshController() ;
    }) ;

    request.fail(function(){
      this.login() ;
    }) ;

    chrome.runtime.sendMessage({ message: 'Loading Tickets...' }) ;
    this.runID++ ;
  },

  refreshController : function(){
    var request = $.ajax({
        context: this,
        url: this.REQUEST_URL, 
        method: 'POST',
        contentType : 'application/json',
        headers: {
         "X-RequestId" : this.runID,
        },
        data: JSON.stringify({
          "params" : [], 
          "id" : this.runID, 
          "method": ".obj[" + this.controllerObjectID +"].refresh"
        })
    }) ;

    request.done(function(data){
      this.getTicketsSize() ;
    }) ;

    this.runID++ ;
  },

  getTicketsSize: function(){
    var request = $.ajax({
        context: this,
        url: this.REQUEST_URL, 
        method: 'POST',
        contentType : 'application/json',
        headers: {
         "X-RequestId" : this.runID,
        },
        data: JSON.stringify({
          "params" : [], 
          "id" : this.runID, 
          "method": ".obj[" + this.cursorObjectID +"].tell"
        })
    }) ;
    request.done(function(data) {
      this.totalTicketCount = data["result"]["size"] ;
      this.moveToFirstTicket() ;
    }) ;

    this.runID++ ;
  },

  moveToFirstTicket: function(){
    var request = $.ajax({
        context: this,
        url: this.REQUEST_URL, 
        method: 'POST',
        contentType : 'application/json',
        headers: {
         "X-RequestId" : this.runID,
        },
        data: JSON.stringify({
          "params" : [0], 
          "id" : this.runID, 
          "method": ".obj[" + this.cursorObjectID +"].move"
        })
    }) ;

    request.done(function(data){
      this.getTickets() ;
    }) ;
    this.runID++ ;
  } ,
  
  getTickets: function(){
    var request = $.ajax({
        context: this,
        url: this.REQUEST_URL, 
        method: 'POST',
        contentType : 'application/json',
        headers: {
          "X-RequestId" : this.runID,
        },
        data: JSON.stringify({
          "params" : [0,this.totalTicketCount], 
        "id" : this.runID, 
        "method": ".obj[" + this.cursorObjectID +"].getGridData"
        })
    }) ;
    request.done(function(data) {
      var heatTickets=[] ;
      var heatTicketmap={} ;

      $.each(data["result"]["data"],function(index, ticket){
        var oTicket = {
          "site" : ticket[1],
          "id" : ticket[2],
          "priority": ticket[3],
          "status": ticket[4],
          "with": ticket[5],
          "desc" : ticket[6],
          "created_at": ticket[7],
          "resolution_at": ticket[8]
        } ;

        heatTickets.push(oTicket) ;

        if( heatTicketmap[oTicket["with"]] == null)
          heatTicketmap[oTicket["with"]] = [oTicket] ;
        else
          heatTicketmap[oTicket["with"]].push(oTicket) ;
      });

      this.heatTickets = heatTickets; 
      this.heatTicketmap = heatTicketmap ;

      var matchedTicketsMap={};
      var matchedCount=0;
      var localRegExp;

      try{
        localRegExp=RegExp(this.ticketRegEx) ;
      }
      catch(e){
        localRegExp=RegExp("") ;
        chrome.runtime.sendMessage({ message: 'Invalid Regular Expression!' }) ;
      }

      $.each(heatTicketmap, function(ticketWith, tickets){
        if(ticketWith.match(localRegExp))
        {
          matchedTicketsMap[ticketWith]=tickets ;
          matchedCount +=  tickets.length ;
        }
      }) ;

      this.lastUpdatedAt = new Date() ;
      this.matchedTicketsMap = matchedTicketsMap ;
      this.matchedTicketsMap["count"]  = matchedCount ;
      chrome.browserAction.setBadgeText({ text: String(matchedCount) }) ;
      chrome.runtime.sendMessage({ message: 'Loaded...', reload: true }) ;
    }) ;
    this.runID++ ;
  }

};
