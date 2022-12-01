//serverG
//20200926
//20201015 replaced websockets library with ws but it was disconnecting; reverted to websockets old library
//20201128 creating DB subscriber via "reCreateSubscriber" function, which can be re-called if DB connection is lost
"use strict";
console.log('hrlive started');
process.title = 'hrlive';
//const axios = require('axios');
var EthCrypto = require('eth-crypto');
var http 		= require('http');
var urlParser 	= require('url');
//var request 	= require('request');
var axios 		= require('axios');
var cheerio 	= require('cheerio');
var webSocketServer = require('websocket').server; //https://github.com/theturtle32/WebSocket-Node
//const WebSocket = require('ws'); //https://github.com/websockets/ws
//const urlMetadata = require('url-metadata');
//const { Pool, Client } = require('pg'); //https://node-postgres.com/
const {Pool} = require('pg'); //https://node-postgres.com/
//const uuidv1 = require('uuid/v1');
const { v1: uuidv1 } = require('uuid');
const createSubscriber = require ('pg-listen');//https://github.com/andywer/pg-listen
//var gicon = require("gicon");
const connectionProperties = {  
  user: 'homred',
  host: 'master.homred.service.consul',
  database: 'hr',
  password: 'Bristol406',
  port: 5432
}
const connectionPropertiesListen = {
  user: 'homred',
  host: 'master.homred.service.consul',
  database: 'hr',
  password: 'Bristol406',
  port: 5432,
  keepAlive: true
}
const connectionPropertiesRead = {  
  user: 'homred',
  host: 'homred.service.consul',
  database: 'hr',
  password: 'Bristol406',
  port: 5432
}
const os = require('os');//https://gist.github.com/pulkitsinghal/c1b40aa9acb2881505f26eb6992fb794
const nodeInstance = os.hostname();//8010;//process.argv[2]; //port serves as the nodeInstance id
console.log('container id:'+ nodeInstance );

const pool = new Pool(connectionProperties);
console.log('pool created');
pool.on('error', (err) => console.error('database pool error: '+e.stack));//https://github.com/brianc/node-postgres/issues/1324
var client = null;// = new Client(connectionProperties);//this is only for LISTEN session

const poolRead = new Pool(connectionPropertiesRead);
console.log('poolRead created');
poolRead.on('error', (err) => console.error('database poolRead error: '+e.stack));//https://github.com/brianc/node-postgres/issues/1324
var clientRead = null;// = new Client(connectionProperties);//this is only for LISTEN session

const vMaxNumberOfReconnects = 10;
var vReconnectAttempts = 0;
const vReconnectDelay = 5000; //5 secs
var vAttemptingReconnect = false;
//listenPg();

var subscriber = null,
subscriberCreateWaitTime = 1000, //default 1 sec
subscriberCreateAttempts = 0,
maxSubscriberCreateAttempts = 100,//
subscriberCreateWaitTimeAfterMaxAttempts = 600000;//after maxSubscriberCreateAttempts the wait time increases to 10mins
reCreateSubscriber();

//HTTP server to accept websockets requests
var httpServer = http.createServer(function(req, res){
    try {
	  req.setEncoding('utf8');
	  //res.writeHead(200,{'Content-Type':'application/json'});//20200113	  
      res.writeHead(404);//20200113
      res.end();//20200113
	  //var country_code = headers['cf-ipcountry'];//https://support.cloudflare.com/hc/en-us/articles/200168236-Configuring-Cloudflare-IP-Geolocation
	  //console.log('country_code: '+country_code);//not working here
	  /*console.log('trying to get cookies');
	  var cookies = req.headers.cookie;
	  //var cookie = req.getHeader('Cookie');
	  console.log('got cookie (from within httpServer module): '+cookies);
	  if(!cookies || cookie == ''){
		  console.log('no cookies yet');
		  var cName = 'session';
		  var cVal = 'test1';
		  var cExp = new Date;
		  cExp.setDate(cExp.getDate()+1);
		  var cFull = cName+'='+cVal+';expires='+cExp.toUTCString()+';';
		  //res.setHeader('Set-Cookie', ['type=_oxcw', 'sxw='+'test_cookie'])
		  console.log('setting cookie: '+cFull);
		  res.setHeader('Set-Cookie', cFull);
		  res.writeHead(302,{'Location': '/'});
		  return res.end();	  
	  };
	  console.log('getting cookie after setting it');
	  cookies.split(';').forEach(function(cookie) {
		  var m = cookie.match(/(.*?)=(.*)$/);
		  console.log('getting cookie: '+m[1]);
		  cookies[m[1].trim()] = (m[2] || '').trim();
	  });
	  res.end("Cookie set: "+cookies.toString());*/
    }
    catch(e){
	  var vErr = 'httpServer error: '+JSON.stringify(e);
	  res.end(vErr);
	  console.error(vErr);
	}  
}).listen(8010);

var wsServer = new webSocketServer({// http://tools.ietf.org/html/rfc6455#page-6
	httpServer: httpServer,
	autoAcceptConnections: false //20200113
});
//const wss = new WebSocket.Server({server: httpServer});

var clients = {};

/*wss.on('connection', function connection(ws) {//https://stackoverflow.com/questions/58651858/how-to-read-headers-from-a-websocket-connection
	var vClientSession = uuidv1();
    var vEndpointId = null;
	pool.query('/*NO LOAD BALANCE*/ /*select create_endpoint($1::text,$2::smallint,$3::text)',[vClientSession,1,nodeInstance])//must ensure that node instance is updated for user session in the database
	  .then(resp => {
		vEndpointId = resp.rows[0].create_endpoint;
		clients[vEndpointId] = ws;
	  })
	  .catch(e => {console.log('pool query returned error:'+e.stack);});	
	
    ws.on('message', function incoming(message){
		console.log('received: %s', message);
	    callDB(vEndpointId,ws,message);	  
    });

	ws.on('close', function close() {
		console.log('ws disconnected');
		delete clients[vEndpointId];
		pool.query('/*NO LOAD BALANCE*/ /*select delete_notif_client($1,$2,$3)',[vEndpointId,1,0])//1=live notif endpoint, 0=all notifs for given session
		  .catch(e => {console.log('database delete_notif_client returned pool query error:'+e.stack);});	  
	});  
});*/
///////////////////////////////////////////////////////////////////////////
//domain reputation checking
const vAPIkey = 'at_O2oHIbngEYAVtc5sYf1x8vW9hmxG1',//https://user.whoisxmlapi.com/products/20/subscriptions/active
vMinDomainReputaionScore = 80,
vMaxDomainReputationCheckValidTime = 31536000000; //365 days (in millisecunds)
///////////////////////////////////////////////////////////////////////////

wsServer.on('request', function(req) {
	console.log('wsServer.on(request)');
	var connection = req.accept(null, req.origin);	
	var vClientSession = uuidv1();
	//https://stackoverflow.com/questions/27726003/how-can-i-get-the-headers-request-from-client-side-for-sockets-using-nodejs
	//https://github.com/theturtle32/WebSocket-Node/blob/master/docs/WebSocketRequest.md#properties
	
	
	var vCountryCode = req.httpRequest.headers['cf-ipcountry'];//https://support.cloudflare.com/hc/en-us/articles/200168236-Configuring-Cloudflare-IP-Geolocation 
	console.log('country_code: '+vCountryCode);	
	getCountry(vCountryCode,connection);
	
	pool.query('/*NO LOAD BALANCE*/ select create_endpoint($1::text,$2::smallint,$3::text)',[vClientSession,1,nodeInstance])//must ensure that node instance is updated for user session in the database
	  .then(resp => {
		var vEndpointId = resp.rows[0].create_endpoint;
		console.log('EndpointId: '+vEndpointId);
		clients[vEndpointId] = connection;
		//listenPg();//connecting dedicated client for LISTEN
		connection.on('message', function(message) {
			if (message.type === 'utf8') {callDB(vEndpointId,connection,message.utf8Data);}
		});
		connection.on('close', function(reasonCode, description) {
			console.log('EndpointId: '+vEndpointId+' close event');
			delete clients[vEndpointId];
			pool.query('/*NO LOAD BALANCE*/ select delete_notif($1,$2)',[vEndpointId,0])//0=all notifs for given session
			  .catch(e => {console.log('database delete notif returned pool query error:'+e.stack);});
			pool.query('/*NO LOAD BALANCE*/ select remove_expect($1,$2,$3)',[vEndpointId,'all',false])//all live expects for given session
			  .catch(e => {console.log('database remove expect returned pool query error:'+e.stack);});
		});
	  })
	  .catch(e => {console.log('pool query returned error:'+e.stack);});
});


function callDB(pEndpointId, connection, q){//parameters object received from browser
	var hrProcess,hrParam,hrProcess2,hrParam2,vTitle;
	try {
		console.log('q: '+q);
		console.log('pEndpointId: '+pEndpointId);
		q = JSON.parse(q);
		switch(q.em ? q.em.ap : q.ap) {			
		  case 1://create homred
			var vAddress = verifyTx(q.el,q.em);//address (q.bq) will be derived from signature			
			pool.query('/*NO LOAD BALANCE*/ select * from create_homred($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)',
					[pEndpointId,vAddress,q.em.b,q.em.c,q.em.d,q.em.e||null,q.em.au||null,q.em.at,q.em.bo,q.em.a,q.em.dc,q.em.du])
			  .then(resp => {connection.send(JSON.stringify([{ap:q.em.ap,cd:q.em.a,data:resp.rows}]));})
			  .catch(e => {console.log('database select * from create_homred returned pool query error:'+e.stack)});
			return;
			
		  case 21://MAP VIEW: view homreds and log notif
			if(!q.z && !q.cm){//simple query for date and place only
				hrProcess = 'select * from get_homreds_short($1,$2,$3,$4,$5,$6,$7)';
				hrParam = [q.bq,q.d,q.e,q.u,q.v,q.w,q.x];				
			}else if(q.z && !q.cm){//search string provided, but not channels
				hrProcess = 'select * from get_homreds_search($1,$2,$3,$4,$5,$6,$7,$8)';
				hrParam = [q.bq,q.d,q.e,q.u,q.v,q.w,q.x,(q.z).toUpperCase()];
			}else if(!q.z && q.cm){//channels provided but not search string
				hrProcess = 'select * from get_homreds_channels($1,$2,$3,$4,$5,$6,$7)';
				hrParam = [q.d,q.e,q.u,q.v,q.w,q.x,q.cm];
			}else{//all search parameters provided
				hrProcess = 'select * from get_homreds_full($1,$2,$3,$4,$5,$6,$7,$8)';
				hrParam = [q.d,q.e,q.u,q.v,q.w,q.x,q.cm,(q.z).toUpperCase()];
			}
			
		    /*var vSearch; //SLOWER
			if(q.z){vSearch = '%('+q.z.replace(/(\s)+/g,'|').toUpperCase()+')%'}//https://stackoverflow.com/questions/1981349/regex-to-replace-multiple-spaces-with-a-single-space
			console.log('get homreds search string to DB: '+vSearch);
			hrProcess = 'select * from get_homreds($1,$2,$3,$4,$5,$6,$7,$8)';
			hrParam = [q.d,q.e,q.u,q.v,q.w,q.x,q.cm,vSearch];*/
			
			poolRead.query(hrProcess,hrParam)
			  .then(resp => {
							connection.send(JSON.stringify([{ap:q.ap,data:resp.rows}]));
							//console.log('data:resp.rows: '+JSON.stringify([{ap:q.ap,data:resp.rows}]));
							})
			  .catch(e => {console.log('select * from get_homreds returned pool query error:'+e.stack);});		  
			pool.query('/*NO LOAD BALANCE*/ select * from create_notif($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)',[pEndpointId,q.at,2,q.u,q.v,q.w,q.x,q.z,q.cm,null,null,q.d,q.e])
			  //.then(resp => {connection.send(JSON.stringify([{ap:q.ap,data:resp.rows}]));})
			  .catch(e => {console.log('create notify called by process 21 (view homreds on map) returned error:'+e.stack);});
			return;
			
		  case 37://LIST VIEW: view homreds list (no map) and log notif
			poolRead.query('select * from get_homreds_list($1,$2,$3,$4)',[q.d,q.e,q.cm,q.z])
			  .then(resp => {connection.send(JSON.stringify([{ap:q.ap,data:resp.rows}]));})
			  .catch(e => {console.log('select * from get_homreds returned pool query error:'+e.stack);});		  
			pool.query('/*NO LOAD BALANCE*/ select * from create_notif($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)',[pEndpointId,q.at,2,null,null,null,null,q.z,q.cm,null,null,q.d,q.e])
			  //.then(resp => {connection.send(JSON.stringify([{ap:q.ap,data:resp.rows}]));})
			  .catch(e => {console.log('create notify called by process 37 (view homreds on list) returned error:'+e.stack);});
			return;

		  case 3://create push notif - the websockets vEndpointId cannot be used here, as this must be a new "push" endpoint, created in DB from push subscription (q.ab) and nodeInstance
		    if(q.a){//homred
				pool.query('/*NO LOAD BALANCE*/ select * from create_push_homred($1,$2,$3,$4,$5)',[q.ab,nodeInstance,q.at,q.bq,q.a])
				  //.then(resp => {connection.send(JSON.stringify([{ap:q.ap,bq:q.bq,a:q.a,ag:resp.rows[0].ag}]));})//process, member hash, homred id, push hash, switch on			
				  .catch(e => {console.log('database select * from create_push_homred returned pool query error:'+e.stack);});		
			}else{//channel
				pool.query('/*NO LOAD BALANCE*/ select * from create_push($1,$2,$3,$4)',[q.ab,nodeInstance,q.at,q.bq])
				  .then(resp => {connection.send(JSON.stringify([{ap:q.ap,bq:q.bq,a:q.a,ag:resp.rows[0].ag}]));})//process, member hash, homred id, push hash, switch on			
				  .catch(e => {console.log('database select * from create_push returned pool query error:'+e.stack);});							
			}
			return;
			
		  case 11://get homreds details
			poolRead.query('select * from get_homred_details($1,$2)',[q.a,q.t])//20210413 added zoom parameter for sharing homred 
			  .then(resp => {connection.send(JSON.stringify([{ap:q.ap,data:resp.rows}]));})
			  .catch(e => {console.log('select * from get_homred_details returned pool query error:'+e.stack);});		  
			return;	

		  case 23://remove homred notif
			hrProcess = '/*NO LOAD BALANCE*/ select delete_notif($1,$2)';
			hrParam = [pEndpointId,3];//3=homred view notif
			break;
			
	///////////////CHANNELS				
		  case 33://create_channel
			//if(q.au && q.au !== ''){//20200925 getting URL meta, if given
			//	getMeta(q.au)
			//		.then((vMeta) => {
			//			pool.query('/*NO LOAD BALANCE*/ select * from create_channel($1,$2,$3,$4,$5,$6)',[pEndpointId,q.bi,q.ci,vMeta[0],vMeta[1],vMeta[2]])//2200925 added url,title,favicon
			//			  .then(resp => {connection.send(JSON.stringify([{ap:q.ap,data:resp.rows,ce:true,au:vMeta[0],s:vMeta[1],db:vMeta[2]}]));})
			//			  .catch(e => {console.log('select * from create_channel returned pool query error:'+e.stack);});	
			//		})
			//		.catch(e => {
			//			pool.query('/*NO LOAD BALANCE*/ select * from create_channel($1,$2,$3,$4,$5,$6)',[pEndpointId,q.bi,q.ci,null,null,null])//2200925 added url,title,favicon
			//			  .then(resp => {connection.send(JSON.stringify([{ap:q.ap,data:resp.rows,ce:true,s:null,db:null}]));})
			//			  .catch(e => {console.log('select * from create_channel returned pool query error:'+e.stack);});				
			//		});
			//}else{
				pool.query('/*NO LOAD BALANCE*/ select * from create_channel($1,$2,$3,$4,$5,$6,$7,$8)',[pEndpointId,q.en,q.bq,q.ej,q.bi,q.ci,q.au,q.db])//2200925 added url,title,favicon
				  .then(resp => {connection.send(JSON.stringify([{ap:q.ap,data:resp.rows,ei:q.ei/*,ce:true,s:null,db:null*/}]));})
				  .catch(e => {console.log('select * from create_channel returned pool query error:'+e.stack);});			
			//}
			return;			
	
		  case 31://get channels
			poolRead.query('select * from get_channels($1,$2,$3)',[q.be,q.cf,q.db])//20210517 added parameter for emoji as favicon provided within channel name
			  .then(resp => {connection.send(JSON.stringify([{ap:q.ap,data:resp.rows}]));})
			  .catch(e => {console.log('select * from get_channels returned pool query error:'+e.stack);});		
			return;

		  case 43://get tags
			poolRead.query('select * from get_tags($1,$2)',[q.be,q.ci])
			  .then(resp => {connection.send(JSON.stringify([{ap:q.ap,data:resp.rows}]));})
			  .catch(e => {console.log('select * from get_tags returned pool query error:'+e.stack);});		
			return;

		  case 42://create member for found channel and explicitly followed it (not viewed a homred for this channel without following it 
				  //(for which process 60 "create_notif" is triggered by process 11 "get_homred_details" is used)  
			pool.query('/*NO LOAD BALANCE*/ select * from create_member($1,$2,$3,$4)',[pEndpointId,q.n,q.bq,q.ej])
			  .then(resp => {connection.send(JSON.stringify([{ap:q.ap,data:resp.rows,dh:true,ei:q.ei}]));})
			  .catch(e => {console.log('select * from create_member returned pool query error:'+e.stack);});	
			return;

		  case 55://create member for channel from invite
			pool.query('/*NO LOAD BALANCE*/ select * from create_member_invite($1,$2,$3,$4)',[pEndpointId,q.n,q.bq,q.ej])
			  .then(resp => {connection.send(JSON.stringify([{ap:q.ap,data:resp.rows,ei:q.ei}]));})
			  .catch(e => {console.log('select * from create_member_invite returned pool query error:'+e.stack);});	
			return;
			
		  case 7://delete homred
			pool.query('/*NO LOAD BALANCE*/ select delete_homred($1,$2,$3,$4)',[pEndpointId,q.a,q.bq,null])
			  .catch(e => {console.log('select delete_homred returned pool query error:'+e.stack);});	
			return;
			
		  case 40://CHANNEL VIEW: update stats for group or channel (number of members and homreds published)
			poolRead.query('select * from get_channel_stats($1)',[q.bq])
			  .then(resp => {connection.send(JSON.stringify([{ap:q.ap,data:resp.rows,bq:q.bq}]));})
			  .catch(e => {console.log('select get_channel_stats returned pool query error:'+e.stack);});		  
			pool.query('/*NO LOAD BALANCE*/ select * from create_notif($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)',[pEndpointId,q.at,1,null,null,null,null,null,q.bq,null,null,null,null])
			  //.then(resp => {connection.send(JSON.stringify([{ap:q.ap,data:resp.rows}]));})
			  .catch(e => {console.log('create notify called by process 40 (update stats for channel) returned error:'+e.stack);});	
			return;
			
		  case 12://create reaction (going, maybe, not going, log open URI) for homred (response is via notify_homred_reaction, process 12)
			pool.query('/*NO LOAD BALANCE*/ select * from log_action($1,$2,$3,$4)',[q.as,q.a,pEndpointId,q.bq])//action, homred_id, member_hash
			  .catch(e => {console.log('select log_action returned pool query error:'+e.stack);});		
			return;	
					
		  //case 44://create times for homred (response is via notify_homred_time, process 44)
			//pool.query('/*NO LOAD BALANCE*/ select * from create_time($1,$2,$3,$4,$5)',[q.a,q.d,q.e,q.bq,q.br])//homred_id, from, to, member_hash, creator_hash
			  //.catch(e => {console.log('select create_time returned pool query error:'+e.stack);});	
			//return;	

		  /*case 46://check members: confirm channels and members still exist
			poolRead.query('select * from check_members_connections($1)',[q.bq])
			  .then(resp => {connection.send(JSON.stringify([{ap:q.ap,data:resp.rows}]));})
			  .catch(e => {console.log('select check members connections returned pool query error:'+e.stack);});
			return;*/
		  case 46://check members: confirm members still exist
			poolRead.query('select * from check_members($1)',[q.cm])
			  .then(resp => {connection.send(JSON.stringify([{ap:q.ap,data:resp.rows}]));})
			  .catch(e => {console.log('select check members returned pool query error:'+e.stack);});
			return;		

		  case 59://20210401: confirm address (membership) exists (similar to 46)
			poolRead.query('select * from check_address($1)',[q.bq])
			  .then(resp => {connection.send(JSON.stringify([{ap:q.ap,ei:q.ei,data:resp.rows}]));})
			  .catch(e => {
				  connection.send(JSON.stringify([{ap:q.ap,data:null}]));
				  console.log('select check address returned pool query error:'+e.stack);
				});
			return;
			
		  case 56://follow channel for which member already created via viewing channel's homred - uses check members function as return
			pool.query('/*NO LOAD BALANCE*/ select * from follow_member($1)',[q.bq])
			  .then(resp => {connection.send(JSON.stringify([{ap:q.ap,data:resp.rows}]));})
			  .catch(e => {console.log('select follow member returned pool query error:'+e.stack);});		  
			return;		
					
		  case 47://update_location
			pool.query('/*NO LOAD BALANCE*/ select * from update_location($1,$2,$3,$4,$5,$6)',[pEndpointId,q.a,q.b,q.c,q.bo,q.bp])
			  .catch(e => {console.log('select update_location returned pool query error:'+e.stack);});	
			return;		
					
		  case 48://log
			pool.query('/*NO LOAD BALANCE*/ select * from pr_err($1,$2,$3,$4)',[null,null,q.cz,pEndpointId])
			  .catch(e => {console.log('select pr_err returned pool query error:'+e.stack);});	
			return;	
					
		  //case 50://reactivate member
			//pool.query('/*NO LOAD BALANCE*/ select * from reactivate_member($1)',[q.bq])
			  //.catch(e => {console.log('select reactivate_member returned pool query error:'+e.stack);});	
			//return;			
					
		  case 51://send feedback
			pool.query('/*NO LOAD BALANCE*/ select * from create_feedback($1)',[q.da])
			  .catch(e => {console.log('select create_feedback returned pool query error:'+e.stack);});	
			return;	
			
		  case 52://manage channel status (hide, show, delete) 
			pool.query('/*NO LOAD BALANCE*/ select * from manage_channel_status($1,$2,$3)',[pEndpointId,q.bq,q.dp])
			  .catch(e => {console.log('select * from manage_channel_status returned pool query error:'+e.stack);});	
			return;		
			
		  case 53://get or refresh metadata from URL (title and favicon) 
			var vUrl,vUrlobj,vHost,vProtocol;
			if(q.au.substring(0,4) !== "http"){vUrl='https://'+q.au}//also checked on client side
			else{vUrl=q.au}			  
		    vUrlobj = urlParser.parse(vUrl);
			vHost = vUrlobj.host;
			vProtocol = vUrlobj.protocol;
			pool.query('select * from get_uri($1,$2)',[vHost,vUrl])
			  .then(resp => {
				  if(resp.rows[0] //domain checked before
					&& new Date() - new Date(resp.rows[0].ef) < vMaxDomainReputationCheckValidTime)// and domain reputation checked within set time period, no need re-check
					{
					  if(resp.rows[0].ee < vMinDomainReputaionScore) // domain reputation score too low and checked recently						
						{
							console.log('1. domain reputation score too low and checked recently - cannot proceed');
							connection.send(JSON.stringify([{ap:q.ap,au:vUrl,eh:1}]));
						}
					  else if((resp.rows[0].s //domain reputation score ok and checked recently - and already captured URL name
							  && resp.rows[0].db) //and already captured URL favicon
							  || resp.rows[0].au < vMaxDomainReputationCheckValidTime) //or already tried getting metadata recently (avoid frequent checking for meta)
						{
							console.log('0. domain reputation score ok and checked recently - and already captured URL name and favicon');
							connection.send(JSON.stringify([{ap:q.ap,au:vUrl,s:resp.rows[0].s,db:resp.rows[0].db,eh:0}])); //eh:0 - URL repitation and meta ok
						}
					  else{//domain ok and checked recently, but no URL metadata (title or favicon) captured last time
						getMeta(vUrl,q.ec,vHost,vProtocol,false)//false = no need check domain, just try getting URL metadata (title and favicon)
						  .then((vMeta) => {
							    console.log('0. domain ok and checked recently, but no URL metadata (title or favicon) captured last time; just attempting to get metadata');
								connection.send(JSON.stringify([{ap:q.ap,au:vMeta[0],s:vMeta[1],db:vMeta[2],eh:vMeta[4]}]));
								//Record URL and its meta into DB
								pool.query('/*NO LOAD BALANCE*/ select * from create_uri($1,$2,$3,$4)',[vHost,vMeta[0],vMeta[1],vMeta[2]])//domain, URL, title, favicon
								  .then(resp => {console.log('logged domain in DB')})
								  .catch(e => {
									  connection.send(JSON.stringify([{ap:q.ap,au:vUrl,eh:7,eg:e.stack}]));//database error
									  console.log('select log domain returned pool query error:'+e.stack);
								  });							  
						  })
						  .catch(e => {
							  console.log('4. domain ok and checked recently, but no URL metadata (title or favicon) captured last time; error when getting meta');
							  connection.send(JSON.stringify([{ap:q.ap,au:vUrl,eh:4,eg:e.stack}]));
							  //no need to record that no meta for URL into DB
						  });									  
					  }	
					}
				  else{ // domain not checked before, or checked too long ago
					getMeta(vUrl,q.ec,vHost,vProtocol,true)//true = need check domain before trying to get URL metadata (title and favicon) 
					  .then((vMeta) => {
						  console.log('5. domain not checked before, or checked too long ago; just attempting to get metadata');
						  connection.send(JSON.stringify([{ap:q.ap,au:vMeta[0],s:vMeta[1],db:vMeta[2],eh:vMeta[4]}]));
						  //Record/update Domain, DomainScore, record URL and its meta into DB
							pool.query('/*NO LOAD BALANCE*/ select * from create_domain($1,$2,$3,$4,$5)',[vHost,vMeta[3],vMeta[0],vMeta[1],vMeta[2]])//domain, reputation score, URL, title, favicon
							  .then(resp => {console.log('created domain and URL in DB')})
							  .catch(e => {console.log('select create domain returned pool query error:'+e.stack);});							  
					  })
					  .catch(e => {
						  console.log('6. domain not checked before, or checked too long ago; error when getting meta');
						  connection.send(JSON.stringify([{ap:q.ap,au:vUrl,eh:4,eg:e.stack}]));
						  //Record issue with Domain into DB
							pool.query('/*NO LOAD BALANCE*/ select * from create_domain($1,$2,$3,$4,$5)',[vHost,-1,vUrl,null,null])//domain, reputation score error, URL, title, favicon
							  .then(resp => {console.log('problem getting URL meta')})
							  .catch(e => {console.log('select create domain returned pool query error:'+e.stack);});
					  });				  
					}
			  })
			  .catch(e => {
				  console.log('select * from get uri returned pool query error:'+e.stack);
				  connection.send(JSON.stringify([{ap:q.ap,au:vUrl,eg:e.stack}]));
			  });	
			return;	
			
		  case 57://check if channel name exists
			pool.query('select * from check_channel_name($1)',[q.be])
			  .then(resp => {connection.send(JSON.stringify([{ap:q.ap,data:resp.rows}]));})
			  .catch(e => {console.log('select check_channel_name returned pool query error:'+e.stack);});		  
			return;	
			
		  case 58://edit_channel		  
			var vAddress = verifyTx(q.el,q.em);//address (q.bq) will be derived from signature
			pool.query('/*NO LOAD BALANCE*/ select * from edit_channel($1,$2,$3,$4,$5,$6,$7)',[pEndpointId,vAddress,q.em.en,q.em.bi,q.em.ci,q.em.au,q.em.db])//2200925 added url,title,favicon
			  .then(resp => {connection.send(JSON.stringify([{ap:q.em.ap,data:resp.rows}]));})
			  .catch(e => {console.log('select * from edit_channel returned pool query error:'+e.stack);});	
			return;	
			
		  case 60://HOMRED VIEW: log notif about viewed homred
			pool.query('/*NO LOAD BALANCE*/ select * from create_notif($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)',[pEndpointId,q.at,3,null,null,null,null,null,q.bq,q.ej,q.a,null,null])
			  //.then(resp => {if(q.a){connection.send(JSON.stringify([{ap:q.ap,data:resp.rows}]))}})
			  .catch(e => {console.log('create notify called by process 60 (log notif about viewed homred) caused returned error:'+e.stack);});
			return;	
			
		  case 61://remove notif about viewed channel details
			pool.query('/*NO LOAD BALANCE*/ select * from delete_notif($1,$2)',[pEndpointId,1])
			  .catch(e => {console.log('delete notif returned error:'+e.stack);});
			return;	
			
		  //case 63://send complaint
			//pool.query('/*NO LOAD BALANCE*/ select * from log_complaint($1,$2,$3,$4)',[pEndpointId,q.bq,q.dq,q.a])
			 // .catch(e => {console.log('log complaint returned error:'+e.stack);});
			//return;		
			
		  //case 64://get channel complaints statistics
			//pool.query('/*NO LOAD BALANCE*/ select * from get_channel_complaints_stats($1) as "r"',[q.bq]) //https://stackoverflow.com/questions/39159635/a-column-definition-list-is-required-for-functions-returning-record-in-postgre
			//  .then(resp => {connection.send(JSON.stringify([{ap:q.ap,data:resp.rows}]));})
			//  .catch(e => {console.log('get channel complaints stats returned error:'+e.stack);});
			//return;			
			
		  case 65://get homred complaints statistics
			pool.query('/*NO LOAD BALANCE*/ select * from get_channel_complaints_stats($1)',[q.bq]) //https://stackoverflow.com/questions/39159635/a-column-definition-list-is-required-for-functions-returning-record-in-postgre
			  .then(resp => {connection.send(JSON.stringify([{ap:q.ap,data:resp.rows,bq:q.bq}]));})
			  .catch(e => {console.log('get channel complaints stats returned error:'+e.stack);});
			return;
			
		  case 66://get next connector
		    var vAddress = verifyTx(q.el,q.em);//address (q.bq) will be derived from signature
			pool.query('/*NO LOAD BALANCE*/ select * from get_next_connector($1)',[vAddress]) //https://stackoverflow.com/questions/39159635/a-column-definition-list-is-required-for-functions-returning-record-in-postgre
			  .then(resp => {connection.send(JSON.stringify([{ap:q.em.ap,data:resp.rows,bq:vAddress}]));})
			  .catch(e => {console.log('get channel complaints stats returned error:'+e.stack);});
			return;
			
		  case 67://create connector and its connection(p_member text, p_connector text, p_pubkey text, p_nick_name text)
		    var vAddress = verifyTx(q.el,q.em);//address (q.bq) will be derived from signature
			pool.query('/*NO LOAD BALANCE*/ select * from create_connection($1,$2,$3,$4)',[vAddress,q.em.eo,q.em.ep,q.em.eq]) //https://stackoverflow.com/questions/39159635/a-column-definition-list-is-required-for-functions-returning-record-in-postgre
			  .then(resp => {connection.send(JSON.stringify([{ap:q.em.ap,data:resp.rows,bq:vAddress}]));})
			  .catch(e => {console.log('get channel complaints stats returned error:'+e.stack);});
			return;
			
		  case 68://get group name and ensure the invite is still valid (not already accepted, expired, revoked)
			pool.query('select * from get_group_name($1)',[q.eo]) //https://stackoverflow.com/questions/39159635/a-column-definition-list-is-required-for-functions-returning-record-in-postgre
			  .then(resp => {connection.send(JSON.stringify([{ap:q.ap,eo:q.eo,data:resp.rows}]));})
			  .catch(e => {console.log('get group name returned error:'+e.stack);});
			return;
			
		  case 69://create new member and join inviter's connection (similar to process 55 (create Channel member) but for Groups
			pool.query('/*NO LOAD BALANCE*/ select * from join_group_invite($1,$2,$3,$4,$5,$6,$7)',[pEndpointId,q.eo,q.eq,q.bq,q.ep,q.eu,q.ej]) //https://stackoverflow.com/questions/39159635/a-column-definition-list-is-required-for-functions-returning-record-in-postgre
			  .then(resp => {connection.send(JSON.stringify([{ap:q.ap,bq:q.bq,eq:q.eq,data:resp.rows}]));})
			  .catch(e => {console.log('join group invite returned error:'+e.stack);});
			return;
			
		  case 70://existing group member to join connection from another inviter
			pool.query('/*NO LOAD BALANCE*/ select * from add_group_connection($1,$2,$3,$4,$5)',[q.eo,q.eq,q.bq,q.eu,q.ep]) //https://stackoverflow.com/questions/39159635/a-column-definition-list-is-required-for-functions-returning-record-in-postgre
			  .then(resp => {connection.send(JSON.stringify([{ap:q.ap,bq:q.bq,eo:q.eo}]));})//returns INVITEE MEMBER, INVITEE CONNECTOR
			  .catch(e => {console.log('add group connection returned error:'+e.stack);});
			return;
			
		  case 71://get member connection private messages
			var vAddress = verifyTx(q.el,q.em);//connector address (q.eo) will be derived from signature
			console.log('process 71 (get messages) connector: '+vAddress);
			pool.query('select * from get_messages($1)',[vAddress]) //https://stackoverflow.com/questions/39159635/a-column-definition-list-is-required-for-functions-returning-record-in-postgre
			  .then(resp => {connection.send(JSON.stringify([{ap:q.em.ap,data:resp.rows}]));})//returns messages json
			  .catch(e => {console.log('add get messages returned error:'+e.stack);});		  
			pool.query('/*NO LOAD BALANCE*/ select * from create_expect($1,$2,$3)',[pEndpointId,vAddress,false])
			  //.then(resp => {connection.send(JSON.stringify([{ap:q.ap,data:resp.rows}]));})
			  .catch(e => {console.log('create expect called by process 71 (get messages) returned error:'+e.stack);});
			return;
			
		  case 75://check connectors for a member: get connectors (and connections) - when opening members window
			poolRead.query('select * from check_connectors($1)',[q.ev])
			  .then(resp => {connection.send(JSON.stringify([{ap:q.ap,bq:q.bq,data:resp.rows}]));})
			  .catch(e => {console.log('select check connectors returned pool query error:'+e.stack);});
			return;
			
		  case 77://remove expects (closing private messages window), or cancelling push for new messages
			pool.query('/*NO LOAD BALANCE*/ select * from remove_expect($1,$2,$3)',[pEndpointId,q.eo,q.fg])
			  //.then(resp => {connection.send(JSON.stringify([{ap:q.ap,data:resp.rows}]));})
			  .catch(e => {console.log('create remove called by process 77 (get messages) returned error:'+e.stack);});
			return;
			
		  case 78://create expect for new messages (PUSH notifictions only; expects for live notifictions are created under process 71)
			pool.query('/*NO LOAD BALANCE*/ select * from create_expect($1,$2,$3)',[pEndpointId,q.eo,q.fq])
			  //.then(resp => {connection.send(JSON.stringify([{ap:q.ap,data:resp.rows}]));})
			  .catch(e => {console.log('create expect called by process 78 (get messages) returned error:'+e.stack);});
			return;
			
		  case 79://create new private message
			var vAddress = verifyTx(q.el,q.em);//connector address (q.eo) will be derived from signature
			pool.query('/*NO LOAD BALANCE*/ select * from create_message($1,$2,$3)',[vAddress,q.em.ez,q.em.fh]) //https://stackoverflow.com/questions/39159635/a-column-definition-list-is-required-for-functions-returning-record-in-postgre
			  //.then(resp => {connection.send(JSON.stringify([{ap:q.ap,bq:q.bq,eo:q.eo}]));})//returns messages json
			  .catch(e => {console.log('create message returned error:'+e.stack);});
			return;
		} 
	
		pool.query(hrProcess,hrParam)
		  .then(resp => {connection.send(JSON.stringify([{ap:q.ap,data:resp.rows}]));})
		  .catch(e => {console.log('select returned pool query error:'+e.stack);});
	}
    catch(e){
	  var vTime = new Date(),
	  vErr = vTime+' callDB error: '+JSON.stringify(e);
	  console.error(vErr);
	}  		  
}

//Process live notifs
function processNotifs(pRes){
	console.log('started processNotifs function');
	var vEndpoint, i=pRes.ba.length, vTotalEndpoints = i-1;
	while (i--){
		vEndpoint = pRes.ba[i].bb;
		console.log('vEndpoint: '+vEndpoint);
		if(clients[vEndpoint]){
			clients[vEndpoint].sendUTF(JSON.stringify([{ap:pRes.ba[i].ap, bc:[pRes.bc], ay:vTotalEndpoints, br:pRes.ba[i].br, bs:pRes.ba[i].bs}]));
			//clients[vEndpoint].send(JSON.stringify([{ap:pRes.ba[i].ap, bc:[pRes.bc], ay:vTotalEndpoints}]));
			console.log('sending message to vEndpoint: '+vEndpoint);
		}
		else {//no such client
			console.log('vEndpoint: '+vEndpoint+' does not exist');
			pool.query('/*NO LOAD BALANCE*/ select delete_notif($1,$2)',[vEndpoint,3])//3=only homred notifs for given session	
			  .then(resp => {
				  console.log('database returned ok on delete notif');//+JSON.stringify(resp.rows[0].bb));
				});			
			
		}
	}	
 }
////////////////////////////////////////////////// 
//GET FAVICONS
function getMeta(pUrl,pLocale,pHost,pProtocol,pCheckDomain){//adopted from https://github.com/kenticny/Gicon
	return new Promise(function(resolve, reject) {
		var webpageTitle,vImage,vPath,vDomainReputation;
		
		checkDomainReputation(pHost,pCheckDomain)//true = need check domain before trying to get URL metadata (title and favicon) 
			.then((vResult) => {
				console.log('Domain reputation checker for host '+pHost+' returned: '+vResult);
				vDomainReputation = parseInt(vResult);
				if(vDomainReputation > vMinDomainReputaionScore || vDomainReputation ===0){
					axios({//axios.get(pUrl)//https://github.com/axios/axios#example
					  method: 'get',
					  url: pUrl,
					  headers: {
							  "Accept-Language": pLocale, //"en-US,en;"
							  "User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:98.0) Gecko/20100101 Firefox/98.0",
							  "Accept-Encoding":"gzip, deflate, br",
							  "Cache-Control":"max-age=0"
					  }
					})
					  .then(response => {
						var vFetchedUrl = response.request.res.responseURL || pUrl;//https://stackoverflow.com/questions/60200369/check-url-redirection-using-axios-in-nodejs
						console.log('axios fetchedUrl: '+vFetchedUrl);
						const $ = cheerio.load(response.data);//https://cheerio.js.org/
						webpageTitle = $("title").text().trim();//https://stackoverflow.com/questions/23326561/get-title-of-a-page-with-cheerio
						console.log('webpageTitle = '+webpageTitle);//https://www.codepedia.org/ama/how-to-get-the-title-of-a-remote-web-page-using-javascript-and-nodejs		
						//var vRelIcon = $("link[rel='icon']") || $("link[rel*='icon']");//https://stackoverflow.com/questions/13211206/html5-link-rel-shortcut-icon
						var favicon = $("link[rel*='icon']").attr("href");
						if(favicon){//favicon found
							if(/data\:image/.test(favicon)){resolve([vFetchedUrl,webpageTitle,favicon,vDomainReputation,0])}//path already has image; 0 = ok
							else if(/^http/.test(favicon)){vPath = favicon}//path to favicon has http (absolute path), so no need to prefix protocol or host
							else if(/^\/\//.test(favicon)){vPath = pProtocol+favicon}//path to favicon has no http, but has '//', so need to prefix with protocol only (telegram case)
							else{vPath = pProtocol+'//'+pHost+favicon}//path to favicon has no http and no '//' (relative path), so need to prefix with protocol and host
							console.log('favicon url = '+vPath);
							//20211119 decided to store favicon URL
							//resolve([vFetchedUrl,webpageTitle,vPath]);
							//20211119 decided to store favicon URL, not the binary image (if need to restore - uncomment the "if" statement)
								if(vPath){//found path to favicon
									axios({
									  method: 'get',
									  url: vPath,
									  responseType: 'arraybuffer'
									  //responseType: 'stream'
									})
									  .then(function (response) {
										//console.log('IMAGE: '+response.data);  
										//resolve([webpageTitle,Buffer.from(response.data, 'base64')]); //has to be text form in base64 in database
										vImage = Buffer.from(response.data, 'binary').toString('base64');
										console.log('vImage length: ',vImage.length);
										if(vImage.length > 7000){vImage = vPath}//testing image binary length to avoid "payload string too long" error //https://stackoverflow.com/questions/41057130/postgresql-error-payload-string-too-long#41059797
										resolve([vFetchedUrl,webpageTitle,vImage,vDomainReputation,0]); //has to be text form in base64 in database; 0 = ok
										//resolve([webpageTitle,response.data]);//https://stackoverflow.com/questions/41846669/download-an-image-using-axios-and-convert-it-to-base64
									  })
									  .catch(e => {
										  console.log('axios favicon URL: '+vPath+' got error: '+e.stack);
										  resolve([vFetchedUrl,webpageTitle,null,vDomainReputation,2]);//2 issue with getting favicon
									  });
								}else{//no path to favicon found in webpage
									resolve([vFetchedUrl,webpageTitle,null,vDomainReputation,2]); //2 issue with getting favicon
								}
						}else{//no favicon found for URL
							console.log('no favicon found for URL: '+pUrl);
							resolve([vFetchedUrl,webpageTitle,null,vDomainReputation,2]); //2 issue with getting favicon
						}			  
					  })
					  .catch(e => {
						  console.log('axios.get URL: '+pUrl+' got error: '+e.stack);
						  resolve([pUrl,null,null,vDomainReputation,4]);//4 issue with reaching website
					  });
					
				}
				else if (vDomainReputation === -3){
					resolve([pUrl,null,null,vDomainReputation,3]);//3 = domain can't be checked (may be issue with API)
				}
				else {
					resolve([pUrl,null,null,vDomainReputation,1]);//1 = domain not reputable
				}
			});
	});
}

/*
//https://github.com/kenticny/Gicon

function getFaviconSource(domain, callback) {
  console.log('starting get Favicon Source');
  if(typeof domain !== "string" || typeof callback !== "function") {
    return callback(error.MISSING_PARAMS());
  }
  followRedirectUrl(domain, function(err, url) {
    if(err) { return callback(err); }
    if(url) {
      url = url.replace(/\/$/, "")
    }
	console.log('url = '+url);

    getFaviconLink(url, function(err, path, buffer) {
      if(err) { return callback(err); }

      if(path && buffer) {
		console.log('path && buffer ok');
        return callback(null, path, buffer); 
      }

      getFaviconPath(url, function(err, path, buffer) {
        if(err) { return callback(err); }

        if(path && buffer) {
		  console.log('get Favicon Path path && buffer ok'); 
          return callback(null, path, buffer); 
        }
        
        callback();
        
      });

    });

  });
}

// Favicon.ico
function getFaviconPath(domain, callback) {
  console.log('starting get Favicon Path');
  callback = callback || function() {};
  if(!domain) {
    return callback(error.DOMAIN_CANNOT_NULL());
  }

  domain = domain + "/favicon.ico";
  requestSimple({ url: domain, method: "GET", encoding: null }, 
    function(err, resp, body) {

    if(err) { return callback(error.REQUEST_ERROR()); }

    if(resp && resp.statusCode == 200 && body.length && /^image/.test(resp.headers["content-type"]) ) {
	  console.log('get Favicon Path returned resp && resp.statusCode == 200 && body.length');
      return callback(null, domain, body);
    }
    callback();
  });
}

// Link rel=icon
function getFaviconLink(domain, callback) {
  console.log('starting get Favicon Link');
  callback = callback || function() {};
  if(!domain) { return callback(error.DOMAIN_CANNOT_NULL()); }

  request.get(domain, function(err, result, body) {
    if(err) { return callback(error.REQUEST_ERROR(err)); }

    var favicon = cheerio(body).find("link[rel*='icon']").attr("href");
	var webpageTitle = cheerio(body).find("title").text();
	console.log('webpageTitle = '+webpageTitle);//https://www.codepedia.org/ama/how-to-get-the-title-of-a-remote-web-page-using-javascript-and-nodejs
    var path = /^http/.test(favicon) ? favicon : (domain + favicon);
    favicon ? requestSimple({ 
      url: path, 
      method: "GET", 
      encoding: null 
    }, function(err, resp, body) {
      if(err) { return callback(error.REQUEST_ERROR()); }

      if(resp && resp.statusCode == 200 && body.length
        && /^image/.test(resp.headers["content-type"]) ) {
        return callback(null, path, body);
      }
      callback();
    }) : callback();
  });
}*/

function getCountry(pCode,pConnection){//forward geocoding - get coordinates of a country //20210338 added default IndexedDB encryption key
//https://stackoverflow.com/questions/61530897/axios-error-connect-econnrefused-127-0-0-180
	axios.get('http://hr_nominatim:8080/search?country='+pCode+'&format=json')
	  .then(res => {
		console.log('hr_nominatim for country code: '+pCode+' returned: '+JSON.stringify(res.data));
		//if(res.data[0] && res.data[0].boundingbox){
			pConnection.send(JSON.stringify([{ap:54,de:res.data[0].boundingbox,df:pCode,dj:'miceiifei4iiHux4uxHuw62ggKHsj37uhU7ggtywgyhfDhsbzhuZhuy63h5'}]));
		//}
	  })
	  .catch(err => {
		console.log('getCountry error: '+err);
	  });
}
//20201128 CREATE SUBSCRIBER - re-usable function that can be called if DB connection is lost, to re-connect to DB (e.g. another instance)
function reCreateSubscriber(){
	console.log('subscriberCreateAttempts = '+subscriberCreateAttempts);
	if(subscriberCreateAttempts < maxSubscriberCreateAttempts){
		subscriberCreateAttempts +=1;
		console.log('subscriberCreateAttempts < maxSubscriberCreateAttempts');
	}else{//number of failed reconnects is more than the maxSubscriberCreateAttempts threshold 
		console.log('subscriberCreateAttempts >= maxSubscriberCreateAttempts');
		subscriberCreateWaitTime = subscriberCreateWaitTimeAfterMaxAttempts; // increase reconnect wait time to 10 mins
	}
	setTimeout(function(){	
		subscriber = createSubscriber(connectionPropertiesListen);
		console.log('subscriber created');
		subscriber.notifications.on("notif"+nodeInstance, (payload) => {
		  // Payload as passed to subscriber.notify() (see below)
					//console.log('received notification for container: '+nodeInstance+' with data '+JSON.stringify(payload));
					console.log('received notification for container: '+nodeInstance);
					//console.log(JSON.stringify(payload));
					processNotifs(JSON.parse(JSON.stringify(payload)));//pg-notify receives object, so have to stringify first
		})

		subscriber.events.on("error", (error) => {
		  console.error("Fatal database connection error:", error);
		  //process.exit(1);
		  reCreateSubscriber();
		})

		process.on("exit", () => {
		  console.log("exit -> subscriber.close()");
		  subscriber.close();
		})

		subscriber.connect();
		subscriber.listenTo("notif"+nodeInstance);
		subscriberCreateAttempts = 0;//re-setting the connection attempts counter;
		subscriberCreateWaitTime = 1000;//revert to 1 sec reconnect time
		
	},subscriberCreateWaitTime);	
}

function checkDomainReputation(pDomain,pCheckDomain){//https://docs.apivoid.com/
	return new Promise(function(resolve, reject) {
			if(pCheckDomain){//send check domain request
				axios({//axios.get(vUrl)//https://github.com/axios/axios#example
				  method: 'get',
				  url: 'https://domain-reputation.whoisxmlapi.com/api/v1?apiKey='+vAPIkey+'&domainName='+pDomain
				  })
				  .then(response => {//Axios already returns JSON by default. Just use response.data as simple JS object, JSON.parse would return an error.
						resolve(response.data.reputationScore);
				  })
				  .catch(e => {
						console.log('axios.get Domain Reputation checker got error: '+e.stack);
						resolve(-3);
				  });
			}else{
				resolve(0);//no need to check domain
			}
	});
}

function verifyTx(pSignature,pMessage){//https://github.com/pubkey/eth-crypto
	var vAddress = EthCrypto.recover(pSignature,EthCrypto.hash.keccak256(pMessage));//generatePrimaryHDKey().deriveChild(x).pubKey or .publicKey
	console.log('vAddress verified: ',vAddress);
	return vAddress;
}