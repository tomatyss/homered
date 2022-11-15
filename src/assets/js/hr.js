//20200413
'use strict'; 
//import * as hdkey from '/moyvamprivet/ethereumjs-wallet.js'; 
//const Wallet = require('ethereumjs-wallet').default;
const { HDKey } = require("@scure/bip32");
//const EthJS = require('ethereumjs-util');//not required
//const { thirdparty } = require('ethereumjs-wallet');not needed 
const cHardenedOffset = 0x80000000;//2,147,483,648 (harnened key is > or = hardened offset
var gHR = {//global object for everything
	lat:0,//51.5080863,//0,
	lon:0,//-0.1280808,//0,
	z:2,
	country:null,
	place:null,
	from: new Date(new Date().setHours(0,0,0,0)),//default start of today
	to:   new Date(new Date().setHours(23,59,59,999)), //default end of today
	currentYear: new Date().getFullYear(),
	months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
	curr_range: 0,//day
	debug:1, //show/hide cLog
	geolocation:0,//0:unknown; 1:supported watch off; 2:supported watch on; 3:working; 4:unsupported; 5:supported but error
	geoCircle:null,//circle on the map show user location
	watchId:null,//id of the geolocation watch
	myLocationShared:false,
	LocationSharedHomredId:0,
	LocationSharedOwnerHash:null,
	viewedHomred:{},
	newObject:{},//channel or homred
	selectedMarker:null,//new marker or marker for edited homred
	editOrDuplicateHomred:0, //MUST BE: 8=DUPLICATE; 15=EDIT; 0=OFF; 
	mapView:true, //list view if false
	placeSearchText:'select place (click on map or find place)',
	//helpTimeOut: 
	gActiveMemberHash: null,
	gActiveMemberDetails: null,//for displaying group member details and store connector for actions
	helpText : {
		main:{v:0},
		newpost:{v:0},
		channels:{v:0},
		newchannel:{v:0},
		channelname:{v:0},
		channeltype1:{v:0},
		channeltype2:{v:0},
		channeltype3:{v:0},
		channeltype4:{v:0},
		channelsearch:{v:0},
		channelweb:{v:0},
		channelemoji:{v:0},
		channeltags:{v:0},
		post:{v:0},
		searchmode:{v:0},
		filterposts:{v:0},
		searchplace:{v:0},
		timeback:{v:0},
		timeselect:{v:0},
		timeforward:{v:0},	
		members:{v:0},	
		memberfilter:{v:0},	
		messages:{v:0},	
		maxHelpShow:7
	},
	gErrorObject:null
},
gMarkers = [],
vMapOptionsL,
vAutocompleteM, 
vMapL,
vMcM,
gViewMode = false,
vLocSearchOpen = false,
gFavs = {},
//gHomreds = {},//own created homreds
gPlaces = {},
gPlaceId = null,//OSM place id to serve as key for gPlaces object
gQueryDelay = 0, 
gTimeRound = 3600000,//900000,
vHt,// = $.mobile.getScreenHeight(),
vWd,// = $(window).width(),
vServiceWorker,
applicationServerPublicKey = 'BOVuR2IdGxolGpli2BzBGtJFkBKQYBISqDT4AU6gBdJ_2Snpmb_qcGk0kWE_yW3u5uqvmHWBWgv3DEeshgzVP-c',
ua = window.navigator.userAgent,
safariTxt = ua.indexOf( "Safari" ),
chrome = ua.indexOf( "Chrome" ),
version = ua.substring(0,safariTxt).substring(ua.substring(0,safariTxt).lastIndexOf("/")+1),
gSubscription = null,//subscription object from browser push service , 'let' instead of 'var' creates issues
swRegistration = null,//let creates issues
vWSconnection,
vWSconnectionRetries = 0,
moweoszk = 'moiw6tl3mxk',
gPar,
gSelectedTags = {},//for passing between senWS() and websockets on message 
gStartTimeOnly = null,
gMnemonic = null,
gPrimaryHDKey = {},//derived Master HD Key, i.e. hdkey.fromMasterSeed(seed).derivePath("m/44'/60'/0'/0"), depth 4 
//gChangeNode = null,//renamed from changeNode - Etherium HD Key object
gMnemonicRecordedByUser = 0,//0 not recorded, 1 - confirmed recorded
gCurrentShowMnemonicThreshold = 0,//0 = user have not done enough interaction to bother him/her with asking to write down th emnemonic, once reaches 10 - force user record mnemonic
gAllAddressesRestored = 0;//0 = Datbase keeps returning addresses; once no address is found = set to 1 and stop address restoration process
const gShowMnemonicThreshold = 10,
gViewHomredInteractionWeight = 1,
gVoteHomredInteractionWeight = 1,
gFollowChannelInteractionWeight = 3,
gCreateChannelInteractionWeight = 10,
gAddressBatch = 10,//step in checking addresses from database
gUserLang = navigator.language || navigator.userLanguage,
gEmoji = new RegExp('(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c[\ude32-\ude3a]|[\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])');//https://stackoverflow.com/questions/37089427/javascript-find-emoji-in-string-and-parse
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//START
$(document).on('pageinit', function(){//https://stackoverflow.com/questions/14468659/jquery-mobile-document-ready-vs-page-events   
	if( /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent) ) {
		$('input.mobile-no-keyboard, textarea.mobile-no-keyboard').attr( 'readonly', 'readonly' );
	}
	window.WebSocket = window.WebSocket || window.MozWebSocket;
	if(!window.WebSocket){showAlert('Your Browser does not support websockets. Try updating your current browser, or use a different browser.')}
	else{ws()}//very first thing we do is connect websockets

	if("onhashchange" in window){//20180224 https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onhashchange
		window.onhashchange = function(){processInvite()} //20180224 https://stackoverflow.com/questions/10577642/window-onhashchange-not-working 
	}else {showAlert('cannot follow channel in this browser (hashchange event not supported). please try another browser.')} 
	//if(window.location.hash){processInvite()}//for opening hom.red in new browser window, as onhashchange will not fire in this case CHECK CAUSE PREVIOUS GROUPS DISSAPPEAR!
	cLog('page init event');

	
	/*//https://developers.google.com/web/updates/2018/07/page-lifecycle-api
	window.addEventListener('blur', (event) => {logBrowser('blur event');navigator.geolocation.getCurrentPosition(showPosition, showPositionError,{timeout:30000});});	
	window.addEventListener('focus', (event) => {logBrowser('focus event');navigator.geolocation.getCurrentPosition(showPosition, showPositionError,{timeout:30000});});	
	window.addEventListener('freeze', (event) => {logBrowser('freeze event');});//not logged
	window.addEventListener('resume', (event) => {logBrowser('resume event');});	//not logged
	window.addEventListener('pagehide', (event) => {logBrowser('pagehide');});	//refresh
	window.addEventListener('pageshow', (event) => {logBrowser('pageshow');});//not logged
	
	//https://stackoverflow.com/questions/58772369/headless-chrome-prevent-sites-to-know-whether-their-window-is-focused-or-not
    Object.defineProperty(window.document,'hidden',{get:function(){return false;},configurable:true});
	Object.defineProperty(window.document,'passive',{get:function(){return false;},configurable:true});
	Object.defineProperty(window.document,'frozen',{get:function(){return false;},configurable:true});
    Object.defineProperty(window.document,'visibilityState',{get:function(){return 'visible';},configurable:true});
	
	document.addEventListener("visibilitychange", (event) => {logBrowser('visibilitychange changed to: '+document.visibilityState+' - '+event);});
	
	if("wakeLock" in navigator){cLog('wakeLoc supported')}	
	else{cLog('wakeLoc not supported')}*/
	

	//showCookieWarning();
	if(!localStorage.getItem('help')){manageHelp()}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//DETECTING PAGE VISIBILITY CHANGE TO PERSIST DATA OR START WEBSOCKETS	
	//https://github.com/GoogleChromeLabs/page-lifecycle/blob/0.1.1/src/Lifecycle.mjs#L156-L172
    // Safari does not reliably fire the `pagehide` or `visibilitychange` events when closing a tab, so we have to use `beforeunload` with a timeout to check whether the default action was prevented.
    // NOTE: we only add this to Safari because adding it to Firefox would prevent the page from being eligible for bfcache.
    if (typeof safari === 'object' && safari.pushNotification) {
		addEventListener('beforeunload', (evt) => {
			setTimeout(() => {
			  if (!(evt.defaultPrevented || evt.returnValue.length > 0)) {
				persistUserData();
			  }
			}, 0);
		});
		document.addEventListener('visibilitychange', function() {//have to use the same listener for page becoming visible
		  if(document.visibilityState === 'visible'){ws()}
		});			
    }
	else{//non-safari browser	
		document.addEventListener('visibilitychange', function() {//20200616 https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilitychange_event
		  if(document.visibilityState === 'visible'){ws()}
		  else{persistUserData()}
		});	
	}	
	//$(window).on("resume", ws);//}/*, {capture: true}*/);// In the freeze event, the next state is always frozen.
	//$(window).on("blur freeze pagehide", persistUserData);///*;saveEmojis();*/}/*, {capture: true}*/);// wsClose();//jquery-2.2.3.min.js:4 Only fetch keepalive is allowed  
/////////////////////////////////////////////////////////////////////////////////////////////////////////////	
	$(window).on("orientationchange resize", function(event) {//runs on mobile when text fields loose focus
		if ($(document.activeElement).attr('type') != "text") {
			//cLog('about to run setMapHeight from window on orientation change');
			setMapHeight()
			.then(vMapL.invalidateSize());
			$('#homred_details,#homred_form').css('bottom','3.7em').css('top','auto').css('left','1em');	 		
		}
	});
//START
	getSavedMapPosition()//get last map position 
		.then(setMapHeight() 
			.then(initMap()//restore Channels, Places, Homreds from storage (currently LS)
				.then(function(){
					/*processInvite();
					gViewMode = true;*/
					vMapL.invalidateSize();
					setInteractiveHelpStatuses();
				})));

	///////////////////////////////////////////////////////////////////
	//FAVS INIT	
	$('#channel_form_search').on('input',getChannelsList);	//20201223 "keyup" does not allow checking for letters and numbers only
	$('#hr_new_channel_name').on('change',checkChannelName);	//20201223 "keyup" does not allow checking for letters and numbers only
	$('#hr_new_channel_name').next('.ui-input-clear').on('click',function(){
		$('#channel_form_save,#channel_name_exists').hide();
		delete gHR.newObject.n;
	});	
	$('#channel_form_search').next('.ui-input-clear').on('click',function(){
		clearChannelSearch();
		gHR.newObject = {};
	});	
	$('#hr_channels').on('filterablefilter', function( event, ui ){
		//https://api.jquerymobile.com/filterable/#event-filter
		//https://stackoverflow.com/questions/37315441/events-for-listview-with-filter-on-jquery-mobile
		//https://stackoverflow.com/questions/43879708/jquery-mobile-listview-count-items-after-filter
		var vThis = $(this), 
			vVisibeChannelsCount = vThis.children().not(".ui-screen-hidden").length,
			vElementId = vThis.attr('id');
		cLog('FILTERABLE EVENT: vVisibeChannelsCount= '+vVisibeChannelsCount);
		if(vVisibeChannelsCount > 0){
			vThis.show();
			$('#'+vElementId+'_label').show();
		}
		else{
			vThis.hide();
			$('#'+vElementId+'_label').hide();
		}
	});	
	$('#hr_period').on('click',function(){closeHomred();$('#hr_date_ranges').slideToggle()});
	$('.ui-icon-menu').on('click',showMenu);
	$('#hr_words').on('click',showMnemonic);
	$('.hr-words').on('keyup',getWordsList);
	$('.ui-icon-terms').on('click',toggleTerms);
	$('body').on('click','.hr-word-found',addWord);
	$('#hr_mnemonics_restore_confirm').on('click',restoreWallet);
	$('#hr_mnemonics_copy').on('click',function(){copyToBuffer(gMnemonic);showAlert('Your access code is copied to buffer. Please, BE VERY CAREFUL where you paste it.');$('#hr_mnemonics, .hr-modal').hide()});
	$('#hr_mnemonics_enter_mode').on('click',switchMenomicEnterMode);
	$('#hr_mnemonics_confirm').on('click',function(){gMnemonicRecordedByUser = true;$('#hr_mnemonics_confirm, #hr_mnemonics, .hr-modal').hide()});
	$('#hr_mnemonics_restore_close').on('click',function(){$('#hr_mnemonics_restore, .hr-modal').hide()});
	$('#hr_mnemonics_close').on('click',function(){$('#hr_mnemonics, .hr-modal').hide()});
	$('#hr_restore').on('click',showRestoreWallet);
	//$('#homred_form_emoji').on('blur',ensureEmojisOnly);
	$('#tag_form_search').on('keyup',getTagsList);
    $('#channel_form_create,#hr_create_channel').on('click',createChannel);//show edit block
    $('#hr_cancel_create_channel').on('click',cancelCreateChannel);//show edit block
    $('#hr_channel_button').on('click',showChannels);
	$('#remove_channel_filter').on('click',removeChannelFilter);
	$('.hr-popup-trigger').on('click',togglePopup);
	$('.hr-popup-trigger').blur(function(e){hidePopup()});
    $('body').on('click','.hr-edit',editChannel);//show edit block	
    $('#channel_form_save').on('click',function(){saveChannel(false)});//edit and save 
    /*$('#channel_form_cancel').on('click',function(){
		clearChannelSearch();
		gHR.newObject = {};
	});	*/
	$('#homred_details_place').on('click',openMaps);
	$('body').on('click','.hr-invite',getNextConnector);
	$('body').on('click','.hr-members',getConnectors);
	$('body').on('click','#hr_dislike',function(){toggleDislikeMenu(null)});
	$('body').on('click','.hr-channel-manage',manageChannelStatus);	
	//$('body').on('click','.create-homred',function(e){e.stopPropagation();CreateHomredPromptPlace(e)});//not working
	$('body').on('click','.hr-leave',deleteChannel);	 
	//$('body').on('click','.channel-filter', function(e){e.stopPropagation();manageChannelFilter(e)});//not working
	//$('body').on('click','a.toggleNotif', function(e){e.stopPropagation();toggleNotif});//https://stackoverflow.com/questions/7031226/jquery-checkbox-change-and-click-event 
	$('#hr_notif').on('click',toggleNotif);//https://stackoverflow.com/questions/7031226/jquery-checkbox-change-and-click-event 
	$('body').on('click','.hr-reaction',sendAction);
	$('#hr_duplicate, #hr_edit').on('click',editHomred);
	$('#hr_del').on('click',deleteHomred);
	//$('.button-hr, #hr_create_post').on('click',CreateHomredPromptChannel);
	$('.button-hr, #hr_create_post').on('click',function(){CreateHomredPromptPlace(false)});
	//$('hr_door').on('click',showBusButtons);
	$('#hr_save_feedback').on('click',sendFeedback);
	$('#hr_cancel_feedback, .ui-icon-feedback').on('click',toggleFeedback);
	$('#hr_feedback_text').on('keyup',function(e){checkFeedback(e)});
	$('body').on('click','.hr-found-place',showSelectedAutocompleteItem);
	$('.hr-uri').on('change',getMeta);
	//$('.hr-uri').next('.ui-input-clear').on('click',function(){getMeta()});
	$('.ui-icon-wrap').on('click',toggleWrap);
	$('#hr_chann').on('click',function(){followPreviewedChannel(getMember(gHR.viewedHomred.n))});
	$('#hr_new_channel_emoji').on('change',processEmoji);
	$('#hr_new_channel_emoji').next('.ui-input-clear').on('click',function(e){e.stopImmediatePropagation();processEmoji()});

	///////////////////////////////////////////////////////////////////
	//MAP ITEMS INIT
	$('body').on('click','.hr_saved_place',selectPlace);
	//AUTOCOMEPLTE
	$('#events_search').on('input',function(){BoundsChanged(0,'keyword search')});
	$('#events_search').next('.ui-input-clear').on('click',function(){BoundsChanged(0,'clear search')});
	$('#place_search').on('input',searchPlace); 
	$('#place_search').on('focus',togglePreviousPlaces);
	//$('#place_search').on('blur',function(){$('#hr_form_places').hide()}); //prevents clicking on previous place in the list
	$('#place_search').next('.ui-input-clear').on('click',clearPlaceSearch);
	
	//$('#homred_form_place_map').click(findOnMap);
	$('#homred_form_post').click(createHomred);
	$('#homred_form_cancel').click(function(){cancelCreateHomred();$('#hr_search').show();gHR.newObject = {};});
	//$('#channel_menu_close').click(hideChannels);
	$('#hr_help_sett').click(resetHelp);	
	$('#hr_donate_btn').click(showDonate);	
	$('#hr_donate_close').click(hideDonate);	
	$('#hr_members_close').click(hideMembers);	
	//$('#hr_member_message').click(getPrivateMessages);	
	$('body').on('click','.hr-messages',getPrivateMessages);
	$('#hr_messages_close').click(hidePrivateMessages);	
	$('#hr_about_btn').click(showAbout);	
	$('#hr_about_close').click(hideAbout);	
	//$('#hr_help_settings_close').click(hideHelpSettings);	
	/*$('#hr_help_back').click(function(){positionHelp(-1)});		
	$('#hr_help_next').click(function(){positionHelp(1)});*/
	$('#homred_details').on('swipe',closeHomred);
	$('.hr-close').on('click',closeHomred);
	//TIME INIT
	$('.hr-date-change').on('click',dateChange);
	$('.hr-date-range').on('click',dateRangeChange);
	$('#homred_form_time_now').on('click',function(){
		gHR.newObject.d = new Date(Math.floor(new Date().getTime() / gTimeRound) * gTimeRound);
		$('#homred_form_from').val(ISODateString(gHR.newObject.d,true));//.removeClass('hr_date_time_blank');
		gHR.newObject.d = Math.round(gHR.newObject.d.valueOf()/1000);
		$('#homred_form_time').html(formatTimeHomred(gHR.newObject.d,null));
		formatDateTimeCollapsible(false);//$('#homred_form_time').removeClass('hr-going-active').addClass('hr-going');
		$('#homred_form_times').collapsible('collapse');
		//$('#homred_form_time_header').removeClass('hr-going-active').addClass('hr-going');
		if(gHR.newObject.b && gHR.newObject.c){$('#homred_form_post').show()};
		formatDateTimeCollapsible(false);
	});
    $('#homred_form_from,#homred_form_to').on('change', function() {
		var vThis = $(this), 
		vFrom = vThis.attr('id')==='homred_form_from', 
		vTarget = $('#homred_form_time');
		if(vThis.val()){
			//vThis.removeClass('hr_date_time_blank');
			var vDateS = new Date($('#homred_form_from').val());
			var vDateE = new Date($('#homred_form_to').val());
			if (vDateE && vDateS > vDateE) {
				if(vFrom){
					$('#homred_form_to').val($('#homred_form_from').val());
					vDateE = vDateS;
					//$('#homred_form_time_header').removeClass('hr-going-active').addClass('hr-going');
				}
				else{
					$('#homred_form_from').val($('#homred_form_to').val());
					vDateS = vDateE;
				}				
			}
			vTarget.text(formatTimeHomred(vDateS.valueOf()/1000,vDateE.valueOf()/1000));
			vTarget.removeClass('hr-going-active').addClass('hr-going');
			$('#homred_form_post').show();
			formatDateTimeCollapsible(false);
			//if(vFrom){$('#homred_form_to').prop('disabled', false)}
		}else{
			if(vFrom){//if From field is null after change
				vTarget.text('select time');
				$('#homred_form_post').hide();
				formatDateTimeCollapsible(true);
				gHR.newObject.d = null;
			}else{
				vTarget.text(formatTimeHomred((new Date($('#homred_form_from').val())).valueOf()/1000,null));
				gHR.newObject.e = null;
			}
			//vThis.addClass('hr_date_time_blank');
			//$('#homred_form_time_header').removeClass('hr-going').addClass('hr-going-active');
			//$('#homred_form_post').hide();
			//if(vFrom){$('#homred_form_to').prop('disabled', true)}
		}
    });
	
    $('.hr-channeltype-sel').on('click',function() {
	  var vThis = $(this);
	  cLog('selected channel type: '+vThis.val());
	  if(vThis.prop("checked") == true) {
		gHR.newObject.en = vThis.val();
		cLog('selected channel type: '+gHR.newObject.en);
	  }
	  /*else if(vThis.prop("checked") == false) {
		showAlert("Checkbox is unchecked.");
	  }*/
	});	
	
	$('#hr_no_splash').on('change',function(){
		if($(this).is(":checked")){gHR.helpText.main.v = gHR.helpText.maxHelpShow}
		else{gHR.helpText.main.v = 0}
	});
	
	setDates();
    ///////////////////////////////////////////////////////////////////
	//https://stackoverflow.com/questions/22543372/jquery-mobile-collapsable-slide-transition
	//$('body').on('click','.toggle-create-homred',function(){

	//$('body').on('click','.hr_channel',function(){cLog($(this).data('fav_hash'));gActiveMemberHash=$(this).data('fav_hash')}); click not picked up
	$('body').on('collapsibleexpand','[data-role="collapsible"]',function(event, ui){
		    var vThis = $(this); 
			gHR.gActiveMember = vThis.data('fav_hash');
			//console.log($(this));
			vThis.children().next().hide();
			vThis.children().next().slideDown(300);
			if(vThis.hasClass('hr_channel') && gViewMode){
				//$('[data-role="collapsible"]').not(vThis).hide(); 
				//$('#channel_form_search,#hr_channels_own_label,#hr_channels_other_label,#channel_form_search_list').hide();
				//$('#hr_channels_own_label,#hr_channels_other_label').hide()
				//if(vThis.hasClass('hr-channel-owner')){$('#hr_channels_other').hide()}
				//else{$('#hr_channels_own').hide()}
				sendWS({
					bq: gHR.gActiveMember,
					ap: 40,//get channel stats and info
					at: Intl.DateTimeFormat().resolvedOptions().timeZone, //https://stackoverflow.com/questions/1091372/getting-the-clients-timezone-offset-in-javascript
				},-1,-1); 
			}
	});	

	$('body').on('collapsiblecollapse','[data-role="collapsible"]',function(){
		    cLog('collapsible collapse event');
			var vThis = $(this);
			gHR.gActiveMember = null;
			vThis.children().next().slideUp(300);
			if(vThis.is(':visible') && vThis.hasClass('hr_channel') && gViewMode /*&& !$('#channel_form_search,#hr_channels_own_label,#hr_channels_other_label').is(':visible')*/){//delete live notif for the vewied channel details	only, prevent sending delete live notif for all channels
				$('#dislike_menu').slideUp();			
				//$('[data-role="collapsible"]').not(vThis).show();
				//$('#channel_form_search,#hr_channels_own_label,#hr_channels_other_label,#channel_form_search_list').show();
				sendWS({
					bq: vThis.data('fav_hash'),
					ap: 61,//remove notif about viewed channel details
					at: Intl.DateTimeFormat().resolvedOptions().timeZone, //https://stackoverflow.com/questions/1091372/getting-the-clients-timezone-offset-in-javascript
				},-1,-1); 
			}else if(vThis.attr('id')==="homred_form_category"){		
				$('#homred_form_tags').blur();
			}
    });
	
	//$('#channel_form_search_list').on('taphold','li',followFoundChannel);
	$('#channel_form_search_list').on('click','li',followFoundChannel);
	$('#tag_form_search_list').on('click','li',addTag);
	$('body').on('click','.hr-group-member',showMemberDetails);
	$('#hr_member_reinvite').on('click',function(){sendInvite(gHR.gActiveConnector)});
	$('#hr_message_send').on('click',sendPrivateMessage);
	$('#hr_alert_close,#hr_alert_ok').on('click',function(){$('#hr_alert,#hr_modal').hide();$('#hr_alert_text').text('');});
	
///////////////////////////////////////////////////////////////////////////////////////
//SERVICE WORKER    
  if ('serviceWorker' in navigator && 'PushManager' in window) {
	  window.addEventListener('load', function() {
	        //navigator.serviceWorker.register('/hrpsw.js').then(function(swReg) {
	        navigator.serviceWorker.register('/moyvamprivet/hrpsw.js').then(function(swReg) {
	            cLog('Service Worker is registered', swReg);
	            swRegistration = swReg;
			    swRegistration.pushManager.getSubscription().then(function(subscription) {//retrieves an existing push subscription
			      if(subscription){//existing subscription from service worker
			    	gSubscription = JSON.stringify(subscription)
			      }//else{subscribeUser(null,null)} // prevent asking for notification permission at the start
				  /*else {//re-started service worker, so need to get new subscription if enabled push notifications exist in local storage				  
					  var key, value, i = localStorage.length;
						while (i--){
							key = localStorage.key(i);//https://stackoverflow.com/questions/12949723/html5-localstorage-getting-key-from-value 
							value = JSON.parse(localStorage[key]);
							if (parseInt(value['nflag'],0) === 1){
								cLog('found enabled notification for FavId: '+key);
								enableNotification(key);
							}//https://stackoverflow.com/questions/4244896/dynamically-access-object-property-using-variable		
						}
				  }*/
			      cLog('existing subscription: '+gSubscription);
			    }, function(err) {
				      // registration failed
				      cLog('No subscription retreived: ', err);
				      gSubscription = null;
				    });
		    }, function(err) {
		      cLog('ServiceWorker registration failed: ', err);
		    });
	  });
	//20180304 https://developer.mozilla.org/en-US/docs/Web/API/Client/postMessage  
	navigator.serviceWorker.addEventListener('message', event => {
	  cLog(event.data.msg, event.data.url);
	  var vString = event.data.url;
	  //showAlert('vString: '+vString);
	  var vHash = vString.split(',');
		//setFav(vHash[0]);	
		var vFrom = parseInt(vHash[1], 10);
		var vTo = parseInt(vHash[2], 10); 
		if (vFrom && vTo) {
			$('#P2_TIMING').val(ISODateString(new Date(vFrom),false));	
			$('#P2_DIAP').val(ISODateString(new Date(vTo),false));
		}		  
	});	
  } 

//DRAGGABLE/////////////////////(from hr20200315.js)  
/*  var draggableNewHr = document.getElementById('homred_form'),vDraggableLeft=0,vDraggableTop=0;
  draggableNewHr.addEventListener('touchstart', function(event) {
    var touch = event.targetTouches[0];
	vDraggableLeft = touch.pageX-draggableNewHr.offsetLeft;
	vDraggableTop = touch.pageY-draggableNewHr.offsetTop;
	//event.preventDefault();	
  }, false);
  draggableNewHr.addEventListener('touchmove', function(event) {
	  if(isDesktop()){
		var touch = event.targetTouches[0];
		$('#homred_form').css('bottom','auto');
		draggableNewHr.style.left = (touch.pageX-vDraggableLeft<0?0:touch.pageX-vDraggableLeft) + 'px';
		draggableNewHr.style.top = touch.pageY-vDraggableTop + 'px';
		event.preventDefault();//prevents chrome mobile refresh
	  }
  }, false);  

  var draggableHomredDetails = document.getElementById('homred_details'),vDraggableHomredDetailsLeft=0,vDraggableHomredDetailsTop=0;
  draggableHomredDetails.addEventListener('touchstart', function(event) {
    var touch = event.targetTouches[0];
	vDraggableHomredDetailsLeft = touch.pageX-draggableHomredDetails.offsetLeft;
	vDraggableHomredDetailsTop = touch.pageY-draggableHomredDetails.offsetTop;
	//event.preventDefault();	
  }, false);
  draggableHomredDetails.addEventListener('touchmove', function(event) {
	  if(isDesktop()){
		var touch = event.targetTouches[0];
		$('#homred_details').css('bottom','auto');
		//$('#homred_details').css('top',touch.pageY-vDraggableHomredDetailsTop + 'px');//also works
		//$('#homred_details').css('left',touch.pageX-vDraggableHomredDetailsLeft + 'px');//also works
		draggableHomredDetails.style.left = (touch.pageX-vDraggableHomredDetailsLeft<0?0:touch.pageX-vDraggableHomredDetailsLeft) + 'px';
		draggableHomredDetails.style.top = touch.pageY-vDraggableHomredDetailsTop + 'px';
		//$('#homred_details').bottom('auto');
		event.preventDefault();//prevents chrome mobile refresh
	  }
  }, false);  
*/
//////////////////////////////////////
$/*.getJSON( "data.json", function( dataJSON ) {
  $('#hr_flowchat').flowchat({
    dataJSON: dataJSON
  });
});*/
/*  $('#hr_flowchat').flowchat({
    data: flowchatData, // require a JSON to be passed
    delay: 1500,
    startButtonId: '#hr_member_message',
    autoStart: true,
    startMessageId: 1
  });*/
/////////////////////////////////////////////////////////////////////////////////////////////////
// MAIN PART  
///////////////////////////
	if (navigator.storage && navigator.storage.persist){//https://developers.google.com/web/updates/2016/06/persistent-storage
	//https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist
	  navigator.storage.persist().then(function(persistent) {
		if (persistent){cLog("Storage will not be cleared except by explicit user action")}
		else{cLog("Storage may be cleared by the UA under storage pressure.")}
	  }); 
	}	

	$(document).on("collapsibleexpand", "[data-role=collapsible]", function () {
		var position = $(this).offset().top;
		$.mobile.silentScroll(position);
	});
	
	//var $mq = $('.marquee').marquee();
	//gHR.marquee = $('.marquee').marquee();
	
	//capture "Go" or "Enter" keyboard press
	$(document).keydown(function (event) {//https://stackoverflow.com/questions/979662/how-to-detect-pressing-enter-on-keyboard-using-jquery?answertab=oldest#tab-top
		  //proper indentiation of keycode and which to be equal to 13.
		if ( (event.keyCode || event.which) === 13) {
			//showAlert('Go button clicked');
			$(':focus').blur();//https://stackoverflow.com/questions/11277989/how-to-get-the-focused-element-with-jquery
			// Cancel the default action, if needed
			event.preventDefault();
			//call function, trigger events and everything tou want to dd . ex : Trigger the button element with a click
			//$("#btnsearch").trigger('click');
		}
	});	
	$('#homred_form_emoji').emojioneArea();
});
    //$("#hr_form").find("*").css("border", "0");
// end initialisation
///////////////////////////////////////////////////////////////////////////////////////////////////
//MNEMONIC
/*var Mnemonic = require('bitcore-mnemonic');
var bitcore = require('bitcore-lib');

function restoreMnemonic(){
	var vMemonic = prompt("Please enter your 12 words", "Ensure correct work order. Leave spaces between words.");
	var vKeys;
	if(vMemonic){
		vKeys = generateMnemonic(vMemonic);
	}
}
function checkMnemonic(){
	if(!localStorage['pk']){var vKeys = generateMnemonic()};
}
function generateMnemonic(pMnemonic){
	// Get a new Mnemonic seed:
	var code = new Mnemonic(pMnemonic,Mnemonic.Words.ENGLISH);
	var mnemonic = code.toString(); // 12 words 
	//same as code.phrase
	//cLog('12 words: '+mnemonic);
	if(!pMnemonic){
		showAlert('homred adopts advanced encryption used for cryptocurrencies to maximise your data protection. If you clear your broswser data you will be able to restore your channels with the 12 words below. PLEASE WRITE THEM DOWN IN THE SAME ORDER AND KEEP IN A SECURE PLACE. NEVER SAVE THEM IN YOUR PHONE OR COMPUTER: '+mnemonic);
	}
	var vKeys = codeToDetails(code);
	//var xpriv = code.toHDPrivateKey();	
	cLog('private key: '+vKeys.privateKeyStr);	
	cLog('public key: '+vKeys.publicKeyStr);
	localStorage.setItem('pk',vKeys.publicKeyStr);
	return vKeys;
}

function codeToDetails(code) {//https://kornatzky.medium.com/working-with-bitcoin-mnemonics-in-javascript-601ad516a33d
  // Calculate HD Master Extended Private Key:
  var xpriv = code.toHDPrivateKey();
  // Derived External HD Private Key:
  //var derived = xpriv.derive("m/0'");
  var derived = xpriv.derive("m/44'/0'/0'/0/0");//m / purpose' / coin_type' / account' / change / address_index //https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki
  // Derived External Private Key:
  var privateKey = derived.privateKey;
  // Derived External Public Key:
  //var publicKey = privateKey.publicKey;
  // Derived External Public Address:
  //var myExternalAddress = publicKey.toAddress();
  
  var pk = new bitcore.PrivateKey(privateKey.toString(), bitcore.Networks.livenet);

  var privateKeyStr = pk.toString();
  var publicKey = new bitcore.PublicKey(pk);
  var publicKeyStr = publicKey.toString();
  var address = new bitcore.Address(publicKey, bitcore.Networks.testnet);
  return {
    privateKeyStr: privateKeyStr,
    publicKeyStr: publicKeyStr
  };
}*/

////////////////////////////////////////////////
//EMOJIS
//var Grapheme = require('grapheme-splitter');
var splitter = new GraphemeSplitter();
function extractEmoji(pString){
	if(pString && pString.length > 0){
		var vStringArray = splitter.splitGraphemes(pString),
		vEmoji = null;
		$.each(vStringArray, function( index, value ) {
		  if(gEmoji.test(value)){
			  vEmoji = value;
			  return false;
		  }
		});	
		return vEmoji;
	}else{return null}
}
/////////////////////////////////////////////////////////////////////////////////////////////////
//ENCRYPTED STORAGE
const { CryptoStorage } = require('@webcrypto/storage');//https://github.com/willgm/web-crypto-storage
var cryptoStore = new CryptoStorage('type1, Crypto2Storage, param9, param10');//https://willgm.github.io/web-crypto-storage/classes/cryptostorage.html

/////////////////////////////////////////////////////////////////////////////////////////////////
//RESTORE FROM LOCAL STORAGE  at page load only or when restoring from file
async function retrieveFavs(){//https://stackoverflow.com/questions/3138564/looping-through-localstorage-in-html5-and-javascript
	cLog("started retrieve Favs function");
	try{
		cryptoStoreGet('pk').then(x => {
			gMnemonic = x;
			if(gMnemonic){//found mnemonic on client, just generate addresses
				cLog('Restored gMnemonic ok: '+gMnemonic);
				$('#hr_words').show();
				gPrimaryHDKey = createDepth4HDKey(gMnemonic);
				//confirm Address();
				cryptoStoreGet('favs').then(y => {//total number of members to regenerate
					var vTotalMembers = parseInt(y,10);
					var vPubkeyAndAddressObject;
					cLog('total members: '+vTotalMembers);
					if(vTotalMembers>0){
						while (vTotalMembers--){
							vPubkeyAndAddressObject = createMemberObject(vTotalMembers);
							cLog('vPubkeyAndAddressObject: '+vPubkeyAndAddressObject.ei);
							gFavs[vPubkeyAndAddressObject.bq] = {ei:vPubkeyAndAddressObject.ei};
						}
						//if(vFavs && typeof vFavs === 'string'){
							//vFavs = vFavs.split(',');
							//vFavs.forEach(function(item, index){gFavs[item]={}});
						if(!!Object.keys(gFavs).length){confirmFavs()}//https://ultimatecourses.com/blog/checking-if-javascript-object-has-keys
						else{//try restoring addresses (in case they had been accidentally deleted in IndexedBD)
							confirmAddress();
						}						
					//}
					}else{//try restoring addresses (in case they had been accidentally deleted in IndexedBD)
						confirmAddress();
					}
					cryptoStoreGet('mnemrecorded').then(x =>{gMnemonicRecordedByUser = parseInt(x,10)});
					cryptoStoreGet('mnemthresh').then(x =>{gCurrentShowMnemonicThreshold = parseInt(x,10)});
				});
			}else{
				cLog('cannot restore mnemonic from IndexedDB - must be 1st time use');
				//saveChannel(true);//create "My Default Group" if there are no other groups/channels
				
			}			
		});
		/*(async () => {
		  gMnemonic = await cryptoStoreGet('pk').then(function(){
			cLog('Restored gMnemonic: '+gMnemonic);
			if(gMnemonic){
				//cLog('Restored gMnemonic: '+gMnemonic);
				var seed = bip39.mnemonicToSeed(gMnemonic);	
				gPrimaryHDKey = hdkey.fromMasterSeed(seed);
				var vFavs = cryptoStoreGet('favs');
				//gFavs = cryptoStoreGet('favs') || null;//.split(',')||[];
				if(vFavs){
					gFavs = vFavs.split(',');
					if(Object.keys(gFavs).length > 0){confirmFavs()}
				}			
				gMnemonicRecordedByUser = cryptoStoreSet('mnemrecorded')||0;
				gCurrentShowMnemonicThreshold = cryptoStoreSet('mnemthresh')||0;
			}else{cLog('cannot restore mnemonic from IndexedDB')}			  
		  })
		})();*/

		gPlaces = localStorage['places']?JSON.parse(localStorage['places']):{};
		//gHomreds = localStorage['homreds']?JSON.parse(localStorage['homreds']):{};
		//gHR.newObject = localStorage['template']?JSON.parse(localStorage['template']):{};
		var vChannel,vMember,vPlace;
		cLog("LS import complete");
		//Places
		Object.entries(gPlaces).sort((a, b) => b[1].cg - a[1].cg).forEach(function(a){//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/entries
			if(a[0]){$('#hr_form_places_list').append("<li data-icon='false' class='hr_saved_place ui-mini' data-place-id='"+a[0]+"'>"+a[1].bo+"</li>")}
		});
		$('#hr_form_places_list').listview('refresh');
		
		if(favHasChecked(2)){$('.ui-icon-channel').removeClass('ui-icon-channel').addClass('ui-icon-channel-active')}
	}
	catch(e){cLog('retrieve Favs error: '+e)}
}

function FavToggle(){
	cLog('start Fav Toggle');
    var vMember,vTotalOwnedChannels=0;
	//alternative approach https://stackoverflow.com/questions/8839318/getting-count-of-object-based-on-condition
	for (vMember in gFavs) {//https://stackoverflow.com/questions/921789/how-to-loop-through-a-plain-javascript-object-with-the-objects-as-members		
		if(gFavs.hasOwnProperty(vMember) && typeof gFavs[vMember] === 'object'){// skip loop if the property is from prototype or not an object
			if(gFavs[vMember].bu){vTotalOwnedChannels+=1}
		}
	}
	///CHANNELS
	if(vTotalOwnedChannels>0){
		$('#channel_form_search').attr('placeholder','create group');
		if(vTotalOwnedChannels>6){			
			$('#channel_form_search').attr('placeholder','filter or create group');
		}
		else{
			$('#channel_form_search').attr('placeholder','create group');
		}
	}
	else{
		$('#channel_form_search').attr('placeholder','create group');
	}
}

///////////////////////////////////////////////////////////////////////////////////////////////////
//MAIN QUERY
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function BoundsChanged(pT,pF) {////0 - view; 1 - after post need to call getHomredDetails; 3 - after websockets reconnect; 4 - after change of Channel
  if(gViewMode){
	//gViewMode = false;//to be re-enabled when the current quesry returns from DB, or if DB does not return for > 5 secs
	//setTimeout(function(){if(!gViewMode){gViewMode = true;cLog('gViewMode set to true after 5 secs')}},5000);
	cLog('started Bounds Changed from: '+pF);
	//remTempMarker();
	
	var vMember, vSelected = [],vChannelFilter;
	for (vMember in gFavs) {
		if(gFavs[vMember].m){vSelected.push(vMember)}//if Channel is selected add it to array
	}
	if (vSelected.length>0){//there are selected channels
		vChannelFilter = vSelected.join(',');//send just the selected channels
	}/* else {//20210105 change to show all homreds by default
		vChannelFilter = Object.keys(gFavs).join(',');//send all channels
	}*/
	
	var vNow = new Date().getTime(),vPar;//, vFilter=(Object.keys(gFavs).length>0);
	if (gQueryDelay > 0 && pT === 0 && (vNow - gQueryDelay) < 100) {//change from 1000 ms, to resolve issue markers not reappear after keyboard close on mobile
		gQueryDelay = vNow; 
		gViewMode = true;
		cLog("query not sent - too soon");
		return false;
	}
	gQueryDelay = vNow;
	var vBounds = vMapL.getBounds(),
	vSearchInput = $('#events_search').val(), //checkInput($('#events_search').val()),
	vSearch;
	if(vSearchInput.length > 3){vSearch = vSearchInput}
	vPar = { //q.d,q.u,q.v,q.w,q.x,q.ab,q.cm,q.z,q.e
		d: Math.round(gHR.from.valueOf()/1000),
		e: Math.round(gHR.to.valueOf()/1000),
		u: vBounds.getSouthWest().lat,
		v: vBounds.getSouthWest().lng,
		w: vBounds.getNorthEast().lat,
		x: vBounds.getNorthEast().lng,
		cm: vChannelFilter,
		ap: 21,
		at: Intl.DateTimeFormat().resolvedOptions().timeZone, //https://stackoverflow.com/questions/1091372/getting-the-clients-timezone-offset-in-javascript
		z: vSearch,
		bq: getDefaultMember()//default group whose posts should be displayed by default, unless filtered out
	};
	/*if(vSearch === '' && vChannelFilter.length === 0){
		gViewMode = true;
		cLog('use search events or follow channels');
	}
	else*/ if(gPar !== vPar || pT === 3){sendWS(vPar,-1,-1)}//http://www.mattzeunert.com/2016/01/28/javascript-deep-equal.html
	else{
		gViewMode = true;
		cLog("query not sent - same parameters");
	}
	gPar = vPar;
  }else{cLog('tried running BoundsChanged but gViewMode is false')}
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//HOMREDS
function editHomred() {//8=DUPLICATE; 15=EDIT; if duplicate - do not delete current homred by NOT sending it's id during posting (delete gHR.newObject.a)
	gHR.newObject = JSON.parse(JSON.stringify(gHR.viewedHomred));//https://scotch.io/bar-talk/copying-objects-in-javascript  //snapshot of homred being edited or duplicated	
	gHR.editOrDuplicateHomred = parseInt($(this).data('hr-action'),10);
	console.log('gHR.editOrDuplicateHomred: '+gHR.editOrDuplicateHomred);
	$('#homred_form_help').show();
	//$('#hr_post').removeClass('button-hr').addClass('button-hr-active');
	gViewMode = false;
	//if(!gHR.newObject.bm && !gHR.newObject.db){$('#homred_form_category_name').show()}
	//if(gHR.mapView){
		//$('#homred_form_place').show();	
		$('#homred_form_place_name').text(gHR.newObject.bo).removeClass('hr-going-active').addClass('hr-going');;//.prop("onclick", null).off("click");//prevent navigate to place in edit mode;
		$('#homred_form_times').show();
		$('#homred_form_post').show();
		formatDateTimeCollapsible(false);
	//}
	FavToggle();
	//SET WEBLINK
	manageUriFields();
	$('#homred_form_from').val(ISODateString(new Date(parseInt(gHR.newObject.d, 10)*1000),true));
	if(gHR.newObject.e){$('#homred_form_to').val(ISODateString(new Date(parseInt(gHR.newObject.e, 10)*1000),true))}
	$('#homred_form_from').trigger("change");

	CreateHomredPromptPlace(getMember(gHR.newObject.n) || createMemberObject(0).bq);
	$('#hr_new_post').hide();
	if(gHR.editOrDuplicateHomred===8){//duplicate homred 
		delete gHR.newObject.a;//to ensure that homred id is not sent to database to be deleted (as would be the case for "15"="edit homred")	
		$('#hr_edit_post').hide();
		$('#hr_copy_post').show();
	}else{//edit homred
		$('#hr_edit_post').show();
		$('#hr_copy_post').hide();		
	}
}

function deleteHomred() {
    //if (confirm('Hide post from public view? Only you will still see it as the creator.')) {
    if (confirm('Delete post? You will not be able to restore it.')) {
		var vPar = {
			a: gHR.viewedHomred.a,
			bq: getMember(gHR.viewedHomred.n) || createMemberObject(0).bq,
			ap: 7/*,
			br: gHomreds&&gHomreds[gHR.viewedHomred.a]?gHomreds[gHR.viewedHomred.a].br:null,*///homred creator hash
		};
		sendWS(vPar,-1,-1);
		closeHomred();
    } else {return false}
}

function DrillIntoCluster(pCluster){//commented out 20180130 //,pSetPar) {//pSetPar = true then add parameter to the URL
	gHR.viewedHomred.a = null;//20180221
	closeHomred();//20180221
	var vMarkers = null;
	try{vMarkers = pCluster.getAllChildMarkers()}
	catch(e){cLog('pCluster is a single Marker: '+e);return;}
	ClearLocation();
	var i = vMarkers.length;
	cLog("Marker Cluster L length: "+i);
	if (i < 4 || vMapL.getZoom() > 17){pCluster.spiderfy()}
	else {//too many markers
		gViewMode = false;
		pCluster.zoomToBounds();
		gViewMode = true;
	}
}

function getHomredDetails(pMarker,pZoom){//commented out 20180130 //,pSetPar) {//pSetPar = true then add parameter to the URL; //20210413 added zoom for sharing homreds
	if(pMarker && typeof pMarker === 'object'){//check if this function is called by clicking a marker on the map
	//if(gHR.mapView){
	  gHR.selectedMarker = pMarker;
	  if(gViewMode || gHR.viewedHomred.a !== pMarker.options.id || gHR.editOrDuplicateHomred !== 0){
		gHR.viewedHomred.b = pMarker.getLatLng().lat;
		gHR.viewedHomred.c = pMarker.getLatLng().lng;    	
		gHR.viewedHomred.a = pMarker.options.id;//added 13/11/2016 -get 1st homred from the list of homreds in the cluster   	
		//gHR.viewedHomred.db = pMarker.options.icon.options.html;//gets overwritten in show Homred function
		cLog('selected marker (from get Homred details function): '+gHR.viewedHomred.a);
		//vMcM.refreshClusters();//causes going through all clusters
	  }
	}else{
	  gHR.viewedHomred.a = pMarker;
	}
	var vPar = {
		a: gHR.viewedHomred.a,
		ap: 11,
		//at: new Date().getTimezoneOffset(),
		at: Intl.DateTimeFormat().resolvedOptions().timeZone,// used for create_notif, //https://stackoverflow.com/questions/1091372/getting-the-clients-timezone-offset-in-javascript
		//br: gHomreds&&gHomreds[gHR.viewedHomred.a]?gHomreds[gHR.viewedHomred.a].br:null,//homred creator hash
		//cm: pAddresses// used for create_notif and log_action; generate address 0 if no previous channel memberships exist
		t: pZoom //20210413 - also used as flag that homred is shared
	};	
	sendWS(vPar,-1,-1); 		
	
	/*if(gFavs && typeof gFavs === 'object' && Object.keys(gFavs).length>0){
		wsSend(Object.keys(gFavs).join(','))
	}
	else{wsSend(generateMemberObject(0))}
		/*generateMemberObject(0).then(x => {//https://stackoverflow.com/questions/49938266/how-to-return-values-from-async-functions-using-async-await-from-function 
			wsSend(x); 
		})*/
		/*(async () => {//https://stackoverflow.com/questions/49938266/how-to-return-values-from-async-functions-using-async-await-from-function
		  wsSend(await generateMemberObject(0))
		})()*/		
	//}
	/*function wsSend(pAddresses){
		var vPar = {
			a: gHR.viewedHomred.a,
			ap: 11,
			//at: new Date().getTimezoneOffset(),
			at: Intl.DateTimeFormat().resolvedOptions().timeZone,// used for create_notif, //https://stackoverflow.com/questions/1091372/getting-the-clients-timezone-offset-in-javascript
			//br: gHomreds&&gHomreds[gHR.viewedHomred.a]?gHomreds[gHR.viewedHomred.a].br:null,//homred creator hash
			cm: pAddresses// used for create_notif and log_action; generate address 0 if no previous channel memberships exist
		};	
		sendWS(vPar,-1,-1); 	  
	}*/	
}
/////////////////////////////////////////////////////////////////////////////////////////////////////
//CREATING NEW HOMRED 
function restoreNewHomredWindow(){
	$('.hr_new_class').collapsible('collapse');
	FavToggle();
	//$('#homred_form_place_name').prop("onclick", null).off("click");
	$('#homred_form_channel_favicon').html('');
	$('#homred_form_channel_name').text('group');
	$('#homred_form_place_name').text(gHR.placeSearchText).removeClass('hr-going').addClass('hr-going-active'); 
	$('#homred_form_emoji').val('');
	manageUriFields();
	formatDateTimeCollapsible(false);
	$('#homred_form_time').text('select time');//.removeClass('hr-going-active').addClass('hr-going');
	$('#homred_form_times').hide();
	$('#homred_form_to').val(null);//.addClass('hr_date_time_blank');
	$('#homred_form_from').val(null);//.addClass('hr_date_time_blank');
	$('#homred_form_post').hide();
	//gHR.newObject.d = null;//from
	//gHR.newObject.e = null;//to
	//gHR.newObject.db = null;//favicon
	//gHR.newObject = {};//to be reset when receive newly created homred from database in function "show Homred"
	//remTempMarker();
	gHR.viewedHomred = {};
}
function CreateHomredPromptChannel(){
	hideMenu();
	$('#hr_search, #hr_time_selector').hide();	
	
	$('#channel_form').addClass('hr-middle');
	$('#channel_form').slideDown();
	closeHomred();
	gViewMode=false;
	var vChannelsOwnedTotal = $('#hr_channels').children().length;//Object.keys(gFavs).length;
		$('#remove_channel_filter').hide();
	if(vChannelsOwnedTotal<1){//no channels exist, so prompt to create channel
		//$('#channel_form_help').collapsible('expand');//show help
		$('#channel_form_header_text').text('Create group to post to');
		//$('#hr_channel_button').removeClass('ui-icon-channel').addClass('ui-icon-delete-active');
		createChannel();// ask to create channel
	}
	else if(vChannelsOwnedTotal===1){//only one channel exists, so open new homred window with this channel pre-selected
		CreateHomredPromptPlace(favOwned());
	}
	else{//prompt to choose from many own channels
		formatChannelsWindow(true);//hiding non-owned channels and showing "choose channel" banner
		$('#channel_form_header_text').text('Choose/create group to post to');
		//$('#hr_channel_button').removeClass('ui-icon-channel').addClass('ui-icon-delete-active');
	}
} 

function CreateHomredPromptPlace(pMemberHash) {//opens/closes window for new homred //as opposed to showing Created Homred
	gViewMode=false;
	$('#hr_search').show();
	if(!isDesktop()){$('.leaflet-bottom.leaflet-left').css('top','5em')}
	//$('#hr_time_selector').hide();
	$('#channel_form').removeClass('hr-middle');
	$('#channel_form').hide("slide:right");
	//hideChannels();//if open; important to preceed setting gViewMode=false, so that all the other channels, labels and search field are unhidden
	setSearchPlace();//
	//$('#hr_post').removeClass('button-hr').addClass('button-hr-active');
	closeHomred();//if open
	//SET CHANNEL
	if(pMemberHash){//homred for a pre-defined group/channel
		$('#homred_form_channel_favicon').html(createImage(gFavs[pMemberHash].db));		
		$('#homred_form_channel_name').html(gFavs[pMemberHash].n);
		gHR.newObject.bq = pMemberHash;//vChannelCheckboxElement.val();
		gHR.newObject.db = gFavs[pMemberHash].db;//icon to be used as marker for homred
		gHR.newObject.s = gFavs[pMemberHash].s;//icon to be used as marker for homred
		gHR.newObject.au = gFavs[pMemberHash].au;//icon to be used as marker for homred
		//('.hr-uri').val(gHR.newObject.au);		
	}
	else{//default group (for all quick posts)
		//delete gHR.newObject.bq; //no group
		gHR.newObject.bq = getDefaultMember();
		if(!gHR.newObject.bq){saveChannel(true)}//creates the new default group for the created homred
	}
	//SET WEBLINK
	manageUriFields();
	$('#homred_form_emoji').val(gHR.viewedHomred.du);
	$('#homred_form').slideDown();
	$('#hr_new_post').show();
	$('#hr_edit_post,#hr_copy_post').hide();
	$('#hr_date_ranges').slideUp();
}

function cancelCreateHomred(){//closes window for new homred 
	$('#hr_time_selector').show();
	if(!isDesktop()){$('.leaflet-bottom.leaflet-left').css('top','auto')}
	$('#channel_form').removeClass('hr-middle');
	gViewMode=true;
	if(!isDesktop()){hideChannels()}//if open
	$('#channel_form_header_text').text('Choose or create group to post to');	
	$.each(gFavs, function(i, item){
		if(gFavs[i].m){
			$('#remove_channel_filter').show();//change icon on channels header panel
			return false;
		}
	});	
	setSearchEvents();
	$('#place_search').val('');
	//$('#hr_post').removeClass('button-hr-active').addClass('button-hr');
	gViewMode = true;
	//$('#hr_channels_other').show();//display non-owned channels, in case they were hidden
	if(gHR.editOrDuplicateHomred===0){//NEW: cancel creating new homred
		remTempMarker();
	}else if (gHR.editOrDuplicateHomred===15){//15=EDIT: cancel editing existing homred - have to show original homred (8=DUPLICATE; 15=EDIT;)
		if(gHR.selectedMarker){
			gHR.selectedMarker.setLatLng([gHR.viewedHomred.b,gHR.viewedHomred.c]);
			getHomredDetails(gHR.selectedMarker,null);//20200724
		}
		//vMcM.refreshClusters();
		//getHomredDetails(gHR.selectedMarker);//20200724
		gHR.editOrDuplicateHomred=0;
	}else if (gHR.editOrDuplicateHomred===8){//8=DUPLICATE: cancel duplicating existing homred (8=DUPLICATE; 15=EDIT;)
		remTempMarker();
		if(gHR.selectedMarker){getHomredDetails(gHR.selectedMarker,null)}//20200724
		gHR.editOrDuplicateHomred=0;
	}	
	$('#homred_form').slideUp();
	restoreNewHomredWindow();
}

/*/*function findOnMap(){//hide homred_form while searching for place on map
	$('#hr_search').slideDown();
	$('#homred_form_place').collapsible('collapse');
	$('#homred_form').slideUp();
	setSearchPlace();
}*/

/////////////////////////////////////////////////////////////////////////////////////////////////
//homred button
/////////////////////////////////////////////////////////////////////////////////////////////////
function createHomred() {
	if($('#homred_form_from').val()){gHR.newObject.d = new Date ($('#homred_form_from').val()).valueOf()/1000}
	if($('#homred_form_to').val()){gHR.newObject.e = new Date ($('#homred_form_to').val()).valueOf()/1000}
	var vNow = new Date().valueOf()/1000,
	vEmoji = $('#homred_form_emoji').val();
	gHR.newObject.du = gEmoji.test(vEmoji)?vEmoji:null;
	gHR.newObject.dc = (gHR.newObject.e && gHR.newObject.e > vNow) || gHR.newObject.d > vNow ? 1 : 0 //if 1 - show "Going" button if time in future; else - hide "Going" button
	gHR.newObject.ap = 1;
	//gHR.newObject.at = new Date().getTimezoneOffset();
	gHR.newObject.at = Intl.DateTimeFormat().resolvedOptions().timeZone; //https://stackoverflow.com/questions/1091372/getting-the-clients-timezone-offset-in-javascript
	savePlace();
	/*if(!gHR.newObject.bq || gHR.newObject.bq === ''){
		gHR.newObject.bq = getDefaultMember();
		if(!gHR.newObject.bq){saveChannel(true)}//creates the new default group for the created homred	
	}*/
	sendWS(gHR.newObject,gFavs[gHR.newObject.bq].ei,-1);
	//$('#hr_post').removeClass('button-hr-active').addClass('button-hr');
	gStartTimeOnly=null;
	gViewMode = true;
	//$('#hr_channels_other').show();//display non-owned channels, in case they were hidden
	$('#place_search').val('');
	if(gHR.editOrDuplicateHomred === 0){delete gHR.newObject.a}//2200820 to prevent creating it as edit or duplicate
	gHR.editOrDuplicateHomred=0;
	cancelCreateHomred();
}

//////////////////////////////////////////////////////////////////////////////////////////////
//TIMING
function setDates(){$('#hr_period').text(formatTime(true,true))}//start only, date only, day

function dateChange(){//change earlier / later
	rangeDates($(this).data('hr-direction'),null);
	BoundsChanged(0,'date change');
	if(gHR.curr_range === 0){
		$('.hr-date-range-active').removeClass('hr-date-range-active');
		if(gHR.from.valueOf() === new Date().setHours(0,0,0,0)){$('#hr-today').addClass('hr-date-range-active')}
		else{$('#hr-day').addClass('hr-date-range-active')}
	}
}
function dateRangeChange(){//change the range (day/month/year)
	var vThis = $(this);
	setTimeout(function(){$('#hr_date_ranges').slideUp()},200);
	if(vThis.data('hr-range') !== gHR.curr_range){//range changed
		gHR.curr_range = vThis.data('hr-range'); //0 to 3 (day,week,month,year); gHR.range: [86400,604800,2592000,31536000],//day,week,month, year
		$('.hr-date-range-active').removeClass('hr-date-range-active');
		vThis.addClass('hr-date-range-active');
	    rangeDates(0,null);
		BoundsChanged(0,'date range change');
	}
}
function rangeDates(pDirection,pDate){
	cLog('gHR.curr_range: '+gHR.curr_range);
	cLog('pDirection: '+pDirection);
	cLog('gHR.from BEFORE: '+gHR.from);
	cLog('gHR.to BEFORE: '+gHR.to);
	if(gHR.curr_range === 0){//day
		if(pDate){//set specific date
			gHR.from = new Date(pDate*1000);
		}
		var y = gHR.from.getFullYear(), m = gHR.from.getMonth(), d = gHR.from.getDate()+pDirection;		
		gHR.from = new Date(y,m,d);
		gHR.to   = new Date(y,m,d,23,59,59,999);
		$('#hr_period').text(formatTime(true,true));
	}
	else if(gHR.curr_range === 4){//today
		gHR.curr_range = 0;//should reset to "day"
		gHR.from = new Date(new Date().setHours(0,0,0,0));
		gHR.to   = new Date(new Date().setHours(23,59,59,999))
		$('#hr_period').text(formatTime(true,true));
	}
	/*else if(gHR.curr_range === 1){gHR.from = new Date().setHours(0,0,0,0)}*///week
	else if(gHR.curr_range === 2){//month https://stackoverflow.com/questions/13571700/get-first-and-last-date-of-current-month-with-javascript-or-jquery
		var y = gHR.from.getFullYear(), m = gHR.from.getMonth()+pDirection;	
		gHR.from = new Date(y,m,1);
		gHR.to   = new Date(y,m+1,0,23,59,59,999);
		m = m===-1?11:(m===12?0:m);//20210101 correct month array from 0 (Jan) to 11 (Dec)
		$('#hr_period').text(gHR.months[m]+' '+gHR.from.getFullYear());
	}
	else if(gHR.curr_range === 3){//year
		var y = gHR.from.getFullYear()+pDirection;
		gHR.from = new Date(y,0,1);
		gHR.to   = new Date(y,11,31,23,59,59,999);
		$('#hr_period').text(y);
	}
	cLog('gHR.from AFTER: '+gHR.from);
	cLog('gHR.to AFTER: '+gHR.to);
}

function ISODateString(d,t) {//returns formated date   //http://stackoverflow.com/questions/3605214/javascript-add-leading-zeroes-to-date
	var vDate=d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
	if(t){return vDate+'T'+pad(d.getHours())+':'+ pad(d.getMinutes())}
	else{return vDate}	
}

function pad(n){return n < 10 ? '0' + n : n}

function formatTimeHomred(pS,pE){//https://www.w3schools.com/js/js_date_methods.asp
  //20200919 for homred window time
  var vStart = new Date(pS*1000),
  vEnd   = pE ? new Date(pE*1000) : null,
  vString='time';
  if(vStart && !vEnd){//show only one time
    gStartTimeOnly = vStart;//signal that when posting new homred, use only current time	  
	var vYear = gStartTimeOnly.getFullYear();
	var vYearString = vYear === gHR.currentYear? ' ' : ' '+vYear+' ';
	var vMon  = gHR.months[gStartTimeOnly.getMonth()];
	var vDate = gStartTimeOnly.getDate();
	var vHour = gStartTimeOnly.getHours();
	var vMin = pad(gStartTimeOnly.getMinutes());
	vString = vDate+' '+vMon+vYearString+vHour+':'+vMin;
	gStartTimeOnly = ISODateString(gStartTimeOnly,true);
  }
  else if(vStart && vEnd){//show both start and end times
	var vYearS = vStart.getFullYear();
	var vYearE = vEnd.getFullYear();
	var vYearSString, vYearEString;
	if (vYearS === gHR.currentYear && vYearE === gHR.currentYear){
		vYearSString = ' ';
		vYearEString = ' ';
	}
	else{
		vYearSString = ' '+vYearS+' ';
		vYearEString = ' '+vYearE+' ';
	}
	var vMonS  = gHR.months[vStart.getMonth()];
	var vMonE  = gHR.months[vEnd.getMonth()];
	var vDateS = vStart.getDate();
	var vDateE = vEnd.getDate();
	var vHourS = vStart.getHours();
	var vHourE = vEnd.getHours();
	var vMinS = pad(vStart.getMinutes());
	var vMinE = pad(vEnd.getMinutes());
	if (vStart - vEnd === 0) {
		vString = vDateS+' '+vMonS+vYearSString+vHourS+':'+vMinS;
	}
	else if (vYearS !== vYearE){
		vString = vDateS+' '+vMonS+vYearSString+' - '+vDateE+' '+vMonE+vYearEString+' | '+vHourS+':'+vMinS+'-'+vHourE+':'+vMinE;
	}
	else if (vMonS !== vMonE){
		vString = vDateS+' '+vMonS+' - '+vDateE+' '+vMonE+vYearEString+' | '+vHourS+':'+vMinS+'-'+vHourE+':'+vMinE;
	}
	else if (vDateS !== vDateE){
		vString = vDateS+'-'+vDateE+' '+vMonS+vYearSString+' | '+vHourS+':'+vMinS+'-'+vHourE+':'+vMinE;
	}  
	else if (vHourS !== vHourE){
		vString = vDateS+' '+vMonS+vYearSString+vHourS+':'+vMinS+'-'+vHourE+':'+vMinE;
	} 
	else {
		vString = vDateS+' '+vMonS+vYearSString+vHourS+':'+vMinS+'-'+vMinE;
	}
  }
  return vString;
}

function formatTime(pStartTimeOnly,pDateOnly){//https://www.w3schools.com/js/js_date_methods.asp
  var vStart = gHR.from,
  vEnd   = gHR.to,
  vString='time',
  vHourMinute = '',
  vHourMinuteEnd = '',
  vHourS,
  vHourE,
  vMinS,
  vMinE;
  if(pStartTimeOnly || !vEnd){//show only one time 
    gStartTimeOnly = vStart;//signal that when posting new homred, use only current time	  
	var vYear = gStartTimeOnly.getFullYear();
	var vYearString = vYear===gHR.currentYear ? ' ' : ' '+vYear+' ';
	var vMon  = gHR.months[gStartTimeOnly.getMonth()];
	var vDate = gStartTimeOnly.getDate();
	if(!pDateOnly){vHourMinute=gStartTimeOnly.getHours()+':'+pad(gStartTimeOnly.getMinutes())}
	//var vHour = gStartTimeOnly.getHours();
	//var vMin = pad(gStartTimeOnly.getMinutes());
	vString = vDate+' '+vMon+vYearString+vHourMinute;
	gStartTimeOnly = ISODateString(gStartTimeOnly,true);
  }
  else if(vStart && vEnd){//show both start and end times
  ///////////////////////////////////////////////////////
	//YEARS
	var vYearS = vStart.getFullYear();
	var vYearE = vEnd.getFullYear();
	var vYearSString, vYearEString;
	if (vYearS === gHR.currentYear && vYearE === gHR.currentYear){
		vYearSString = ' ';
		vYearEString = ' ';
	}
	else{
		vYearSString = ' '+vYearS+' ';
		vYearEString = ' '+vYearE+' ';
	}
  ///////////////////////////////////////////////////////	
	var vMonS  = gHR.months[vStart.getMonth()];
	var vMonE  = gHR.months[vEnd.getMonth()];
	var vDateS = vStart.getDate();
	var vDateE = vEnd.getDate();
	if(!pDateOnly){
		vHourS = vStart.getHours();
		vHourE = vEnd.getHours();
		vMinS = pad(vStart.getMinutes());
		vMinE = pad(vEnd.getMinutes());
		vHourMinute = vHourS+':'+vMinS;
		vHourMinuteEnd = vHourE+':'+vMinE;
	}
	if (vStart - vEnd === 0) {
		vString = vDateS+' '+vMonS+vYearSString+vHourMinute;
	}
	else if (vYearS !== vYearE){
		vString = vDateS+' '+vMonS+vYearSString+vHourS+(pDateOnly?null:':'+vMinS+'-'+vDateE)+' '+vMonE+vYearEString+vHourMinuteEnd;
	}
	else if (vMonS !== vMonE){
		vString = vDateS+' '+vMonS+' - '+vDateE+' '+vMonE+vYearEString+vHourMinute+vHourMinuteEnd;
	}
	else if (vDateS !== vDateE){
		vString = vDateS+'-'+vDateE+' '+vMonS+vYearSString+vHourMinute+vHourMinuteEnd;
	}  
	else if (!pDateOnly && vHourS !== vHourE){
		vString = vDateS+' '+vMonS+vYearSString+vHourMinute+vHourMinuteEnd;
	} 
	else {
		vString = vDateS+' '+vMonS+vYearSString+vHourMinute+(pDateOnly?'':'-'+vMinE);
	}
  }
  return vString;
}
//////////////////////////////////////////////////////////////////////////////////////
//TOGGLE
/*function toggleNoQueue(){
 $(this).toggleClass('ui-icon-hr-door').toggleClass('ui-icon-hr-door-active');	
}*/

function toggleTerms(){
	if(!isDesktop()){hideMenu()}
	closeHomred();
	$("#hr_terms_text, .hr-modal").toggle();
}

function toggleFeedback(){
  if(!isDesktop()){hideMenu()}	
  $(".hr-modal").toggle();
  $("#hr_feedback").slideToggle();
}

function formatChannelsWindow(pCreateHomred){//channel window - hide extra elements (checkboxes, notif buttons, collapsible content, when in "create homred" mode; or show with in "view mode"
	if(pCreateHomred){
		//$('#hr_channels_other_label, #hr_channels_other, .channel-element-hide, #hr_channels_own_label').hide();
		$('.channel-element-hide').hide();
		$('#channel_form_search').attr('placeholder','filter or create group');
		$('.toggle-create-homred').addClass('create-homred');
	}
	else{
		$('#channel_form_header_text').text('Groups');
		//$('#hr_channels_other_label, #hr_channels_other, .channel-element-hide, #hr_channels_own_label').show();
		$('.channel-element-hide').show();		
		$('#channel_form_search').attr('placeholder','filter or create group');
		$('.toggle-create-homred').removeClass('create-homred');
		$.each(gFavs, function(i, item){
			if(gFavs[i].m){
				$('#remove_channel_filter').show();//change icon on channels header panel
				return false;
			}
		});		
		//var vVisibeChannelsCount = $('#hr_channels_other').children().not(".ui-screen-hidden").length;
		//cLog('formatChannelsWindow function: vVisibeChannelsCount= '+vVisibeChannelsCount);
		//if(vVisibeChannelsCount > 0){*/$('#hr_channels_other').show();//}
		//else{$(this).hide()}		
	}
}

function showMenu(){
  //if(gViewMode){
    if($('#hr_mnemonics').is(':visible')){$('#hr_mnemonics, .hr-modal').hide()}
    else if($('#hr_mnemonics_restore').is(':visible')){$('#hr_mnemonics_restore, .hr-modal').hide()}
	else if(MenuOpen()){hideMenu()}
    else{	
		hideAbout();
		$('#hr_menu_btn').removeClass('ui-icon-menu').addClass('ui-icon-menu-active');
		$('#main_menu').show("slide:right");
		if(gViewMode){closeHomred()}
		else{cancelCreateHomred()} 
		if(!isDesktop()) {//if mobile
			closeHomred();
			hideChannels();
			$('#hr_search').hide();
		}
    }
  //}
}

function hideMenu(){
	if(MenuOpen()){		
		$('#hr_menu_btn').removeClass('ui-icon-menu-active').addClass('ui-icon-menu');
		$('#main_menu').hide("slide:left");
		showSearch();
	}
}

function showChannels(){
    if(ChannelsOpen()){hideChannels()}
    else{
		if($('#hr_channels').children().length === 0 /*&& $('#hr_channels_other').children().length === 0*/){//channels have not been generated yet
			generateFavs();				
		}
		//if(window.matchMedia("(max-width: 34em)").matches){$('#channel_form').css('width','100%')}
		$('#channel_form').show("slide:left");
		hideAbout();		
		//$('#hr_channels_own, #hr_channels_other').empty(); //UNCOMMENT TO FORCE CHANEL REGENERATION EVERY TIME
		//confirmFavs(); //UNCOMMENT TO FORCE CHANEL REGENERATION EVERY TIME
		formatChannelsWindow(false);//restoring normal channel window
		if(!isDesktop()) {//if mobile
			closeHomred();
			hideMenu();
			$('#hr_search').hide();
		}
    }
}

function generateFavs(){
	$.each(gFavs, function(i, item){
		if(gFavs[i].dh){//20210527 only for explicitly followed channles (any unfollowed channels will not be generated, but will remain in gFavs)
			generateFav(i,gFavs[i].n,gFavs[i].db,gFavs[i].au,gFavs[i].s,gFavs[i].ck,gFavs[i].bu,gFavs[i].aj,gFavs[i].m,false,gFavs[i].dp,gFavs[i].en);//20220730 DELAY UNTIL CHANNEL OPEN
		}
	});
	FavToggle();
	manageChannelDividersEnhance();	
}

function hideChannels(){
	if(ChannelsOpen()){	
		//gActiveMemberHash = null;	
		$('#channel_form').hide("slide:right");
		if(!gViewMode){cancelCreateHomred()}
		//$('.hr_channel:visible').collapsible('collapse');20220219 causes delay
		//if(window.matchMedia("(max-width: 34em)").matches){$('#channel_form').css('width','22em')}	
		formatChannelsWindow(false);
		//moved from cancel channel creation			
		gHR.newObject = {};
		clearChannelSearch();
		showSearch();
	}	
}
function cancelCreateChannel(){
	gHR.newObject = {};
	clearChannelSearch();//closes window
}

function showSearch(){
	//if(isDesktop() || !$('#hr_menu, #hr_channels').is(':visible')){$('#hr_search').slideDown()}
	$('#hr_search').show()
}
//////////////////////////////////////////////////////////////////////////////////////
//CHECKBOXES
function manageChannelFilter(e) {//when channels' checkboxes are clicked
	cLog('manage Channels Checkbox called');
	var vThis = $(e.target),
	vHash = vThis.data('mhash');
	$('#hr_channel_button').removeClass('ui-icon-channels-filtered').addClass('ui-icon-channel');//change icon on top panel	
	$('#remove_channel_filter').hide();//change icon on channels header panel
	//changing visual represenation
	if(gFavs[vHash]){
		if(vThis.hasClass('ui-icon-channel-filter')){
			vThis.removeClass('ui-icon-channel-filter').addClass('ui-icon-channel-filter-off');
			gFavs[vHash].m = false;
		}
		else{
			vThis.removeClass('ui-icon-channel-filter-off').addClass('ui-icon-channel-filter');
			gFavs[vHash].m = true;
		}
	}
	BoundsChanged(0,'on manage Checkbox');
	$.each(gFavs, function(i, item){
		if(gFavs[i].m){
			$('#hr_channel_button').removeClass('ui-icon-channel').addClass('ui-icon-channels-filtered');//change icon on top panel
			$('#remove_channel_filter').show();//change icon on channels header panel
			return false;
		}
	});
}
function removeChannelFilter(){//clear all channels' filter
	gViewMode = false;
	$.each(gFavs, function(i, item){
		gFavs[i].m = false;
	});
	$('.channel-filter').removeClass('ui-icon-channel-filter').addClass('ui-icon-channel-filter-off');
	gViewMode = true;
	BoundsChanged(0,'on clear channel filter');
	$('#hr_channel_button').removeClass('ui-icon-channels-filtered').addClass('ui-icon-channel');//change icon on top panel
	$(this).hide();
}

function favHasChecked(pType){
	var vHasChecked=false,vMember;
	for(vMember in gFavs){
		if(gFavs[vMember].bg===pType && gFavs[vMember].m){
			vHasChecked=true;
			break;
		}
	}
	return vHasChecked;
}

function favOwned(){//only for cases when there is only one owned channel
	var vMember;
	for(vMember in gFavs){
		if(gFavs[vMember].bu===true){
			return vMember;
			break;
		}
	}
	return null;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Notifications

function urlB64ToUint8Array(base64String) {
  cLog("started urlB64ToUint8Array function");
    var padding = '='.repeat((4 - base64String.length % 4) % 4);//replace const with var as const in not working in safari
    var base64 = (base64String + padding)//replace const with var as const in not working in safari
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    var rawData = window.atob(base64);//replace const with var as const in not working in safari
    var outputArray = new Uint8Array(rawData.length);//replace const with var as const in not working in safari
    var vRawDataLength = rawData.length;

    for (var i = 0; i < vRawDataLength; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

/////////////////////////////////////////////////////////////////////
function toggleNotif(e){
	cLog("started toggle Notif function");
	var vHomredId = ($('#homred_details').is(':visible') && gHR.viewedHomred && gHR.viewedHomred.a) ? gHR.viewedHomred.a : null, vMemberHash = null, vIcon;
	if(vHomredId){//for homred push notifications
		cLog('homred push notif being switched');
		vIcon = $('#hr_notif');
		vMemberHash = getMember(gHR.viewedHomred.n);//getting member hash using channel name
	}else{//for channel push notifications
		cLog('Group push notif being switched');
		vIcon = $(e.target);//https://stackoverflow.com/questions/12155050/jquery-e-target-hasclass-not-working
		cLog('vIcon: '+vIcon.data('notif-hash'));
		vMemberHash = vIcon.data('notif-hash');		
	}
	if (vIcon.hasClass('ui-icon-11') || vIcon.hasClass('ui-icon-69')){
		checkNotifPerm(vMemberHash,vHomredId);	    
	} else { 
		createPush(vMemberHash,vHomredId);//push on or off is determined by the DB 
	} 
}

function enableNotification(pMemberHash,pHomredId){
  cLog("started enable Notification function");
		if (gSubscription) {createPush(pMemberHash,pHomredId)}
		else {subscribeUser(pMemberHash,pHomredId)}
}

function checkNotifPerm(pMemberHash,pHomredId) {
  cLog("started check NotifPerm function with Notification.permission = "+Notification.permission);//https://developer.mozilla.org/en-US/docs/Web/API/Notification/permission
  if (!("Notification" in window)) {cLog("This browser does not support  notifications")}
  else if (Notification.permission === "granted") {enableNotification(pMemberHash,pHomredId)}
  else if (Notification.permission === "default") {
    Notification.requestPermission(function (permission) {
      if (permission === "granted") {
        enableNotification(pMemberHash,pHomredId);
      }
    });
  }
  else if (Notification.permission === 'denied'){
	  showAlert('You disallowed notifications for hom.red earlier. If you changed your mind, please go to browser settings -> privacy/security -> site settings -> notifications, to allow notifications from hom.red');
  }
}

function subscribeUser(pMemberHash,pHomredId) {
    cLog('starting subscribe User');
    var applicationServerKey = urlB64ToUint8Array(applicationServerPublicKey);//replace const with var as const in not working in safari
    swRegistration.pushManager.subscribe({//subscribes to a push service does not work if cookies are disabled
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
    }).then(function(subscription) {
        gSubscription = JSON.stringify(subscription);
        cLog('User is subscribed:', gSubscription);
        if('getKey' in PushSubscription.prototype) {cLog('payload supported')}
        else {cLog('payload not supported')}
        if(pMemberHash && pHomredId){createPush(pMemberHash,pHomredId)}
    }).catch(function(err) {
		cLog('Failed to subscribe the user: ', err);
		showAlert('Enable browser notifications. If you are using Brave browser, try enabling Use Google Services for Push Messaging in Brave settings > Privacy and Security > Use Google Services for Push Messaging, or use "brave://settings/privacy" shortcut.');//https://stackoverflow.com/questions/38783357/google-push-notifications-domexception-registration-failed-permission-denie
		});
}
//PROCESS 3: CREATE PUSH NOTIF
function createPush(pMemberHash,pHomredId){
  cLog("started create Push function");
  var vPar = {
        ab: gSubscription,//user subscription
		ap: 3, //process create push notification for all other types
		//at: new Date().getTimezoneOffset(),
		at: Intl.DateTimeFormat().resolvedOptions().timeZone, //https://stackoverflow.com/questions/1091372/getting-the-clients-timezone-offset-in-javascript
		bq: pMemberHash, //member hash (address)
		a: pHomredId
  };
  sendWS(vPar,-1,-1);   
}

function unsubscribeUser() {//check when / if needed
  cLog("started unsubscribe User function");
    swRegistration.pushManager.getSubscription().then(function(subscription) {
        if (subscription) {
            //showAlert("You are not subscribed now.")
            return subscription.unsubscribe();
        }
    }).catch(function(error) {
        cLog('Error unsubscribing', error);
    }).then(function() {
        gSubscription = null;
        cLog('User is unsubscribed.');
    });
}

//////////////////////////////////////////////////////////////////////////////////////
//MEMBERS (CHANNELS)
///////////////////////////////////////////////////////////////////////////
function followFoundChannel(){//found by user
	var vThis = $(this),vExistingChannelMember = getMember(vThis.data('channel-name'));
	if (vExistingChannelMember){//channel member already created by viewing found homred, belonging to this channel, so just get channel's default URI and Title
		followPreviewedChannel(vExistingChannelMember);//get specific member who have not followed channel and get channel information to be followed by client
	}else{//
		//https://stackoverflow.com/questions/841553/jquery-this-child-selector
		//gHR.newObject.db = vThis.children('img.ui-li-icon').attr('src');
		//gHR.newObject.db = vThis.children('img').attr('src');
		gHR.newObject.db = vThis.find('img').attr('src')||vThis.find('.channel-favicon').text();//https://stackoverflow.com/questions/2186096/retrieve-child-img-src-jquery
		cLog('gHR.newObject.db: '+gHR.newObject.db);
		//gHR.newObject.ck = vThis.children('span.hr-channel-tags').text(); 
		gHR.newObject.ck = vThis.find('span.hr-channel-tags').text(); //https://stackoverflow.com/questions/2186096/retrieve-child-img-src-jquery
		gHR.newObject.n = vThis.data('channel-name');
		gHR.newObject.bu = false;
		var vMemberObject = generateMemberObject();
		var vPar = {
			ap: 42,//process create new member for a found channel
			n: gHR.newObject.n,
			ei: vMemberObject.ei,
			ej: vMemberObject.ej,
			bq: vMemberObject.bq
		};
		sendWS(vPar,-1,-1);
	}	
	clearChannelSearch();
}
//from process 42: follow found Channel
function processFoundChannel(r,pFollowChannel,pIndex,pChannelType){
	//cLog('gHR.newObject.toString(): '+gHR.newObject.toString());
	if(!r.di){//no channel found
		showAlert('no channel with such name, or channel might have been deleted by owner');
	}
	else if(r.dn){//duplicate address found in database - occurs when user previously unfollowed channels 
		gFavs[r.bq] = {'dn':true};//mark address as duplicate; not to be re-used
		var vMemberObject = generateMemberObject(true);
		var vPar = {//re-send with next generated address
			ap: 42,//process create new member for a found channel
			n: gHR.newObject.n,
			ei: vMemberObject.ei,
			ej: vMemberObject.ej,
			bq: vMemberObject.bq
		};
		sendWS(vPar,-1,-1);
		return;//prevent INDEFINITE LOOP
	}
	else{
		gHR.newObject.ei = pIndex;
		gHR.newObject.dh = pFollowChannel;//save flag showing if channel is explicitly followed or not (user just viewed homred belonging to this channel)
		if(pFollowChannel){
			gHR.newObject.au = r.au;
			gHR.newObject.s = r.s;
		}else{//channel name provided when creating member without following channel 
			gHR.newObject.n = r.n;
		}
		gHR.newObject.en = parseInt(pChannelType,10);
		gFavs[r.bq] = JSON.parse(JSON.stringify(gHR.newObject));
		//if(pFollowChannel){//channel explicitly folowed via process 42 with new Address generated
			//gFavs[r.bq] = JSON.parse(JSON.stringify(gHR.newObject));
		generateFav(r.bq,gHR.newObject.n,gHR.newObject.db,r.au,r.s,gHR.newObject.ck,false,false,false,true,true,gHR.newObject.en);
		//pMemberHash,pName,pFavicon,pUri,pUriTitle,pTags,pOwner,pNotif,pFiltered,pExpand,pVisible
		FavToggle();
		manageChannelDividersEnhance();
		/*}else{//user just viewed homred belonging to this channel
			var vNewAddress = generateMemberObject();
			gFavs[vNewAddress] = JSON.parse(JSON.stringify(gHR.newObject));
		}*/
		cryptoStoreSet('favs', Object.keys(gFavs).length);//just store number of channel members
		//localStorage.setItem('favs', Object.keys(gFavs).join(','));//20210304 required to avoid missing favs when browser crashes
		//localStorage.setItem('favs', JSON.stringify(gFavs));//20200616 required to avoid missing favs when browser crashes
		//gHR.newObject = {};
		checkRecordMnemonic(gFollowChannelInteractionWeight);//test if the right time to prompt user to record 12 words //gViewHomredInteractionWeight, gVoteHomredInteractionWeight, gFollowChannelInteractionWeight, gCreateChannelInteractionWeight
	}
	gHR.newObject = {};
}

function followChannelfromUri(){//obtained from invite from url
	var vExistingChannelMember = getMember(gHR.newObject.n);
	if (vExistingChannelMember){//channel member already created by viewing found homred, belonging to this channel, so just get channel's default URI and Title
		if(gFavs[vExistingChannelMember].dh){showAlert('You already follow channel '+gHR.newObject.n+'. See it in the channels menu under "followed channels"')}
		else{followPreviewedChannel(vExistingChannelMember)}//get specific member who have not followed channel and get channel information to be followed by client
	}else{//
		var vMemberObject = generateMemberObject();
		var vPar = {
			ap: 55,//process create member
			n: gHR.newObject.n,
			ei: vMemberObject.ei,
			ej: vMemberObject.ej,
			bq: vMemberObject.bq
		};
		sendWS(vPar,-1,-1);
	}
}
//from process 55: follow Channel from invite
function processChannelFromUri(pMemberHash,pUri,pTitle,pTags,pFavicon,pChannelFound,pMemberDuplicate,pIndex,pChannelType){
	if(!pChannelFound){//no channel found
		showAlert('no channel with such name, or channel might have been deleted by owner');
	}
	else if(pMemberDuplicate){//duplicate address found in database - should never occur 
		gFavs[pMemberHash] = {'dn':true};//mark address as duplicate; not to be re-used
		var vMemberObject = generateMemberObject(true);//increment
		var vPar = {
			ap: 55,//process create member
			n: gHR.newObject.n,
			ei: vMemberObject.ei,
			ej: vMemberObject.ej,
			bq: vMemberObject.bq
		};
		sendWS(vPar,-1,-1);
		return;
	}
	else{
		gHR.newObject.dh = true;
		gHR.newObject.au = pUri;
		gHR.newObject.s = pTitle;
		gHR.newObject.ck = pTags;
		gHR.newObject.db = pFavicon;
		gHR.newObject.ei = pIndex;
		gHR.newObject.en = parseInt(pChannelType,10);
		gFavs[pMemberHash] = JSON.parse(JSON.stringify(gHR.newObject));
		generateFav(pMemberHash,gHR.newObject.n,gHR.newObject.db,pUri,pTitle,pTags,false,false,false,true,true,gHR.newObject.en);
		//pMemberHash,pName,pFavicon,pUri,pUriTitle,pTags,pOwner,pNotif,pFiltered,pExpand,pVisible
		FavToggle();
		manageChannelDividersEnhance();
		cryptoStoreSet('favs', Object.keys(gFavs).length);//just store number of channel members
		//localStorage.setItem('favs', Object.keys(gFavs).join(','));//20210304 required to avoid missing favs when browser crashes
		//localStorage.setItem('favs', JSON.stringify(gFavs));//20200616 required to avoid missing favs when browser crashes
		showAlert('You now follow channel '+gHR.newObject.n+'. See it added to the channels menu under "followed channels"');
		gHR.newObject = {};
		checkRecordMnemonic(gFollowChannelInteractionWeight);//test if the right time to prompt user to record 12 words//gViewHomredInteractionWeight, gVoteHomredInteractionWeight, gFollowChannelInteractionWeight, gCreateChannelInteractionWeight
	}
}

//from process 69: create new member and join inviter's connection (similar to process 55 (create Channel member) but for Groups
function processJoinedGroup(pMember,pConnector,pUri,pTitle,pTags,pFavicon,pChannelType){
	gFavs[pMember].dh = true;
	gFavs[pMember].au = pUri;
	gFavs[pMember].s = pTitle;
	gFavs[pMember].ck = pTags;
	gFavs[pMember].db = pFavicon;
	gFavs[pMember].en = parseInt(pChannelType,10);	
	generateFav(pMember,gFavs[pMember].n,pFavicon,pUri,pTitle,pTags,false,false,false,true,true,gFavs[pMember].en);
	//pMember,pName,pFavicon,pUri,pUriTitle,pTags,pOwner,pNotif,pFiltered,pExpand,pVisible
	FavToggle();
	manageChannelDividersEnhance();
	cryptoStoreSet('favs', Object.keys(gFavs).length);//just store number of channel members
	//localStorage.setItem('favs', Object.keys(gFavs).join(','));//20210304 required to avoid missing favs when browser crashes
	//localStorage.setItem('favs', JSON.stringify(gFavs));//20200616 required to avoid missing favs when browser crashes
	showAlert('You now follow channel '+gFavs[pMember].n+'. See it added to the channels menu under "followed channels"');
	gHR.newObject = {};
	checkRecordMnemonic(gFollowChannelInteractionWeight);//test if the right time to prompt user to record 12 words//gViewHomredInteractionWeight, gVoteHomredInteractionWeight, gFollowChannelInteractionWeight, gCreateChannelInteractionWeight
	//ADD NEW CONNECTION FOR MEMBER in the member's window

}

//from process 70: existing group member to join connection from another inviter
function processAddConnection(pInviteeMember,pInviteeConnector){	
	//ADD NEW CONNECTION FOR MEMBER in the member's window
}

function manageChannelStatus(){////channels (hide, show) 
	var vMemberHash = $(this).data('fav-hash');
	cLog('managing channel visibility with hash: '+vMemberHash);
	var vName=gFavs[vMemberHash].n,
	vAlertText = 'Group "'+vName+'" and all its posts will be ';
	if(gFavs[vMemberHash].dp){//if visible - then hide
		vAlertText = vAlertText+'hidden from all but you, as the owner. You will be able to unhide the channel and all its posts at any time.';
	}else{//if already hidden - unhide
		vAlertText = vAlertText+'unhidden for all. You will be able to hide the channel and all its posts at any time.';
	}	

	if (window.confirm(vAlertText)){	
		if(!gFavs[vMemberHash].dp){//if already hidden - unhide
			$(this).removeClass('ui-icon-resume').addClass('ui-icon-pause');
			$(this).text('Hide channel');
			gFavs[vMemberHash].dp = true;
			$('#hr_fav'+vMemberHash).find('.hr-channel-visibility-hidden').removeClass('hr-channel-visibility-hidden').addClass('hr-channel-visibility');//https://stackoverflow.com/questions/648004/what-is-fastest-children-or-find-in-jquery
		}else{//if visible - then hide
			$(this).removeClass('ui-icon-pause').addClass('ui-icon-resume');
			$(this).text('Unhide channel');
			gFavs[vMemberHash].dp = false;
			$('#hr_fav'+vMemberHash).find('.hr-channel-visibility').removeClass('hr-channel-visibility').addClass('hr-channel-visibility-hidden');//https://stackoverflow.com/questions/648004/what-is-fastest-children-or-find-in-jquery
		}		
		sendWS({
			ap: 52,//leave_fav
			bq: vMemberHash,
			dp: gFavs[vMemberHash].dp
			},-1,-1);			
		FavToggle();
		BoundsChanged(0,'Group visibility changed');
	}		
}

function deleteChannel(){////channels (delete and unfollow) 
	var vMemberHash = $(this).data('fav-hash');
	cLog('deleting channel with hash: '+vMemberHash);
	var vName=gFavs[vMemberHash].n,vAlertText,vConfirmedText,vOwner=false;//only for own channels (they are first suspended temporarily)

	if(gFavs[vMemberHash].bu){
		vOwner = true;
		vAlertText = 'You are the owner of group '+vName+'. If you proceed, channel and all its posts will be DELETED FOR GOOD for all members and channel name will be released. THIS IS NOT REVERSIBLE!. Are you ABSOLUTELLY sure you wnat to delete group? You may consider temporarilly hiding channel instead';
		vConfirmedText = 'You deleted channel '+vName+' and members cannot see homreds from this channel. You can still restore channel within the next 30 days, after which it will be deleted permanently.';
	}else{
		vAlertText = 'You will leave channel '+vName+'. You will be able to follow this channel again if you would want to.';		
	}

	if (window.confirm(vAlertText)) {
		$('#hr_fav'+vMemberHash).remove();
		//delete gFavs[vMemberHash];//must not delete, but keep to be marked as left (empty object)
		if(vOwner){delete gFavs[vMemberHash]/* = {}*/}
		else{gFavs[vMemberHash].dh = false}
		sendWS({
			ap: 52,//leave_fav
			bq: vMemberHash,
			dp: null
			},-1,-1);			
		FavToggle();
		BoundsChanged(0,'leave Fav');
		cryptoStoreSet('favs', Object.keys(gFavs).length);//just store number of channel members
	}		
}

/*function leftFav(pMemberHash){//process 52 - somebody left non-owned channel, or deleted own channel //NOT USED CURRENTLY
	if(gFavs[pMemberHash]){delete gFavs[pMemberHash]}
}*/
//////////////////////////////////////////////////////////////
//CHANNEL/GROUP INVITES
function getNextConnector(){
	var vMemberIndex = gFavs[gHR.gActiveMember].ei;
	var vPar = {
		ap: 66//process get_next_connector for Group
	};
	sendWS(vPar,vMemberIndex,-1);	
}

function promptNickName(pConnectorIndex,pMemberHash,pInviterConnector,pGroupName,pInviter){//true if the name is set by the inviter; false - if by invitee
	var vText = pInviter ? "What person do you want to invite to this Group? " : "Who invited you to this Group? ";
	var vNickName = prompt(vText+"Nicknames recommended. No need to put full real names. This is simlar to your phone's contact entry and is purelly for you only, so that you can distiguish between members of your Group. This will never be revealed to anyone and will remain private. You will be able to chat with each other in this Group", "Nickname");  
	if (vNickName != null){
		vNickName = vNickName.trim();
		var p,vNameNotExists = true; 
		if(pMemberHash){
			for (p in gFavs[pMemberHash].ev) {		
				if(gFavs[pMemberHash].ev.hasOwnProperty(p) && typeof gFavs[pMemberHash].ev[p] === 'object' && gFavs[pMemberHash].ev[p].eq === vNickName){
					vNameNotExists = false;
					break;
				}
			}			
		}
		if (vNameNotExists){
			if(pInviter){prepareInvite(pConnectorIndex,pMemberHash,vNickName)}// when inviting 
			else{joinGroup(pInviterConnector,pGroupName,vNickName)} //when accepting the invite
		}
		else{
			showAlert('Name '+vNickName+' already exists in this Group');
			promptNickName(pConnectorIndex,pMemberHash,pInviterConnector,pGroupName,pInviter);
		}
	}/*else{
		showAlert('Please provide a name (nickname) for the person you are inviting to the Group');
		//promptNickName(pConnectorIndex,pMemberHash);
	}*/		
}
async function prepareInvite(pConnectorIndex,pMemberHash,pNickName){
	var vHDKey = generatePrimaryHDKey().deriveChild(gFavs[pMemberHash].ei);
	var vPublicKeyHex = window.EthCrypto.util.uint8ArrayToHex(vHDKey.publicKey);
	var vNickNameEncrypted = await anyEncrypt(vPublicKeyHex,pNickName);//pPublicKey format: hex produced by window.EthCrypto.util.uint8ArrayToHex(vHDKey.publicKey), pMessage format: string
	var vConnector = createConnectionObject(gFavs[pMemberHash].ei,pConnectorIndex);
		/*vConnector.ei:pMemberIndex,
		vConnector.es:pConnectorIndex,
		vConnector.ep:pubKey
		vConnector.eo:Address*/
	var vPar = {
		ep:vConnector.ep,//pubKey to be shared with the invitee for encryption
		eo:vConnector.eo,//Address to be shared with the invitee to accept the invite (invitor's connector)
		eq:vNickNameEncrypted,
		ap: 67//process get_channels
	};
	sendWS(vPar,gFavs[pMemberHash].ei,-1);//CREATE A CONNECTION IN DATABASE AND WAIT FOR CONFIRMATION
	if(!gFavs[pMemberHash].ev){gFavs[pMemberHash].ev = {}}//must initialise object
	if(!gFavs[pMemberHash].ev[vConnector.eo]){gFavs[pMemberHash].ev[vConnector.eo] = {}}//must initialise object
	gFavs[pMemberHash].ev[vConnector.eo] = {eq:pNickName,es:vConnector.es,et:0};
	//gFavs[pMemberHash].ev[pConnectorIndex].eo = vConnector.eo;
	$('#hr_members_list').append('<li><a href="#" id="hr_member'+vConnector.eo+'" data-member="'+vConnector.eo+'" class="ui-btn hr-group-member ui-btn-noicon">'+pNickName+'</a><div id="member_details_port'+vConnector.eo+'"></div></li>').listview('refresh');
}

function sendInvite(/*pMemberHash,*/pConnector){		
		/*var vShare = $(this).data('hr-channel-name') || gHR.viewedHomred.a;
		var vType = $(this).data('hr-channel-name') ? 0:1; //0 = channel, 1 = homred
		var vZoom = vType === 1 ? '&'+vMapL.getZoom() : '';
		var vUri = window.location+'#'+encodeURIComponent(vShare)+'&'+vType+vZoom;*/
		var vUri = window.location+'#'+encodeURIComponent(pConnector);
		vUri = vUri.replace('##','#');
		cLog('invite string: '+vUri);
		//setTimeout(function(){
			if (navigator.share) {//https://developers.google.com/web/updates/2016/09/navigator-share
			  navigator.share({
				  title: 'homred',
				  url: vUri
			  }).catch((error) => {
				  copyToBufferAndDisplay(vUri);
				  cLog('Error sharing: '+error);
			  });
			}
			else{copyToBufferAndDisplay(vUri);}			
		//},0);//timeout required to avoid Error sharing (NotAllowedError: Failed to execute 'share' on 'Navigator': Must be handling a user gesture to perform a share request.)
		
	function copyToBufferAndDisplay(pUri){
		//$('#hr_add_member').show();//have to show to enable copying (it is hidden when re-sending invite)
		copyToBuffer(pUri);
		//$('#hr_add_member').hide(); 
		var vMessage = 'Forward this link "'+pUri+'" (already copied) by text, messengers, email, etc. to invite others to join the channel or view post.';
		showAlert(vMessage);		
	}
}

function copyToBuffer(pString){
	$('#hr_copy_buffer').show();//have to show to enable copying
	$('#hr_copy_buffer').val(pString);    
	$('#hr_copy_buffer').select();	
	var successful = document.execCommand('copy');
	$('#hr_copy_buffer').blur();
	$('#hr_copy_buffer').hide();
	$('#hr_copy_buffer').val('');	
}

function processInvite(){//Obtains parameters from the received URL
	if(location.hash){//https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onhashchange
		var vInvitorAddress = location.hash.substring(1);//20200616 //remove 1st symbol "#"// this is a connector from the inviter
		cLog('function processInvite location.hash: '+vInvitorAddress);
		getGroupName(vInvitorAddress);		
        setTimeout(function(){removeHash()},1000);		
	}
}

function getGroupName(pInviterConnector){
	var vPar = {
		ap: 68,//process create member
		eo: pInviterConnector
	};
	sendWS(vPar,-1,-1);	
}
//from process getGroupName (68) - called by the invitee (not the inviter)
function checkGroupInviteStatus(pInviterConnector,pGroupName,pValid){
	var vValid = parseInt(pValid,10),vReason;
	if(vValid===0){
		promptNickName(null,null,pInviterConnector,pGroupName,false);
	}else{
		switch(vValid){				
		  case 1:vReason='The invite was one-time only and somebody else has accepted it already. Please let the Group member who invited you know and ask for another invite.';
			break;						
		  case 2:vReason='The Group member who invited you, has revoked this invite.';
			break;						
		  case 3:vReason='You must had left this Group earlier. Please ask for a new invite if you want to re-join.';
			break;						
		  case 4:vReason='The invite was one-time only and has expired. Please ask for a new invite.';
			break;						
		  case 5:vReason='You have been banned from the Group temporarily and access will automatically restore, once the ban time is up';
			break;
		}
		showAlert('Cannot join Group '+pGroupName+'. '+vReason);
	}
}

async function joinGroup(pInviterConnector,pGroupName,pInviterNickName){
	var vExistingGroupMember = getMember(pGroupName),
	vInviteeConnectorObject,
	vPar,
	vHDKey,
	vPublicKeyHex,	
	vInviterNickNameEncrypted;
	if (vExistingGroupMember){//Group member already joined via an earlier invite - connecting with the inviter	
		vInviteeConnectorObject = createConnectionObject(gFavs[vExistingGroupMember].ei,Object.keys(gFavs[vExistingGroupMember].ev).length);
		gFavs[vExistingGroupMember].ev[vInviteeConnectorObject.eo] = {eq:pInviterNickName,es:vInviteeConnectorObject.es};
		vHDKey = generatePrimaryHDKey().deriveChild(gFavs[vExistingGroupMember].ei),
		vPublicKeyHex = window.EthCrypto.util.uint8ArrayToHex(vHDKey.publicKey),	
		vInviterNickNameEncrypted = await anyEncrypt(vPublicKeyHex,pInviterNickName);//pPublicKey format: hex produced by window.EthCrypto.util.uint8ArrayToHex(vHDKey.publicKey), pMessage format: string		
		vPar = {
			ap: 70,//existing group member to join connection from another inviter (add_group_connection)
			eo: pInviterConnector, //INVITER CONNECTOR
			eq: vInviterNickNameEncrypted,//INVITER NICKNAME
			bq: vExistingGroupMember,//INVITEE MEMBER
			eu: vInviteeConnectorObject.eo, //INVITEE CONNECTOR ("eo" is common identifier for connectors, returned by "createConnectionObject" function. "eu" is invitee connector)
			ep: vInviteeConnectorObject.ep //INVITEE CONNECTOR PUBKEY
		};		
	}else{//becoming a new member of the Group
		var vMemberObject = generateMemberObject();
		cLog('function joinGroup vMemberObject.ei= '+vMemberObject.ei);//20220802 ERROR vMemberObject.ei undefined!
		vInviteeConnectorObject = createConnectionObject(vMemberObject.ei,0);
		gFavs[vMemberObject.bq] = {ei: vMemberObject.ei, n: pGroupName};
		gFavs[vMemberObject.bq].ev = {};
		gFavs[vMemberObject.bq].ev[vInviteeConnectorObject.eo] = {eq:pInviterNickName,es:vInviteeConnectorObject.es};
		vHDKey = generatePrimaryHDKey().deriveChild(gFavs[vMemberObject.bq].ei),
		vPublicKeyHex = window.EthCrypto.util.uint8ArrayToHex(vHDKey.publicKey),	
		vInviterNickNameEncrypted = await anyEncrypt(vPublicKeyHex,pInviterNickName);//pPublicKey format: hex produced by window.EthCrypto.util.uint8ArrayToHex(vHDKey.publicKey), pMessage format: string		
		vPar = {
			ap: 69,//create new member and join inviter's connection (similar to process 55 (create Channel member) but for Groups
			eo: pInviterConnector, //INVITER CONNECTOR
			eq: vInviterNickNameEncrypted,//INVITER NICKNAME
			bq: vMemberObject.bq,//INVITEE MEMBER
			ej: vMemberObject.ej,//INVITEE MEMBER PUBKEY
			eu: vInviteeConnectorObject.eo, //INVITEE CONNECTOR ("eo" is common identifier for connectors, returned by "createConnectionObject" function. "eu" is invitee connector)
			ep: vInviteeConnectorObject.ep //INVITEE CONNECTOR PUBKEY
			//ei: vMemberObject.ei,//MEMBER INDEX
		};
	}
	sendWS(vPar,-1,-1);		
}


/*function processChannelInvite(){//Obtains parameters from the received URL
	if(location.hash){//https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onhashchange
		var vHash = location.hash.substring(1);//20200616 //remove 1st symbol "#"
		vHash = vHash.split('&');//20210411 
		cLog('function processInvite location.hash: '+location.hash);
		cLog('function processInvite location.hash.substring(1): '+vHash[0]);
		cLog('function processInvite location.hash.substring(2): '+vHash[1]);
		//var vType = parseInt(location.hash.substring(2),10);
		var vType = parseInt(vHash[1],10);
		cLog('vType: '+vType);
		if(vType === 0){//shared channed 
			//gHR.newObject.n = decodeURIComponent(vHash);//20200614 CHANNEL NAME
			gHR.newObject.n = decodeURIComponent(vHash[0]);//20200614 CHANNEL NAME
			followChannelfromUri();
		}else if(vType === 1) {//shared homred
			//getHomredDetails(vHash);
			getHomredDetails(vHash[0],vHash[2]); //HomredId and Zoom (homred is shared)
		}//else if(vType === 2) {//show business button
			//getHomredDetails(vHash);
			//getHomredDetails(vHash[0],vHash[2]); //HomredId and Zoom
		//}
        setTimeout(function(){removeHash()},1000);		
	}
}*/

///////////////////////////////////////////////////////////////
//CHANNELS
/////////////////////////////
function splitEmojiFromName(pString){
	gHR.newObject.n = pString.trim();
	gHR.newObject.db = extractEmoji(gHR.newObject.n);
	if(gHR.newObject.db && gHR.newObject.db.length > 0){//if emoji found in search string
		gHR.newObject.n = gHR.newObject.n.replace(gHR.newObject.db,'');//remove emoji from search string
	}
	if(!gHR.newObject.n || gHR.newObject.n.length <1){
		delete gHR.newObject.n;
		return false;
	}
	return true;
}
//CHANNEL: REPLACE FAVICON WITH EMOJI, OR RESTORE FAVICON
function processEmoji(){
	var vInput = $(this).val();
	if(vInput && vInput.length > 0){
		vInput = vInput.trim();
		if(gEmoji.test(vInput)){			
			$('#hr_new_channel_favicon').html(createImage(vInput)).parent().width('10%');
			gHR.newObject.du = vInput;			
		}
		//var vStringArray = splitter.splitGraphemes(vInput),
		//vEmoji = null;
		/*if(vStringArray.length > 1){
			showAlert('Please enter one emoji only');
		}else*/ /*if(gEmoji.test(vStringArray[0])){
			$('#hr_new_channel_favicon').html(createImage(vStringArray[0]));
			gHR.newObject.du = vStringArray[0];
		}*/else{
			showAlert('Please enter one emoji');
		}
	}else{
		delete gHR.newObject.du;
		if(gHR.newObject.db && gHR.newObject.db !==0 /*&& gFavs[gHR.newObject.bq].db && $('#hr_new_channel_favicon').html()===''*/){//restore favicon, if exists
			$('#hr_new_channel_favicon').html(createImage(gHR.newObject.db)).parent().width('10%')//only if the current URL (and its favicon) has not been explicitly deleted
		}
		else{
			$('#hr_new_channel_favicon').html('').parent().width('0');
			showAlert('Group must have an icon: favicon from your website, or emoji');
		}
	}	
}
/////////////////////////////////////
function getChannelsList(){//searching for matching channels and only showing create button if no matching channels found
	cLog('function get Channels List() started');
	var vString = $(this).val(); //20220713 UNCOMMENT TO RESTORE CHANNEL TYPES
	if(!vString || !splitEmojiFromName(vString)){return}	
	var vPar = {
		be: gHR.newObject.n,
		db: gHR.newObject.db,
		cf: Object.keys(gFavs).join(','),
		ap: 31//process get_channels
	};
	sendWS(vPar,-1,-1);
}
//PROCESS 31 get list of channels
function listChannels(r){
	cLog('listChannels');
	var vCreateNewChannel = true, vChannelHtml = "", vTags,vFavicon/*, vChannelToFollowShow = false*/;
	if ($.isArray(r) && r.length && r.length > 0){//https://stackoverflow.com/questions/16350604/javascript-how-to-test-if-response-json-array-is-empty
		cLog('listChannels r.length = '+r.length);
		$.each( r, function ( i, val ) {
			if(val.dp && parseInt(val.en) !== 4){//excluding hidden and private channels
				vFavicon = val.db?createImage(val.db):''
				vTags = val.ck?'<span class="hr-channel-tags" style="font-size:small">'+val.ck+'</span>':'';
				vChannelHtml += 
					'<li data-channel-name="' + val.n + '" style="padding:0 0.5em">'+
						'<fieldset class="ui-grid-b">'+
							'<div class="ui-block-a" style="width:10%">'+
								'<span style="padding-top: 8px;padding-bottom: 0px;" class="ui-btn hr_channel_ch channel-favicon">'+vFavicon+'</span>'+
							'</div>'+	
							'<div class="ui-block-b" style="width:80%">'+
								'<span class="ui-btn hr_channel_ch" style="padding:0;font-weight:bold;text-align:left;margin-bottom:0">'+val.n+'</span>'+
								'<span class="ui-mini">#'+vTags+'</span>'+
							'</div>'+			
							'<div class="ui-block-c" style="width:10%">'+
								'<a href="#" style="padding:0;height: 2.7em;" class="ui-btn ui-btn-icon-notext ui-icon-channel hr_channel_ch"></a>'+
							'</div>'+
						'</fieldset>'+
					'</li>';
				//if(gEmoji.test(val.db||'')?val.db:''+val.n.toUpperCase() === gHR.newObject.n.toUpperCase()){vCreateNewChannel = false}//20210517 added check if emoji is part of channel name
			}
			if(val.n.toUpperCase() === gHR.newObject.n.toUpperCase() ){vCreateNewChannel = false}
		});	
	}
	if(gViewMode){//only show found channels when not creating a homred
		$("#channel_form_search_list").html(vChannelHtml).listview("refresh").trigger("updatelayout");
		if($("#channel_form_search_list").children().length > 0){$('#hr_channels_follow').show()}
		else{$('#hr_channels_follow').hide()}
	}
	
	if(vCreateNewChannel && !findInObject(gFavs,'n',gHR.newObject.n)){
		$('#channel_form_create').show();
		$('#channel_form_create').text('create channel "'+gHR.newObject.n+'"');
		//$('#channel_form_save').text('create channel');
		channelNameExists(false);//20220125
	}else{
		channelNameExists(true);
		$('#channel_form_create').hide();
		//$('#channel_form_edit, .hr-modal').hide();
		//$('#channel_form_save').text('create');
	}
}

function checkChannelName(){//check if name aleady exists when creating or editing channel
	var vName = $(this).val();
	if(vName && vName.length > 6){
		vName = vName.trim();
		if((gHR.newObject.bq && gFavs[gHR.newObject.bq].n !== vName)//editing channel and channel name is changing
			||
			!gHR.newObject.bq){// or new channel
			gHR.newObject.n = vName;//checkInput(vName);
			var vPar = {
					be: gHR.newObject.n,
					ap: 57//process check_channel_name
				};
			sendWS(vPar,-1,-1);
		}else{delete gHR.newObject.n}//channel name has not changed, delete, so that no change is triggered in database
	}else if(vName && vName.length > 0) {
		showAlert('Group name should be at least 7 characters');
	}
}

//PROCESS 57 check if name aleady exists when creating or editing channel
function channelNameExists(r){
  if(r){
	$('#channel_form_save').hide();
	$('#channel_name_exists').show();
  }else{
	$('#channel_form_save').show();
	$('#channel_name_exists').hide();
  }
}

////////////////////////////////
//PROCESS 43 get list of tags
function getTagsList(){//search for tags
	cLog('function get Tags List started');
	var vSelected = $(this).val() || $('#homred_form_tags').val();
	if(vSelected && vSelected.length > 2 /*&& !findInObject(gFavs,'n',vSelected)*/){
		var vPar = {
			be: vSelected,//tag search string
			ci: Object.keys(gSelectedTags).join('; '),//already selected tags
			ap: 43//process get tags
		};
		sendWS(vPar,-1,-1);		
	}
}
//from process 43 - show list of tags found by search
function listTags(r){
	var vTagHtml = "", $TagUl = $('#tag_form_search_list');
	if ($.isArray(r) && r.length){//https://stackoverflow.com/questions/16350604/javascript-how-to-test-if-response-json-array-is-empty
		$.each( r, function ( i, val ) {
			cLog('listing tag: '+val.ci);
			vTagHtml += '<li data-tag-name="' + val.ci + '" class="hr-tag">' + val.ci + '</li>';
		});	
	}
	$TagUl.html(vTagHtml);
	$TagUl.listview("refresh");
	$TagUl.trigger("updatelayout");
}
//add tag to the list of selected tags for channel
function addTag(pTag){
	var vTag = $(this).data("tag-name") || pTag;
	if(!gSelectedTags[vTag]){
		$('#tag_form_selected').append('<button class="ui-btn ui-shadow ui-corner-all ui-btn-icon-right ui-icon-delete hr-tag" data-tag-name="'+vTag+'">'+vTag+'</button>').enhanceWithin();	
		$('#tag_form_search_list').empty();
		$('#tag_form_search').val('');
		gSelectedTags[vTag]=null;//creating just the object key with the name of the Tag
		$('#tag_form_selected').on('click','button',function(){delete gSelectedTags[$(this).data('tag-name')]; $(this).remove();});
	}
}

////////////////////////////////////
function createChannel(){//shows channel form edit panel;	
	if(!isDesktop()){hideMenu()}
	//$('#remove_channel_filter').hide();
	$('#hr_edit_channel_text').hide();
	$('#hr_create_channel_text, #channel_form_edit, .hr-modal').show(); 
	//$('#channel_form_view').hide();
	$('#hr_new_channel_name').val(gHR.newObject.n);
}

function editChannel(){//shows channel form edit panel;
	//$('#remove_channel_filter').hide();
	$('#hr_create_channel_text').hide();
	$('#hr_edit_channel_text, #channel_form_edit, .hr-modal').show();
	//$('#channel_form_view').hide();
	gHR.newObject.bq = $(this).data('hr-member');
	delete gHR.newObject.en;//gHR.newObject.en = gFavs[gHR.newObject.bq].en;//do not explicitly set channel type, if it is not changing
	$('.hr-channeltype-sel').prop('checked', false).checkboxradio('refresh');
	$('.hr-channeltype-sel[value="'+gHR.newObject.en+'"]').prop('checked', true).checkboxradio('refresh');
	$('#hr_new_channel_name').val(gFavs[gHR.newObject.bq].n);
	if(gFavs[gHR.newObject.bq].au)$('#hr_new_channel_uri').val(gFavs[gHR.newObject.bq].au);
	if(gFavs[gHR.newObject.bq].s){$('#hr_new_channel_uri_title').show().text(gFavs[gHR.newObject.bq].s)}
	$('#hr_new_channel_favicon').html(createImage(gFavs[gHR.newObject.bq].db || gFavs[gHR.newObject.bq].du)).parent().width('10%');
	if (gFavs[gHR.newObject.bq].ck){
		var vTags = gFavs[gHR.newObject.bq].ck ? gFavs[gHR.newObject.bq].ck.split('; ') : null;
		if ($.isArray(vTags) && vTags.length){//https://stackoverflow.com/questions/16350604/javascript-how-to-test-if-response-json-array-is-empty
			$.each(vTags, function ( i, val ) {
				cLog('listing tag: '+val);
				addTag(val);
			});	
		}
	}
}

function clearChannelSearch(){
	cLog('start clear Channel Search');
	$('#channel_form_search_list').empty();//switch off is required as otherwise it is still in memory and leads to repeated calls 
	$('#hr_channels_follow').hide();
	$('#channel_form_search').val('');
	$('#channel_form_create').hide();
	$('#channel_form_edit, .hr-modal').hide();
	$('#channel_form_view').show();
	$('#hr_new_channel_name').val('');
	$('#hr_new_channel_uri').val('');
	$('#hr_new_channel_favicon').html('').parent().width('0');
	$('#hr_new_channel_emoji').val('');
	$('#tag_form_search_list').empty();
	$('#tag_form_search').val('');
	gSelectedTags = {};
	$('#tag_form_selected').empty();
	$('#hr_channels').filterable( "refresh" );
	//$('#hr_channels_other').filterable( "refresh" );
	$('#channel_form_save').show();
	$('#channel_name_exists').hide();
	$('#channel_form_header_text').text('Groups');
	$('.hr-uri-title').hide();
	//manageChannelDividers();
	$('.hr-channeltype-sel').prop('checked', false).checkboxradio('refresh');
}

function saveChannel(pSaveMyDefaultGroup){//sends new/edited channel to database;
  if(!pSaveMyDefaultGroup){//not creating the "default group" for quick posts (channel type 5)
	  //cLog('creating a default group');
	  //gHR.newObject.n = 'My Default Group';
	  
  //}else{
	  if(!$('#hr_new_channel_name').val() || $('#hr_new_channel_name').val().length < 7){//new channel must have name
		  showAlert('Please enter channel name of at least 7 characters');
		  return false;
	  }  
	  if(!$('#hr_new_channel_favicon').html() || $('#hr_new_channel_favicon').html() === ''){//new channel must have favicon
		  showAlert('Please add one emoji in channel name. It will become your channel logo. The logo will appear on all posts for this channel. Others will be able to recognise your posts on the map by your logo.');
		  return false;
	  }
	  if($('#tag_form_selected').children().length < 1){//new channel must have favicon
		  showAlert('Please add one or more tags.');
		  return false; 
	  }	  
  }
  
  if(gHR.newObject.bq){//EDIT existing channel
	/*gHR.newObject.au = $('.hr-uri:visible').val();
	if(gHR.newObject.au && gHR.newObject.au !== '' && gHR.newObject.au.substring(0,4) !== "http"){gHR.newObject.au='https://'+gHR.newObject.au}*/
	gHR.newObject.bu = true;
	
	//TAGS
	if((Object.keys(gSelectedTags).length === 0) && gFavs[gHR.newObject.bq].ck && gFavs[gHR.newObject.bq].ck !== ''){gHR.newObject.ck = '0'}//flag to remove existing tags from channel
	else if((Object.keys(gSelectedTags).join('; ') === gFavs[gHR.newObject.bq].ck) || Object.keys(gSelectedTags).join('; ') === ''){delete gHR.newObject.ck}//no change to tags, so do not send anything to database
	else{gHR.newObject.ck = Object.keys(gSelectedTags).join('; ')}
	
	var vPar = {
		ap: 58,//process edit channel
		bi: gHR.newObject.n,//channel name
		ci: gHR.newObject.ck,//tags
		au: gHR.newObject.au,//url link
		//s:  gHR.newObject.s,//url link title
		db: gHR.newObject.du,//only need to send emoji || gHR.newObject.db,//emoji takes precedence over favicon
		bq: gHR.newObject.bq, //member hash for edited channel only (calls different version of create_channel function)
		en: gHR.newObject.en //channel type
	};
	sendWS(vPar,gFavs[gHR.newObject.bq].ei,-1);
  }else {//new channel
    if(!gHR.newObject.en){//must select channel type
	    /*showAlert('Please choose channel type');//20220713 UNCOMMENT TO RESTORE CHANNEL TYPES
	    return false;*/
		if(pSaveMyDefaultGroup){gHR.newObject.en=5}//default group
		else{gHR.newObject.en=4}//20220713 COMMENT OUT TO RESTORE CHANNEL TYPES to be selected by users
    }  
	//$('#channel_form_search_list').empty();//switch off is required as otherwise it is still in memory and leads to repeated calls 
	var vUri = $('.hr-uri:visible').val();
	gHR.newObject.au = vUri && vUri.length > 4 ? vUri : null;
	if(gHR.newObject.au && gHR.newObject.au !== '' && gHR.newObject.au.substring(0,4) !== "http"){gHR.newObject.au='https://'+gHR.newObject.au}
	gHR.newObject.bu = true;
	gHR.newObject.ck = Object.keys(gSelectedTags);
	//var vLatestAddress = gFavs?Object.keys(gFavs).length:0;
	var vMemberObject = generateMemberObject();
	var vPar = {
		ap: 33,//process create channel
		bi: gHR.newObject.n,//channel name
		ci: (gHR.newObject.ck && gHR.newObject.ck.length >  0) ? gHR.newObject.ck.join('; ') : null,//tags
		au: gHR.newObject.au,//url link
		//s:  gHR.newObject.s,//url link title
		db: gHR.newObject.du,//only need to send emoji || gHR.newObject.db,//emoji takes precedence over favicon 
		ei: vMemberObject.ei,
		ej: vMemberObject.ej,
		bq: vMemberObject.bq,
		en: gHR.newObject.en //channel type
	};
	sendWS(vPar,-1,-1);
  }
  //only send if anything changed
  //if(!gHR.newObject.n && !gHR.newObject.au && !gHR.newObject.s && !gHR.newObject.db & !gHR.newObject.du && !gHR.newObject.ck){showAlert('no changes made')}
  //else{sendWS(vPar,-1,-1)}
  
  //clearChannelSearch();
}
//from process 33: create Fav; or from get Par
function processCreatedChannel(r,ei){//fav hash, member hash, owner hash, url, url title, url favicon
	if(r.do){//someone managed to create channel with same name between time 1st user found the free name and creating channel
		showAlert('sorry, someone has managed to create a channel with same name just now');
	}
	else if(r.dn){//duplicate address found in database - occurs when user previously unfollowed channels 
		gFavs[r.bq] = {'dn':true};//mark address as duplicate; not to be re-used
		var vMemberObject = generateMemberObject(true);
		var vPar = {
			ap: 33,//process create fav
			bi: gHR.newObject.n,//channel name
			ci: gHR.newObject.ck.join('; '),//tags
			au: gHR.newObject.au,//url link
			s:  gHR.newObject.s,//url link title
			db: gHR.newObject.db,//favicon,
			ei: vMemberObject.ei,
			ej: vMemberObject.ej,
			bq: vMemberObject.bq,
			en: gHR.newObject.en //channel type
		};
		sendWS(vPar,-1,-1);
		return;
	}
	else{
		//saves to memory, having received created channel from database or from url hash;//https://stackoverflow.com/questions/14187113/is-it-bad-practice-to-id-every-dynamically-created-element
		gFavs[r.bq] = {};//20210508 need to initialise object first
		gFavs[r.bq] = JSON.parse(JSON.stringify(gHR.newObject));
		gFavs[r.bq].ei = ei;
		gFavs[r.bq].en = parseInt(gFavs[r.bq].en,10);
		if(gFavs[r.bq].en === 5){//new "default" group for homred being created
			gHR.newObject.bq = r.bq;
		}
		else{//normal group/channel
			generateFav(r.bq,gHR.newObject.n,gHR.newObject.du || gHR.newObject.db,gHR.newObject.au,gHR.newObject.s,gHR.newObject.ck,true,false,false,true,true,gFavs[r.bq].en);
			//pMemberHash,pName,pFavicon,pUri,pUriTitle,pTags,pOwner,pNotif,pFiltered,pExpand,pVisible
			FavToggle();
			manageChannelDividersEnhance();
			showAlert('Group '+gHR.newObject.n+' created');
			clearChannelSearch();
			gHR.newObject = {};			
		}
		cryptoStoreSet('favs', Object.keys(gFavs).length);//just store number of channel members
		//localStorage.setItem('favs', Object.keys(gFavs).join(','));//20210304 required to avoid missing favs when browser crashes
		//localStorage.setItem('favs', JSON.stringify(gFavs));//20200616 required to avoid missing favs when browser crashes
		//cryptoStoreSet('favs', Object.keys(gFavs).join(','));//20210508 works ok
		checkRecordMnemonic(gCreateChannelInteractionWeight);//test if the right time to prompt user to record 12 words//gViewHomredInteractionWeight, gVoteHomredInteractionWeight, gFollowChannelInteractionWeight, gCreateChannelInteractionWeight
	}
}

//from process 58: edit channel
function processEditedChannel(pMemberHash){//fav hash, member hash, owner hash, url, url title, url favicon

	//saves to memory, having received created channel from database or from url hash;//https://stackoverflow.com/questions/14187113/is-it-bad-practice-to-id-every-dynamically-created-element
	//CHANNEL NAME
	if(gHR.newObject.n){
		gFavs[pMemberHash].n = gHR.newObject.n;
		$('#hr_fav'+pMemberHash+'name').text(gHR.newObject.n);
	}
	//EMOJI
	if(gHR.newObject.du && gHR.newObject.du !== '0'){//emoji changed 
		gFavs[pMemberHash].du = gHR.newObject.du;
		$('#hr_fav'+pMemberHash+'favicon').html(createImage(gHR.newObject.du));
	}
	//URI
	if(gHR.newObject.au && gHR.newObject.au !== '0'){//uri changed
		gFavs[pMemberHash].au = gHR.newObject.au;
		$('#hr_fav'+pMemberHash+'uri').show().text(gHR.newObject.au).attr('href',gHR.newObject.au);
		//URI TITLE
		if(gHR.newObject.s && gHR.newObject.s !== '0'){//uri title changed
			gFavs[pMemberHash].s = gHR.newObject.s;
			$('#hr_fav'+pMemberHash+'title').show().text(gHR.newObject.s);
		}
		//FAVICON
		if((!gHR.newObject.du || gHR.newObject.du !== '0') && gHR.newObject.db && gHR.newObject.db !== '0'){//no emoji and favicon changed 
			gFavs[pMemberHash].db = gHR.newObject.db;
			$('#hr_fav'+pMemberHash+'favicon').html(createImage(gHR.newObject.db));
		}
	}else if(gHR.newObject.au === 0){//uri was removed from channel
		delete gFavs[pMemberHash].au;
		delete gFavs[pMemberHash].s;
		delete gFavs[pMemberHash].db;
		$('#hr_fav'+pMemberHash+'uri').text('').hide();	
		$('#hr_fav'+pMemberHash+'title').text('').hide();	
		//$('#hr_fav'+pMemberHash+'favicon').html('');		
	}	
	//TAGS
	if(gHR.newObject.ck && gHR.newObject.ck !== '0'){//tags changed
		gFavs[pMemberHash].ck = gHR.newObject.ck;
		$('#hr_fav'+pMemberHash+'tags').text(gHR.newObject.ck).parent().show();
	}/*else if(gHR.newObject.ck === '0'){//tags removed
		delete gFavs[pMemberHash].ck;
		$('#hr_fav'+pMemberHash+'tags').text('').parent().hide();		
	}*/
	
	FavToggle();
	cryptoStoreSet('favs', Object.keys(gFavs).length);//just store number of channel members
	showAlert('Group '+gFavs[pMemberHash].n+' updated');
	//localStorage.setItem('favs', Object.keys(gFavs).join(','));//20210304 required to avoid missing favs when browser crashes
	//localStorage.setItem('favs', JSON.stringify(gFavs));//20200616 required to avoid missing favs when browser crashes
	clearChannelSearch();
	gHR.newObject = {};
}

/*function generateFav(r){
	var vNotif = r.aj?'-active':'',
	vFilterState = pFiltered?'':'-off',
	vFavicon = pFavicon?createImage(pFavicon):'',
	vFav =//https://stackoverflow.com/questions/18434367/jquery-mobile-enable-long-text-truncate
	
    '<li>
		<a href="#">
        	<img src="../_assets/img/album-bb.jpg" class="ui-li-icon ui-corner-none">
    		<h2>Broken Bells</h2>
    		<p>Broken Bells</p>
		</a>
        <a href="#purchase" data-rel="popup" data-position-to="window" data-transition="pop">Purchase album</a>
    </li>'	
	
	'<fieldset data-filtertext="'+pName+'" class="ui-grid-c" style="padding:10px">'+
		'<div class="ui-block-a" style="width:10%">'+
			'<a href="#" data-mhash="'+pMemberHash+'" style="padding:0" class="ui-btn toggle-create-homred">'+vFavicon+'</a>'+
		'</div>'+	
		'<div class="ui-block-b" style="width:70%">'+
			'<a href="#" data-mhash="'+pMemberHash+'" style="line-height:0.4;text-align:left;font-weight:normal" class="ui-btn toggle-create-homred">'+pName+'</a>'+
		'</div>'+				
		'<div class="ui-block-c" style="width:10%">'+
			'<a href="#" data-mhash="'+pMemberHash+'" class="ui-btn ui-btn-icon-notext channel-filter ui-icon-channel-filter'+vFilterState+' channel-element-hide"></a>'+
		'</div>'+					
		'<div class="ui-block-d" style="width:10%">'+
			'<a href="#" data-mhash="'+pMemberHash+'" class="ui-btn ui-btn-icon-notext hr-notif ui-icon-69'+vNotif+' channel-element-hide"></a>'+
		'</div>'+ 
	'</fieldset>';	
	$('#hr_channels').append(vFav);
}*/
 
function generateFav(pMemberHash,pName,pFavicon,pUri,pUriTitle,pTags,pOwner,pNotif,pFiltered,pExpand,pVisible,pChannelType){// pMemberHash,pName,pFavicon,pOwner,pNotif,pFiltered,pExpand
	cLog('generateFav function start');
	  var vOwner = pOwner ? '' : 'display:none; ',
	  vChannelOwnerClass = pOwner ? ' hr-channel-owner' : '',
	  vNotif = pNotif?'-active':'',
	  vFilterState = pFiltered?'':'-off',
	  vFavicon = pFavicon ? createImage(pFavicon):'',
	  vUri = pUri ? '' : 'display:none; ',
	  vUriTitle = pUriTitle ? '' : 'display:none; ',
	  //vTags = pTags && pTags !==''?'<li style="padding-left:5px"><a href="#" id="hr_fav'+pMemberHash+'tags" class="ui-btn ui-btn-icon-left ui-icon-tag" style="font-weight:normal">'+pTags+'</a></li>':'', 
	  vVisibilityIcon = pVisible ? 'ui-icon-pause' : 'ui-icon-resume',
	  vVisibilityClass = pVisible ? 'hr-channel-visibility' : 'hr-channel-visibility-hidden',
	  vFav='<div id="hr_fav'+pMemberHash+'" data-fav_hash="'+pMemberHash+'" data-role="collapsible" data-filtertext="'+pName+'" data-inset="false" class="hr_channel'+vChannelOwnerClass+'" data-collapsed-icon="false" data-expanded-icon="false"><h3>'+
					'<fieldset class="ui-grid-c '+vVisibilityClass+'">'+
						'<div class="ui-block-a" style="width:10%">'+//https://stackoverflow.com/questions/18434367/jquery-mobile-enable-long-text-truncate
							'<a href="#" id="hr_filter'+pMemberHash+'" data-mhash="'+pMemberHash+'" style="padding:0;height: 2.7em;" class="ui-btn ui-btn-icon-notext channel-filter ui-icon-channel-filter'+vFilterState+' hr_channel_ch channel-element-hide '+vVisibilityClass+'"></a>'+							
						'</div>'+					
						'<div class="ui-block-b" style="width:10%">'+
							'<span id="hr_fav'+pMemberHash+'favicon" data-member-hash="'+pMemberHash+'" style="padding-top: 8px;padding-bottom: 0px;" class="ui-btn hr_channel_ch toggle-create-homred '+vVisibilityClass+'">'+vFavicon+'</span>'+
						'</div>'+	
						'<div class="ui-block-c" style="width:70%">'+
							'<span id="hr_fav'+pMemberHash+'name" data-member-hash="'+pMemberHash+'" class="ui-btn hr_channel_ch toggle-create-homred '+vVisibilityClass+'" style="padding:0;font-weight:bold">'+pName+'</span>'+
							'<span id="hr_fav'+pMemberHash+'tags" data-member-hash="'+pMemberHash+'" class="ui-mini '+vVisibilityClass+' toggle-create-homred" style="font-weight:normal;margin:0;color:black;text-shadow:none">#'+pTags+'</span>'+
						'</div>'+				
						/*'<div class="ui-block-d" style="width:10%">'+
							'<a href="#" id="hr_create'+pMemberHash+'" data-member-hash="'+pMemberHash+'" style="'+vOwner+'padding:0;height: 2.7em;" class="hr-create ui-btn ui-btn-icon-notext ui-icon-post hr_channel_ch">create</a>'+
						'</div>'+*/				
						'<div class="ui-block-d" style="width:10%">'+
							'<a href="#" id="hr_notif'+pMemberHash+'" data-notif-hash="'+pMemberHash+'" style="padding:0;height: 2.7em;" class="hr-notif ui-btn ui-btn-icon-notext ui-icon-69'+vNotif+' hr_channel_ch channel-element-hide '+vVisibilityClass+'"></a>'+
						'</div>'+
					'</fieldset></h3>'+
					'<ul data-role="listview" class="hr-ul-custom channel-element-hide">'+
						'<a href="'+pUri+'" id="hr_fav'+pMemberHash+'uri" style="'+vUri+'margin:0;font-weight:normal;text-align:left;" class="ui-btn">'+pUri+'</a>'+
						'<span id="hr_fav'+pMemberHash+'title" style="'+vUriTitle+'margin:0;font-weight:normal;text-align:left;" class="ui-btn">'+pUriTitle+'</span>'+
						//vTags+
						/*'<li style="'+vUri+'padding-left:5px"><a href="#" id="hr_validate_'+pMemberHash+'" data-member-hash="'+pMemberHash+'" class="ui-btn ui-btn-icon-left ui-icon-validate" style="font-weight:normal">Diplay logo on map</a></li>'+*/
						//'<li style="'+vOwner+'padding-left:5px"><a href="#" id="hr_create_'+pMemberHash+'" data-member-hash="'+pMemberHash+'" class="ui-btn" style="font-weight:normal;padding: 0 0 0 35px;margin-bottom:-25px;"><span>'+vFavicon+'</span>Post to channel (0 posts)</a></li>'+
						/*'<li style="'+vOwner+'padding-left:5px"><a href="#" id="hr_meta_'+pMemberHash+'" data-meta-hash="'+pMemberHash+'" class="hr-meta ui-btn ui-btn-icon-left ui-icon-restore hr-channel-details">Refresh Web Logo/Title (last refreshed)</a></li>'*/
						'<li style="padding-left:5px"><a href="#" id="hr_create_'+pMemberHash+'" data-member-hash="'+pMemberHash+'" class="ui-btn ui-btn-icon-left ui-icon-post hr-channel-details">Post to channel (0 posts)</a></li>'+
						'<li style="padding-left:5px"><a href="#" id="hr_notif_'+pMemberHash+'" data-notif-hash="'+pMemberHash+'" class="hr-notif-d ui-btn ui-btn-icon-left ui-icon-69'+vNotif+' hr-channel-details">Get notifications (0 enabled notifications)</a></li>'+
						'<li style="padding-left:5px"><a href="#" id="hr_fav_members_total'+pMemberHash+'" data-member="'+pMemberHash+'" class="hr-members ui-btn ui-btn-icon-left ui-icon-member hr-channel-details" data-hr-channel-name="'+pName+'">Members (total: 0)</a></li>'+
						'<li style="padding-left:5px"><a href="#" id="hr_fav_dislikes_total'+pMemberHash+'" class="ui-btn ui-btn-icon-left ui-icon-dislike hr-channel-details" data-fav-hash="'+pMemberHash+'">Dislikes for group posts 0</a><div id="dislike_port_channel'+pMemberHash+'"></div></li>'+
						'<li style="'+vOwner+'padding-left:5px"><a href="#" class="hr-channel-manage ui-btn ui-btn-icon-left '+vVisibilityIcon+' hr-channel-details" data-fav-hash="'+pMemberHash+'">'+(pVisible?'Hide group':'Unhide group')+'</a></li>'+
						'<li style="padding-left:5px"><a href="#" id="hr_fav_members_left'+pMemberHash+'" class="hr-leave ui-btn ui-btn-icon-left ui-icon-delete hr-channel-details" data-fav-hash="'+pMemberHash+'">'+(pOwner?'Delete group':'Leave group')+' (0 left)</a></li>'+
						'<li style="'+vOwner+'padding-left:5px"><a href="#" class="hr-edit ui-btn ui-btn-icon-left ui-icon-edit hr-channel-details" data-hr-member="'+pMemberHash+'">Edit group</a></li>'+
					'</ul>'+	
				'</div></div>';	
		//$('hr_fav'+pMemberHash).collapsible();				
	  //if(pOwner /*|| pChannelType === 4*/){
		  $('#hr_channels').append(vFav);//.enhanceWithin();		
		  //$('#hr_channels_own_label').show();
	  //}
	  /*else{
		  $('#hr_channels_other').append(vFav);//.enhanceWithin();
		  //$('#hr_channels_other_lable').show();
	  }*/
	  $('#hr_filter'+pMemberHash).on('click', function(e){e.stopPropagation();manageChannelFilter(e)});
	  $('#hr_notif'+pMemberHash).on('click',function(e){e.stopPropagation();toggleNotif(e)});//https://stackoverflow.com/questions/7031226/jquery-checkbox-change-and-click-event
	  $('#hr_notif_'+pMemberHash).on('click',function(e){toggleNotif(e)});//https://stackoverflow.com/questions/7031226/jquery-checkbox-change-and-click-event
	  $('#hr_fav_dislikes_total'+pMemberHash).on('click',function(){toggleDislikeMenu(pMemberHash)});
	  if(pOwner || pChannelType === 4){
		$('#hr_create_'+pMemberHash).on('click',function(){CreateHomredPromptPlace(pMemberHash)});
		//$('#hr_fav'+pMemberHash+'favicon, #hr_fav'+pMemberHash+'name, #hr_fav'+pMemberHash+'tags').on('click',function(e){if($(this).hasClass('create-homred')){e.stopPropagation();CreateHomredPromptPlace(pMemberHash)}});
		//$('.create-homred').on('click',function(e){e.stopPropagation();CreateHomredPromptPlace(e)});//does not work
		$('#hr_fav'+pMemberHash+'favicon, #hr_fav'+pMemberHash+'name, #hr_fav'+pMemberHash+'tags').on('click',function(e){if($(this).hasClass('create-homred')){e.stopPropagation();CreateHomredPromptPlace(pMemberHash)}});
		//https://stackoverflow.com/questions/7031226/jquery-checkbox-change-and-click-event
		//$('.create-homred').on('click',function(e){e.stopPropagation();CreateHomredPromptPlace(pMemberHash)});//https://stackoverflow.com/questions/7031226/jquery-checkbox-change-and-click-event
		//https://stackoverflow.com/questions/7031226/jquery-checkbox-change-and-click-event
	  }
	  //$('#hr_fav'+pMemberHash+'favicon').on('click',function(e){if($(this).hasClass('create-homred')){e.stopPropagation();CreateHomredPromptPlace(pMemberHash)}});	  
		//checkRecordMnemonic(pOwner?gCreateChannelInteractionWeight:gFollowChannelInteractionWeight);//gViewHomredInteractionWeight, gVoteHomredInteractionWeight, gFollowChannelInteractionWeight, gCreateChannelInteractionWeight
}

async function processConfirmedConnectors(pMember,r){	
	var vConnectorIndex;
	// defining the "connectors" iterator generator
	r[Symbol.asyncIterator] = async function* () {
		let r=this, g = r.length;
		while (g--){
			yield r[g].ev;
		}
	}
	//calling the "connections" iterator generator
	for await (const c of r) {
		cLog('calling the "connections" iterator generator: INVITER CONNECTOR c.eo= '+c.eo);
		cLog('calling the "connections" iterator generator: NAME c.eo= '+c.eq);
		cLog('calling the "connections" iterator generator: OBJECT= '+JSON.stringify(c));
		c.es = parseInt(gFavs[pMember].ev[c.eo].es,10);
		cLog('Conector Index: '+c.es);
		c.eq = await anyDecrypt(generatePrimaryHDKey().deriveChild(gFavs[pMember].ei).privateKey,c.eq);
		cLog('nickName: '+c.eq);
		gFavs[pMember].ev[c.eo] = JSON.parse(JSON.stringify(c));
		delete gFavs[pMember].ev[c.eo].eo; 
	}
	showMembers(pMember);
}
function showMembers(pMember){
	gHR.gActiveMember = pMember;//channel/group level member
	var vFavicon = gFavs[pMember].db ? createImage(gFavs[pMember].db):'';
	$('#hr_members_list').empty();
	$('#hr_fav_favicon').html(vFavicon);
	$('#hr_fav_name').text(gFavs[pMember].n);
	$.each(gFavs[pMember].ev, function(i,item){
		$('#hr_members_list').append(
		'<li style="padding:0">'+
			'<fieldset class="ui-grid-a">'+
				'<div class="ui-block-a" style="width:80%">'+
					'<a href="#" id="hr_member'+i+'" data-member="'+i+'" class="ui-btn hr-group-member ui-btn-noicon">'+item.eq+'</a>'+
				'</div>'+
				'<div class="ui-block-b" style="width:20%">'+
					'<a href="#" id="hr_member_messages'+i+'" data-member="'+i+'" class="hr-messages ui-btn ui-btn-notext ui-icon-comment ui-btn-icon-right">'+
					'<span id="hr_member_messages_count'+i+'" class="ui-li-count" style="border:none;background:transparent">'+item.fd+'</span></a>'+
				'</div>'+
			'</fieldset>'+
			'<div id="member_details_port'+i+'"></div>'+
		'</li>'
		);			
	});
	$('#hr_members_list').listview('refresh');
	if($('#hr_members_list').children(':visible').length>7){$('#members_filter').parent().show()}
	else{$('#members_filter').parent().hide()}
	$('.hr-modal').show();
	$('#hr_members').slideDown();
}

function hideMembers(){
	$('#hr_member_details_default_port').append($('#hr_member_details'));
	$('#hr_member_details').hide();
	$('#hr_members').slideUp();
	$('.hr-modal').hide();
}

function showMemberDetails(){
	var vThis = $(this);
	//cLog('function show Member Details started');
	if($('#hr_member_details').is(':visible') && $('#hr_member_details').parent().attr('id') === $('#member_details_port'+vThis.data('member')).attr('id')){
		hideMemberDetails();
		gHR.gActiveConnector = null;
		
	}
	else{
		//cLog('function show Member Details started - showing');
		//gHR.gActiveMember = 
		gHR.gActiveConnector = vThis.data('member');		
		$('#member_details_port'+gHR.gActiveConnector).append($('#hr_member_details'));
		$('.hr-member-status').hide();
		//cLog('function show Member Details - gHR.gActiveConnector= '+gHR.gActiveConnector);		
		//cLog('function show Member Details - gFavs[gHR.gActiveMember].ev[vThis.data(member)].et= '+gFavs[gHR.gActiveMember].ev[vThis.data('member')].et);
		switch(parseInt(gFavs[gHR.gActiveMember].ev[gHR.gActiveConnector].et,10)){
		  case 0://pending invite; wait or re-send same invite (and re-set expiry timer)
			$('#hr_member_reinvite').show();
			break;
		  case 1://revoked pending invite; cancel revoke (set cr_inviter_revoked to null and and re-set expiry timer)
			$('#hr_member_restore').show();
			break;
		  case 2://expired; re-send same invite (and re-set expiry timer)
			$('#hr_member_reinvite').show();
			break;
		  case 3://banned member has not left group; cancel ban before memeber left
			$('#hr_member_unban_unban').show();
			break;
		  case 4://banned member has left group; cancel ban and re-send original invite (and re-set expiry timer)
			$('#hr_member_unban_reinvite').show();
			break;
		  case 5://revoked member has not left group; cancel revoke before memeber left
			$('#hr_member_restore').show();
			break;
		  case 6://revoked member has left group; cancel revoke and re-send original invite (and re-set expiry timer)
			$('#hr_member_restore_reinvite').show();
			break;
		  case 7://memebr just left on his/her own; re-send original invite and re-set timer
			$('#hr_member_reinvite').show();
			break;
		  case 8://active member: message, ban, revoke
			$('#hr_member_ban,#hr_member_remove,#hr_member_related,#hr_member_reinvite').show();
			break;
		  case 9://unknown existing member invited by others
			$('#hr_member_identify,#hr_member_reinvite').show();
			break;
		  case 10://unknown existing member invited by others
			$('#hr_member_related,#hr_member_reinvite').show();
			break;
		}
		$('#hr_member_details').slideDown();
	}
}
/*function showMemberDetails(){
	var vThis = $(this);
	if(!$('#hr_member_details').is(':visible')){
		$('#member_details_port'+vThis.data('member')).append($('#hr_member_details'));
		$('#hr_member_details').slideDown();
	}
	else{
		if($('#hr_member_details').parent().attr('id') === $('#member_details_port'+vThis.data('member')).attr('id')){
			hideMemberDetails();			
		}
		else{
			//hideMemberDetails();
			$('#member_details_port'+vThis.data('member')).append($('#hr_member_details'));
			$('#hr_member_details').slideDown();
		}
	}
}*/

function hideMemberDetails(){
	//cLog('function hide Member Details started');
	$('#hr_member_details').slideUp();
	$('.hr-member-status').hide();
}

function getPrivateMessages(){
	gHR.gActiveConnector = $(this).data('member');	
	$('#hr_members').hide();
	$('#hr_messages_nickname').text(gFavs[gHR.gActiveMember].ev[gHR.gActiveConnector].eq);	
	//$('#hr_messages').show();	
	sendWS(
		{ap: 71},
		gFavs[gHR.gActiveMember].ei,//depth 5 (member) index
		gFavs[gHR.gActiveMember].ev[gHR.gActiveConnector].es //depth 6 (connector) index
	);
}

async function showPrivateMessages(r){
	let vClass, vMessage, vDecriptedMessage;
	$('#hr_messages_list').empty();
	// defining the "messages" iterator generator
	r[Symbol.asyncIterator] = async function* () {
		let r=this, g = r.length;
		while (g--){
			yield r[g].fe;
		}
	}
	//calling the "messages" iterator generator
	for await (const c of r) {
		generateMessage(c);	
	}	
	$('#hr_messages_list').listview('refresh');
	$('#hr_messages').show();
}

async function showNewPrivateMessage(r){
	if(r.ff){$('#hr_new_message').val('')}
	generateMessage(r);
}

async function generateMessage(c){
	let vMessage = c.ff ? c.fh : c.ez,//for own message - shoose the message version encrypted with own pubkey
	vDecriptedMessage = await anyDecrypt(generatePrimaryHDKey().deriveChild(gFavs[gHR.gActiveMember].ei).deriveChild(gFavs[gHR.gActiveMember].ev[gHR.gActiveConnector].es).privateKey,vMessage),
	vClass = c.ff ? 'hr-my-message' : 'hr-other-message';
	vDecriptedMessage = replaceURLs(vDecriptedMessage,vClass);
	$('#hr_messages_list').append(
	'<li style="padding:0">'+
		'<span id="hr_member'+c.ey+'" class="ui-btn hr-group-member ui-btn-noicon '+vClass+'">'+vDecriptedMessage+'</span>'+
		'<span class="ui-mini '+vClass+'-time">'+formatTimeHomred((Date.parse(c.fa)/1000),null)+'</span>'+		
	'</li>'
	);		
}

function hidePrivateMessages(){
	$('#hr_members').show();
	$('#hr_messages').slideUp();
	$('#hr_messages_nickname').text('Nickname');
	sendWS({//remove expects (closing private messages window) for new messages
		ap: 77,
		eo: gHR.gActiveConnector,
		fg: false //live expect (not a push expect)
	},-1,-1);
}

async function sendPrivateMessage(){
	let vMessageText = $('#hr_new_message').val();
	if(vMessageText && vMessageText != ''){
		let vHDKey = generatePrimaryHDKey().deriveChild(gFavs[gHR.gActiveMember].ei).deriveChild(gFavs[gHR.gActiveMember].ev[gHR.gActiveConnector].es),
		vPublicKeyHex = window.EthCrypto.util.uint8ArrayToHex(vHDKey.publicKey),		
		vEncryptedMessageText = await anyEncrypt(gFavs[gHR.gActiveMember].ev[gHR.gActiveConnector].ep,vMessageText),//pPublicKey format: hex produced by 
		vEncryptedMessageTextSender = await anyEncrypt(vPublicKeyHex,vMessageText);//pPublicKey format: hex produced by window.EthCrypto.util.uint8ArrayToHex(vHDKey.publicKey), pMessage format: string
		sendWS({
			ap: 79,
			ez: vEncryptedMessageText,// message for the other user, encrypted with his pubkey
			fh: vEncryptedMessageTextSender// message for the sender, encrypted with sender's pubkey, so that sender could decrypt his own messages with his own privkey
		},
		gFavs[gHR.gActiveMember].ei,//depth 5 (member) index
		gFavs[gHR.gActiveMember].ev[gHR.gActiveConnector].es //depth 6 (connector) index
		);		
	}
}

/*function manageChannelDividers(){//https://stackoverflow.com/questions/9685921/jquery-mobile-data-filter-in-case-of-no-result
	if($('#hr_channels_own').children(':visible').length === 0){$('#hr_channels_own').hide()}
	else{$('#hr_channels_own').show()}
	if($('#hr_channels_other').children(':visible').length === 0){$('#hr_channels_other').hide()}
	else{$('#hr_channels_other').show()}
	if($('#hr_channels_follow').children(':visible').length === 0){$('#hr_channels_follow').hide()}
	else{$('#hr_channels_follow').show()}
}*/

///////////////////////////////////////////////////////////////
//PROCESS 40
function updateFavStats(r,pMemberHash){
	if(r){
		$('#hr_fav_members_total'+pMemberHash).text('Members ('+r.bf+' total)');
		$('#hr_fav_members_left'+pMemberHash).text((gFavs[pMemberHash].bu ? 'Delete group':'Leave group')+' ('+r.ca+' left)');
		$('#hr_create_'+pMemberHash).text('Post to group ('+r.by+' posts)');
		$('#hr_fav_dislikes_total'+pMemberHash).text('Dislikes '+r.dr);
		$('#hr_notif_'+pMemberHash).text('Get notifications ('+r.dz+' enabled notifications)');
	}
}
//PROCESS 46 - confirm channels still exist and get info for generating channels on client
function confirmFavs(){
	cLog("started confirm favs function");
	sendWS({		
		cm: Object.keys(gFavs).join(','),
		ap: 46
	},-1,-1); 
}

//PROCESS 75 - check connectors for a member: get connectors (and connections) - when opening members window
function getConnectors(){
	let vMember = $(this).data('member'),
	vTotalConnectors = parseInt(gFavs[vMember].fc,10),
	vConnectorObject;
	cLog('vTotalConnectors: '+vTotalConnectors);
	if(vTotalConnectors > 0 && !gFavs[vMember].ev){//connectors exist, but have not been obtained from DB yet
		for (let vConnectorIndex = 0; vConnectorIndex < vTotalConnectors; vConnectorIndex++){
			cLog('vConnectorIndex: '+vConnectorIndex);
			vConnectorObject = createConnectionObject(gFavs[vMember].ei,vConnectorIndex);
			cLog('vConnectorObject address: '+vConnectorObject.eo);
			if(!gFavs[vMember].ev){gFavs[vMember].ev={}}//if 1st iteration of the loop, when gFavs[vMember].ev object is not created yet
			gFavs[vMember].ev[vConnectorObject.eo] = {
				es:vConnectorIndex
			};
		}
		if(!!Object.keys(gFavs[vMember].ev).length){	
			cLog('total connections for member '+vMember+': '+Object.keys(gFavs[vMember].ev).length);
			sendWS({
				bq: vMember,
				ev: Object.keys(gFavs[vMember].ev).join(','),
				ap: 75
			},-1,-1); 
		}		
	}
	else{showMembers(vMember)}
}

////////////////////////////////////////////////////////
//Dislikes
function toggleDislikeMenu(pMemberHash){//pMemberHash - channel; null - homred;
	if($('#dislike_menu').is(':visible')){
		$('#dislike_menu').slideUp();		
		//gHR.currentMember = null;
		$('#hr_dislike').removeClass('hr-dislike-theme');
	}else{		
		if(pMemberHash){//channel's homreds aggregated dislikes
			sendWS({//get all channel's homreds' dislikes data
				bq: pMemberHash,
				ap: 65
			},-1,-1);
		}else{//homred's dislikes
			$('#dislike_port_homred').append($('#dislike_menu'));
			$('#dislike_menu').slideDown();
			$('#hr_dislike').addClass('hr-dislike-theme');			
		}
	}
}
//from process 65 
function updateChannelDislikeStats(r,pMemberHash){
	if(r.length > 0){
		$('.hr-dislike').removeClass('active-dislike');	
		$('.hr-dislike > span').text('0');
		$.each( r, function ( i, val ) {
			cLog('listing dislikes for channel: '+val.dq);
			$('[data-hr-action="'+val.as+'"] > span').text(val.dr);
			if(val.dg === 1){//own action - activate icon
				$('.ui-icon-3').removeClass('ui-icon-3').addClass('ui-icon-3-active');//dislike button for showing total dislikes and toggling dislike menu
				$('*[data-hr-action="'+val.as+'"]').addClass('active-dislike');
			}
		});	
		$('#dislike_port_channel'+pMemberHash).append($('#dislike_menu'));
		$('#dislike_menu').slideDown();
		$('#hr_dislike').addClass('hr-dislike-theme');	
	}
}
////////////////////////////////////////////////////////

//PROCESS 59 - confirm single address exists when restoring data and get info for generating channels' UI (if channel has been explicitly subscribed to and has not been deleted)
function confirmAddress(){
	cLog("started confirm address function");
	//var vLatestAddress = gFavs?Object.keys(gFavs).length:0; 
	//cLog('function "confirm Address": vLatestAddress is '+vLatestAddress);
	let vNewMemberObject = generateMemberObject(/*true*/);
	sendWS({		
		//cm: Object.keys(gFavs).join(','),
		bq: vNewMemberObject.bq,//20220131 - added true
		//cm: pFavs||localStorage['favs'],//20210304
		ei: vNewMemberObject.ei,
		ap: 59
	},-1,-1); 
}
//response from process 59 - restoring all Addresses
function recordConfirmedAddress(pAddress,pMemberIndex,pActive){ 
	cLog('function "record Confirmed Address": pAddress is '+pAddress);
	if(pAddress/* && pAddress !== '-'*/){
		gFavs[pAddress] = {'ei' : pMemberIndex, 'dl': true, dk: pActive, n: 'free'};//20220131 needed to add a "free" name to the "Fav" object propery, to prevent indefinite loop during address generation
		confirmAddress();		
	}else{//identified all previously generated client's addresses (client's memberships for created or followed channels) 
		gAllAddressesRestored = 1;
		if(!!Object.keys(gFavs).length){confirmFavs()}//https://ultimatecourses.com/blog/checking-if-javascript-object-has-keys
		//else{saveChannel(true)}//create "My Default Group" if there are no other groups/channels
	}
}
//PROCESS 56 - follow channel for which membership already created via viewing channel's homred
function followPreviewedChannel(pMemberHash){
	cLog("started follow Previewed Channel function");
	sendWS({
		bq: pMemberHash,//|| getMember(gHR.viewedHomred.n),
		ap: 56
	},-1,-1);
	$("#hr_chann").hide();
	$('.ui-icon-channel').removeClass('ui-icon-channel').addClass('ui-icon-channel-active');
	setTimeout(function(){$('.ui-icon-channel-active').removeClass('ui-icon-channel-active').addClass('ui-icon-channel')},2000);
}

async function processConfirmedFavs(r){	
	var vMemberIndex, vConnectorIndex;
	// defining the "members" iterator generator
	r[Symbol.asyncIterator] = async function* () {
		let r=this, g = r.length;
		while (g--){
			yield r[g];
		}
	}
	//calling the "members" iterator generator
	for await (const m of r) {
		cLog('r[m].n: '+m.n);		
		vMemberIndex = gFavs[m.bq].ei;//this is needed as the whole gFavs[m.bq] object get overwritten at the next step
		cLog('Index: '+vMemberIndex);//works correctly
		gFavs[m.bq] = JSON.parse(JSON.stringify(m));
		gFavs[m.bq].ei = vMemberIndex;
		gFavs[m.bq].en = parseInt(gFavs[m.bq].en,10);
		gFavs[m.bq].fa = parseInt(gFavs[m.bq].fa,10);
		//gFavs[m.bq].dh = true;//explicitly followed channel
		delete gFavs[m.bq].bq; //to avoid repetition, member hash (bq) is already the name of the object
		if(m.dh){//20210527 only for explicitly followed channles (any unfollowed channels will not be generated, but will remain in gFavs)
			//generateFav(m.bq,m.n,m.db,m.au,m.s,m.ck,m.bu,m.aj,gFavs[m.bq].m,false,m.dp,gFavs[m.bq].en);//20220730 DELAY UNTIL CHANNEL OPEN 
			//pMemberHash,pName,pFavicon,pUri,pUriTitle,pTags,pOwner,pNotif,pFiltered,pExpand,pVisible
			gFavs[m.bq].dh = true;//explicitly followed channel
		}
	}
	if(ChannelsOpen()){generateFavs()}
	BoundsChanged(3,'on processConfirmedFavs completed');
}

function manageChannelDividersEnhance(){
	cLog('start manage Channel Dividers Enhance');
	if($('#hr_channels').children().length>0){
		//$('#hr_channels_own_label').show();
		$('#hr_channels').enhanceWithin();
	}
	//else{$('#hr_channels_own_label').hide()}
	/*if($('#hr_channels_other').children().length>0){
		//$('#hr_channels_other_label').show();
		$('#hr_channels_other').enhanceWithin();
	}*/
	//else{$('#hr_channels_other_label').hide()}	
}
/////////////////////////////////////////////////////////////
//SUPPLEMENTARY

function findInObject(pObject,pSearchAttribute,pSearchValue) {//https://codereview.stackexchange.com/questions/73714/find-a-nested-property-in-an-object
    //main part
    if(pObject && pObject[pSearchAttribute] && pObject[pSearchAttribute].toString().toUpperCase() === pSearchValue.toString().toUpperCase()){
      return pObject;
    }
    var result, p; 
    for (p in pObject) {
        if( pObject.hasOwnProperty(p) && typeof pObject[p] === 'object' ) {
            result = findInObject(pObject[p],pSearchAttribute,pSearchValue);
            if(result){
                return result;
            }
        }
    }
    return result;
}



function removeHash(){history.pushState("", document.title, window.location.pathname+window.location.search)}//20180311 https://stackoverflow.com/questions/1397329/how-to-remove-the-hash-from-window-location-url-with-javascript-without-page-r/5298684#5298684

///////////////////////////////////////////////////////////////////////////////////////////////////
//MAPS
async function getSavedMapPosition(){
	cLog('started get Saved Map Position');
	var vFav = JSON.parse(localStorage.getItem('savedmap'));
	if(vFav){
		gHR.mapView = vFav.cmap;
		//if(gHR.mapView/* && vFav.lat && vFav.lon && vFav.z*/){//causes Map to disappear sometimes
			//$('#hr_mode_btn').removeClass('ui-icon-hr-earth').addClass('ui-icon-hr-earth-active');
			//$("#list-canvas").hide();
			//$("#hr_map").show();
			//$('#hr_search').slideDown();
			//$('#homred_form_place').show();			
			gHR.lat  = vFav.lat;
			gHR.lon  = vFav.lon;
			gHR.z    = vFav.z;
			gHR.country = vFav.country;
		/*}else{
			$('#hr_mode_btn').removeClass('ui-icon-hr-earth-active').addClass('ui-icon-hr-earth');
			$("#list-canvas").show();
			$("#hr_map").hide();
			$('#hr_search').slideUp();
			//$('#homred_form_place').hide();				
		}*/     
	}	
}

/*function ShowMarker(pLoc, pHomred, pEmoji, pFavicon) {
	//gHR.returnedHomreds.pHomred = {}
	var MarkerOptions = {id: parseInt(pHomred,10)};
	if(pEmoji){MarkerOptions.icontype = 'e'}
	else if(pFavicon){MarkerOptions.icontype = 'f'}
	var Marker = L.marker([pLoc[0],pLoc[1]],MarkerOptions);
	gMarkers.push(Marker);
	return Marker;
}*/
function ShowMarker(pLoc, pHomred, pEmoji, pFavicon) {
	var vIcon, vIconType;
	if(pFavicon){
		vIcon = createImageIcon(pFavicon);
		vIconType = 'f';
	}
	var MarkerOptions = {
		id: parseInt(pHomred,10),
		icon: vIcon,
		icontype: vIconType
	};
	var Marker = L.marker([pLoc[0],pLoc[1]],MarkerOptions);
	gMarkers.push(Marker);
	//vMapL.addLayer(Marker);
	return Marker;
}

function createImageIcon(pFaviconBuffer){//map icon
	cLog('started create ImageIcon');
	var vIcon;	
	//gHR.newObject.db = pFaviconBuffer;
	if(pFaviconBuffer){
		//https://stackoverflow.com/questions/38503181/how-to-display-a-jpg-image-from-a-node-js-buffer-uint8array
		vIcon = L.divIcon({
						  html: createImage(pFaviconBuffer),
						  className: "hr-favicon",
						  iconSize: L.point(23, 23)
		})
	}
	return vIcon;
}
function createImage(pImage){//testing if image is already prepared
  //cLog('create Image function got: '+pImage+' and pImage.indexOf(http)='+pImage.indexOf('http'));
  if(pImage){//when channel created without website, there will be no image at all
	if(pImage.indexOf('<img src="data:image')===0){return pImage}//image already created and as html tag
	else if(gEmoji.test(pImage)){return '<span style="font-size:20px">'+pImage+'</span>'}//emoji: increasing the emoji font
	else if(pImage.indexOf('data:image')===0){return '<img src="'+pImage+'" style="width:23px;height:23px">'}//image created, but not yet as html tag
	else if(pImage.indexOf('http')===0){return '<img src="'+pImage+'" style="width:23px;height:23px">'}//image returned as URL
	else{return '<img src="data:image/ico;base64,'+pImage+'" style="width:23px;height:23px">'}//create image from buffer
  }else{
	  return null;//'<img src="../moyvamprivet/images/channel.svg" style="width:23px;height:23px">';
  }
}

function ShowTempMarker(/*placeSearch*/){//show place marker if true or new homred (green) marker, if false	
	var vIcon; 
	if(gHR.newObject.db){vIcon = createImageIcon(gHR.newObject.db)}
	else if(gHR.newObject.du){vIcon = createImageIcon(gHR.newObject.db)}
	else{
		vIcon = L.divIcon({
				  html: '',
				  className: 'hr_place_icon',
				  iconSize: L.point(31, 31)
				})
	}				
    if (gHR.selectedMarker && gHR.editOrDuplicateHomred!==8) {//new homred (0) or editing homred (15) (NOT DUPLICATING HOMRED - (8)) 8=DUPLICATE; 15=EDIT;
        gHR.selectedMarker.setLatLng([gHR.newObject.b,gHR.newObject.c]);
		gHR.selectedMarker.setIcon(vIcon);
    }
    else {//duplicating homred (8)
		cLog('creating selectedMarker');
    	gHR.selectedMarker = new L.marker([gHR.newObject.b,gHR.newObject.c],{icon: vIcon});		
      	//gHR.selectedMarker.on('click',remTempMarker);//20200818
		gHR.selectedMarker.addTo(vMapL);		
		cLog('added selectedMarker to map');
		//gHR.selectedMarker.on('click',remTempMarker);
		//setTimeout(function(){if(gHR.selectedMarker){gHR.selectedMarker.on('click',remTempMarker)}},1000);//otherwise marker gets removed straigh away when clicking on map
    }	
	//setTimeout(function(){if(gHR.selectedMarker){gHR.selectedMarker.on('click',remTempMarker)}},1000);//otherwise marker gets removed straigh away when clicking on map
	//gHR.selectedMarker.on('click',remTempMarker);
}

function remTempMarker() {
	cLog('starting remTempMarker');
    //if (gHR.selectedMarker && gHR.editOrDuplicateHomred!==15) {//8=DUPLICATE; 15=EDIT; if editing homred then retain selectedMarker, so that it can be chenged on map
    	if(gHR.selectedMarker && !gHR.selectedMarker.options.id){//if marker is not for existing homred
			vMapL.removeLayer(gHR.selectedMarker);
			ClearLocation();
		}
		if (gHR.editOrDuplicateHomred!==15) {//8=DUPLICATE; 15=EDIT; commented out 20220305 if editing homred then retain selectedMarker, so that it can be changed on map
			gHR.selectedMarker = null;//20200813
		}
    //}
}

function ClearLocation() {
  cLog("started Clear Location function");
    //gHR.viewedHomred.b = 0;
    //gHR.viewedHomred.c = 0;
    $('#place_search').val('');
	gHR.place = null;
    $('#homred_form_searchplace').val('');
	$('#homred_form_place_details').val('').hide();
	$('#homred_form_place_name').text(gHR.placeSearchText);
	//delete gHR.newObject.bo;
	//delete gHR.newObject.bp;
}

function removeMarker(pHomred) {
  cLog("started remove Marker function");
	var vCurrMarker = findMarker(pHomred);
	if(vMcM.hasLayer(vCurrMarker)) {
		vMcM.removeLayer(vCurrMarker);
		vMcM.refreshClusters();
	}
	if(vMapL.hasLayer(vCurrMarker)) {map.removeLayer(vCurrMarker)}
	gMarkers.pop(vCurrMarker);//20200719
	if(parseInt(gHR.viewedHomred.a,10)===parseInt(pHomred,10)){closeHomred()}
}

function findMarker(pHomred) {//return Marker for homred
  cLog("started findMarker with pHomred = "+pHomred);
    if (pHomred && gMarkers && typeof gMarkers !== 'undefined') {
        var i = gMarkers.length;
        while (i--) {
            if (gHR.mapView && parseInt(pHomred,10) === gMarkers[i].options.id) {//20180318
            	cLog('returning Marker: '+gMarkers[i]);
                return gMarkers[i];
            }
        }
    }
    return null;
}

function getCluster(pHomred) {
	cLog('starting get Cluster(pHomred = '+pHomred+')');
  	var vCluster = vMcM.getVisibleParent(findMarker(pHomred));
  	cLog('vMcM.getVisibleParent(findMarker(pHomred)): '+vCluster);
  	return vCluster;

}

function formatDateTimeCollapsible(pActive){
	if(pActive){
		$('#homred_form_times').collapsible( "option", "collapsedIcon", "hr-datetime-active" ).collapsible( "option", "expandedIcon", "hr-datetime-active" );
		$('#homred_form_time').addClass('hr-collapsible-active').removeClass('hr-going');
		}	
	else{
		$('#homred_form_times').collapsible( "option", "collapsedIcon", "hr-datetime" ).collapsible( "option", "expandedIcon", "hr-datetime" );
		$('#homred_form_time').addClass('hr-going').removeClass('hr-collapsible-active');
	}
}

function searchPlace(){//forward geocoding - get coordinates 
  var vSearchString = $(this).val();
  if(vSearchString && vSearchString.length > 3){
	$('#hr_form_places').hide();
	try{
	   var vBounds = vMapL.getBounds();
	   $.ajax({//https://nominatim.org/release-docs/develop/api/Search/
			//url: 'https://hom.red/nom/search?q='+vSearchString+'&viewbox='+vBounds.getSouthWest().lng+','+vBounds.getSouthWest().lat+','+vBounds.getNorthEast().lng+','+vBounds.getNorthEast().lat+'&format=json',//items in bounding
			url: 'https://hom.red/nom/search?q='+vSearchString+'&viewbox='+vBounds.getSouthWest().lng+','+vBounds.getSouthWest().lat+','+vBounds.getNorthEast().lng+','+vBounds.getNorthEast().lat+'&format=json',//items in bounding
			//url: 'https://hom.red/nom/search?country='+vSearchString+'&format=json',//country search only
			type: 'GET',
			dataType: "text",
			success: function(s){showAutocompleteItems(JSON.parse(s))},//,vInvocatorId)},
			error: function(e){
				console.log('forward geocoding ERROR: '+e);
				return false;
			}
		});
	}
	catch(e){cLog('get Autocomplete failed: '+e)}
  }
}

function togglePreviousPlaces(){
	if(!gViewMode && ($('#place_search').val()==='')){$('#hr_form_places').show()}//list of previously posted places if creating or editing homred
	else{$('#hr_form_places').hide()}	
}

function clearPlaceSearch(){
	$("#hr_autocomplete_list").empty();
	if(!gViewMode){$('#hr_form_places').show()}//list of previously posted places if creating or editing homred
	else{$('#hr_form_places').hide()}
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//MAPS INIT
function showAutocompleteItems(r){//from Nominatim search
	//cLog('started show Autocomplete Items fucntion with r= '+JSON.stringify(r));	
	hidePopup();
	var vTarget = $("#hr_autocomplete_list");
	vTarget.empty();
	if (r && typeof r !== 'undefined') {
		var vLength = r.length;	
		if (vLength>0){
			var i;
			for(i = 0; i <= vLength-1; i++){	
				vTarget.append("<li data-icon='false'><a href='#' class='hr-found-place' id='hr_loc_"+r[i].place_id+"' data-foundplaceid="+r[i].place_id+" data-lat="+r[i].lat+" data-lon="+r[i].lon+" data-swlat="+r[i].boundingbox[0]+" data-swlon="+r[i].boundingbox[2]+" data-nelat="+r[i].boundingbox[1]+" data-nelon="+r[i].boundingbox[3]+">"+r[i].display_name+"</a></li>");
			}					
			vTarget.listview("refresh");			
		}
	else {vTarget.empty()}
  }
  else {vTarget.empty()}//no autocomplete results	
}

function showSelectedAutocompleteItem(){//from place search in Nominatim
	var vThis = $(this);
	gPlaceId = vThis.data('foundplaceid');
	gHR.newObject.bo = $('#hr_loc_'+gPlaceId).text();
	$("#hr_autocomplete_list").empty();
	$('#place_search').val(gHR.newObject.bo);
	$('#homred_form_place_name').text(gHR.newObject.bo).removeClass('hr-going-active').addClass('hr-going');
	if($('#homred_form_time').text()==='select time'){
		$('#homred_form_times').show().collapsible('expand');
		formatDateTimeCollapsible(true);
	}
	//toggleMarquee($('#homred_form_place_name'));//
	//$('#homred_form_place_details').show();//20200915 (remove comment to enable more complex version)
	//vMapL.flyTo(L.latLng(pLat,pLon),15,{animate:true, noMoveStart:true});
	vMapL.flyToBounds([[vThis.data('swlat'),vThis.data('swlon')],[vThis.data('nelat'),vThis.data('nelon')]]);
	if(Math.abs(vThis.data('swlat')-vThis.data('nelat')) < 0.01 && Math.abs(vThis.data('swlon')-vThis.data('nelon')) < 0.01){
		//ony show marker if it is a point or a small area, not if, e.g. it is a city or country
		gHR.newObject.b = vThis.data('lat');
		gHR.newObject.c = vThis.data('lon');
		ShowTempMarker(/*false*/);//new homred icon
	}else{
		gHR.newObject.b = null;
		gHR.newObject.c = null;
		remTempMarker();
	}
}

function selectPlace(){//from previouly posted and saved places
	if(gPlaceId && gPlaceId === $(this).data('place-id')){
		gPlaceId = null;
		gHR.newObject.b = 0;
		gHR.newObject.c = 0;
		delete gHR.newObject.bo;
		delete gHR.newObject.bp;
		$('#place_search').val('');
		$('#homred_form_place_name').text(gHR.placeSearchText).removeClass('hr-going-active').addClass('hr-going');
		//$('#homred_form_times').show().collapsible('expand');
		//formatDateTimeCollapsible(true);
		//toggleMarquee($('#homred_form_place_name'));
		$('#homred_form_place_details').val('').hide();
		//vMapL.flyTo(L.latLng(gHR.newObject.b,gHR.newObject.c),15,{animate:true, noMoveStart:true});
		remTempMarker();			
	}else{
		gPlaceId = $(this).data('place-id');
		cLog('gPlaceId: '+gPlaceId);
		gHR.newObject.b = gPlaces[gPlaceId].b;
		gHR.newObject.c = gPlaces[gPlaceId].c;
		gHR.newObject.bo = gPlaces[gPlaceId].bo;
		gHR.newObject.bp = gPlaces[gPlaceId].bp;
		$('#place_search').val(gHR.newObject.bo);
		setSearchPlace();		
		$('#homred_form_place_name').text(gHR.newObject.bo).removeClass('hr-going-active').addClass('hr-going');
		if($('#homred_form_time').text()==='select time'){
			$('#homred_form_times').show().collapsible('expand');
			formatDateTimeCollapsible(true);
		}
		//toggleMarquee($('#homred_form_place_name'));
		//$('#homred_form_place_details').show().val(gHR.newObject.bp);//20200915 (remove comment to enable more complex version)
		vMapL.flyTo(L.latLng(gHR.newObject.b,gHR.newObject.c),15,{animate:true, noMoveStart:true});
		ShowTempMarker(/*false*/);//new homred icon	
	}
	//$('#hr_autocomplete_list').hide();
	//$('#homred_form_place').collapsible('collapse');	
	$('#hr_form_places').hide();//list of previously posted places
}

function savePlace(){
	if(!gPlaces[gPlaceId]){
		gPlaces[gPlaceId] = {
			'cg':Math.round(new Date().getTime() / 1000), //get seconds from 1 Jan 1970 to use for sorting
			'b':gHR.newObject.b,
			'c':gHR.newObject.c,
			'bo':gHR.newObject.bo,
			'bp':gHR.newObject.bp
		};
		if(Object.keys(gPlaces).length>3){
			var vLeastUsedPlace = document.getElementById("hr_form_places_list").lastChild;
			delete gPlaces[vLeastUsedPlace.getAttribute("data-place-id")];
			vLeastUsedPlace.parentNode.removeChild(vLeastUsedPlace);
		}
	}else{//update to be most recently used
		gPlaces[gPlaceId].cg = Math.round(new Date().getTime() / 1000);
		$("li[data-place-id='"+gPlaceId+"']").remove();//remove this element from earlier position to be re-inserted at the top
	}
	$('#hr_form_places_list').prepend("<li data-icon='false' class='hr_saved_place ui-mini' data-place-id='"+gPlaceId+"'>"+gHR.newObject.bo+"</li>")
	.listview("refresh");
}

function getGeoAddress(){//reverse geocoding
  cLog('started get Address function with gHR.newObject.b='+gHR.newObject.b+' and gHR.newObject.c='+gHR.newObject.c);
	try{
		   $.ajax({
		        url: 'https://hom.red/nom/reverse?format=json&lat='+gHR.newObject.b+'&lon='+gHR.newObject.c,
		        type: 'GET',
		        dataType: "text",
				success: function(s){
					var vAddress = JSON.parse(s);	
						gPlaceId = vAddress.place_id;
						gHR.newObject.bo = vAddress.display_name; 
						$('#place_search').val(gHR.newObject.bo);
						setSearchPlace();
						$('#homred_form_place_name').text(gHR.newObject.bo).removeClass('hr-going-active').addClass('hr-going');
						if($('#homred_form_time').text()==='select time'){
							$('#homred_form_times').show().collapsible('expand');
							formatDateTimeCollapsible(true);
						}
				},
				error: function(e){
					console.log('reverse geocoding ERROR: '+e);
					return false;
				}
		    });
	}
	catch(e){cLog('get Address failed: '+e)}
}
//////////////////////
//GEOLOCATION: 0:unknown; 1:supported watch off; 2:supported watch on; 3:working; 4:unsupported; 5:supported but error
function manageUserLocation() {
	if(gHR.geolocation===1||gHR.geolocation===5){//switching geolocation on
		gHR.geolocation=3;
		$('#hr_geolocate').attr('src', 'https://code.jquery.com/mobile/1.4.5/images/ajax-loader.gif');
		//gHR.watchId = navigator.geolocation.watchPosition(showPosition, showPositionError,{timeout:30000}); UNCOMMENT FOR WATCH POSITION
		navigator.geolocation.getCurrentPosition(showPosition, showPositionError);
	}
    else if(gHR.geolocation===2){//switching geolocation off
		gHR.geolocation=1;
		$('#hr_geolocate').attr('src', '../moyvamprivet/images/hr-geolocation-off.svg');
		if(vMapL.hasLayer(gHR.geoCircle)){vMapL.removeLayer(gHR.geoCircle);}//https://gist.github.com/mollietaylor/8564724
		//navigator.geolocation.clearWatch(gHR.watchId); UNCOMMENT FOR WATCH POSITION
		setSearchEvents();
	}
}

function showPosition(position) {
	//cLog('show Position');
	//logBrowser('lat: '+position.coords.latitude); 
	var vCurrLocation = L.latLng(position.coords.latitude,position.coords.longitude);
	var vZoom = vMapL.getZoom(); 
	gHR.newObject.b = position.coords.latitude;
	gHR.newObject.c = position.coords.longitude;
	getGeoAddress();		
	if(position.coords.accuracy>100){//show circle if accuracy is > 100 metres
		if(gHR.geoCircle && vMapL.hasLayer(gHR.geoCircle)){gHR.geoCircle.setLatLng(vCurrLocation)}
		else{
			gHR.geoCircle = L.circle(vCurrLocation,{radius:position.coords.accuracy/2});
			vMapL.addLayer(gHR.geoCircle);
		}
	}else{//hide circle if accuracy is <= 100 metres
		if(gHR.geoCircle && vMapL.hasLayer(gHR.geoCircle)){
			vMapL.removeLayer(gHR.geoCircle);
			gHR.geoCircle = null;
		}
	}
	if(gHR.geolocation===2){//cLog('alredy watching position, so just update');
		vMapL.flyTo(vCurrLocation,vZoom,{animate:true});		
		if(gHR.myLocationShared){
			remTempMarker();
			gHR.newObject.ap = 47;
			gHR.newObject.a = gHR.LocationSharedHomredId;
			sendWS(gHR.newObject,-1,-1);
		}
	}
	else{//cLog('getting position for the 1st time');
		gHR.geolocation=2;	
		$('#hr_geolocate').attr('src', '../moyvamprivet/images/hr-geolocation-on.svg');
		vZoom = 15;
		vMapL.setView(vCurrLocation,vZoom);			
		ShowTempMarker(/*gViewMode*/);//false - new homred icon; true - place icon
	}
}

function showPositionError(error) {	
	console.log("started show Position error");
	logBrowser('getCurrentPosition error: '+error); 
	gHR.geolocation=5;
	$('#hr_geolocate').attr('src', '../moyvamprivet/images/hr-geolocation-error.svg');
}	

function setSearchPlace(){
	$('.hr_search_place').show();
	$('.hr_search_events').hide();
	$('#hr_switch_search').removeClass('ui-icon-find').addClass('ui-icon-find-place');
}
function setSearchEvents(){
	$('.hr_search_events').show();
	$('.hr_search_place').hide();
	$("#hr_autocomplete_list").empty();
	$('#hr_form_places').hide();
	$('#hr_switch_search').removeClass('ui-icon-find-place').addClass('ui-icon-find');
	remTempMarker();
}
function setSearchMode(){
	if($('#events_search').is(':visible')){setSearchPlace()}
	else{setSearchEvents()}
}

async function initMap(){
	cLog('function initMap started');

	/*await document.evaluate(`
		Object.defineProperty(window.document,'hidden',{get:function(){return false;},configurable:true});
		Object.defineProperty(window.document,'visibilityState',{get:function(){return 'visible';},configurable:true});
		window.document.dispatchEvent(new Event('visibilitychange'));
	`);*/
	
	//AUTOCOMEPLTE call//https://stackoverflow.com/questions/38989559/jquery-keyup-event-for-mobile-device
    var osmUrl='https://hom.red/gis/tile/{z}/{x}/{y}.png';//REFERENCE WORKING SETUP DOCKER
	var osmAttrib='Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors';//REFERENCE WORKING SETUP
	var osm = new L.TileLayer(osmUrl, {attribution: osmAttrib, noWrap: false});//REFERENCE WORKING SETUP		

	vMapOptionsL = {
	    zoom: gHR.z,//9
	    center: [gHR.lat,gHR.lon],
	    layers: osm,
		worldCopyJump: true, //20220115 https://leafletjs.com/reference-1.6.0.html#map-worldcopyjump
	    zoomControl: false//,
	    //minZoom: 3
	}; 
    vMapL = L.map('hr_map',vMapOptionsL);   
	
	//if(desktop){L.control.zoom({position:'bottomright'}).addTo(vMapL);}
	L.control.zoom({position:'bottomleft'}).addTo(vMapL);
//////////////////GEOLOCATE	
	L.Control.locateMe = L.Control.extend({
		onAdd: function(map) {
			var img = L.DomUtil.create('img');
			img.src = '../moyvamprivet/images/hr-geolocation-unknown.svg';
			img.style.width = '4em';
			//img.style.margin-top = '50px';
			//img.style.margin-left = '15px';
			img.id = 'hr_geolocate';
			return img;
		},
		onRemove: function(map) {}// Nothing to do here
	});
	L.control.locateMe = function(opts) {return new L.Control.locateMe(opts)}
	L.control.locateMe({ position: 'bottomleft' }).addTo(vMapL);
	$('#hr_geolocate').on('vclick',manageUserLocation);

	if (navigator.geolocation) {
		cLog('navigator.geolocation supported');
		gHR.geolocation = 1;
		$('#hr_geolocate').attr('src', '../moyvamprivet/images/hr-geolocation-off.svg');
	} else {
		cLog('navigator.geolocation NOT supported');
		gHR.geolocation = 4;
		$('#hr_geolocate').attr('src', '../moyvamprivet/images/hr-geolocation-unsupported.svg');
		//$('#hr_geolocate').prop("disabled", true);
	}	
	cLog('gHR.geolocation: '+gHR.geolocation);	
	
//////////////////   

	/*$('#hr_switch_place').on('click',setSearchPlace);
	$('#hr_switch_events').on('click',setSearchEvents);*/
	$('#hr_switch_search').on('click',setSearchMode);
//////////////////

	if (navigator.geolocation) {
		//cLog('navigator.geolocation supported');
		gHR.geolocation = 1;
		$('#hr_geolocate').attr('src', '../moyvamprivet/images/hr-geolocation-off.svg');
	} else {
		//cLog('navigator.geolocation NOT supported');
		gHR.geolocation = 4;
		$('#hr_geolocate').attr('src', '../moyvamprivet/images/hr-geolocation-unsupported.svg');
		//$('#hr_geolocate').prop("disabled", true);
	}	
	//cLog('gHR.geolocation: '+gHR.geolocation); 
	vMcM = new L.MarkerClusterGroup({//https://github.com/Leaflet/Leaflet.markercluster#other-clusters-methods
		zoomToBoundsOnClick: false,
		showCoverageOnHover: false,
		maxClusterRadius: 60,
		singleMarkerMode: true,	
		spiderfyOnMaxZoom: false,
		iconCreateFunction: function(cluster) {
			//cLog('started iconCreateFunction with cluster: '+cluster);		  	
		  	var vMarkers = cluster.getAllChildMarkers();
		  	//cLog("cluster.getAllChildMarkers(): "+vMarkers);
	        var vNumHomreds = cluster.getChildCount();
		  	//cLog("cluster.getChildCount(): "+vNumHomreds);
			if(vNumHomreds === 1 && (vMarkers[0].options.icontype === 'e' || vMarkers[0].options.icontype === 'f')){		
				return vMarkers[0].options.icon;					
			}else{
				//cLog('multiple markers');
				return L.divIcon({
				  html: '<b>'+vNumHomreds+'</b>',
				  className: 'hr_green_icon',
				  iconSize: L.point(31, 31)
				});
			}
		}		
	}); 	

	vMapL.addLayer(vMcM);//09092017
	
    //vMcM.on('clusterclick', function (pCluster) {//Leaflet cluster click //Leaflet marker click from around 2022 February, 'click' event causes double fire
	vMcM.on('clustermouseup', function (pCluster) {//Leaflet cluster click //20220312
		cLog('Leaflet cluster click');
    	//vCurrClusterL = [pClusterM,0];
		DrillIntoCluster(pCluster.layer);//20180222 https://github.com/Leaflet/Leaflet.markercluster#refreshing-the-clusters-icon
		//vMcM.refreshClusters();//https://github.com/Leaflet/Leaflet.markercluster#refreshing-the-clusters-icon //comm out 20180221
	}); 
	
    //vMcM.on('click', function (pCluster) {//Leaflet marker click from around 2022 February, 'click' event causes double fire 
	vMcM.on('mouseup', function (pCluster) {//20220312
		cLog('Leaflet marker click');
		if(gHR.editOrDuplicateHomred===0){//20211101 started being triggered on map click when editing homred, so added this check
			animateSelectedMarker(pCluster.layer);
			//vCurrClusterL = [pMarkerL,1];
			getHomredDetails(pCluster.layer,null);//20180222 https://github.com/Leaflet/Leaflet.markercluster#refreshing-the-clusters-icon
			//vMcM.refreshClusters();//https://github.com/Leaflet/Leaflet.markercluster#refreshing-the-clusters-icon //comm out 20180221
		}
	});	
   
    vMapL.on('moveend', function(){BoundsChanged(0,'vMapL.on(moveend)')}); //Bounds Changed fires first here
	
    //vMapL.on('contextmenu', function(event){//only when creating new homred, duplicating or edit
	vMapL.on('mouseup', function(event){//only when creating new homred, duplicating or edit
	//vMapL.on('click', function(event){//only when creating new homred, duplicating or edit //20220305 to address bug 2 (Marker put twice on map when duplicating homred)
		//var vPlaceSearch = $('#place_search').is(':visible');
		if(!gViewMode || $('#place_search').is(':visible')){
			    gHR.newObject.b = event.latlng.lat;
			    gHR.newObject.c = event.latlng.lng;
			    getGeoAddress();
			    ShowTempMarker(/*gViewMode*/);//show place marker if true or new homred (green) marker, if false
				$('#hr_form_places').hide();
		}
	});
	
    //vMapL.on('click', remTempMarker);
    
	setTimeout(function(){vMapL.invalidateSize()},100);
    cLog('map initialised');
	//gViewMode = true;
}

function openMaps() {//https://codepen.io/colinlord/pen/jWbELE
  if(gHR.viewedHomred && gHR.viewedHomred.b && gHR.viewedHomred.c){
	  if /* if we're on iOS, open in Apple Maps */
		((navigator.platform.indexOf("iPhone") != -1) || 
		 (navigator.platform.indexOf("iPod") != -1) || 
		 (navigator.platform.indexOf("iPad") != -1))
		 {window.open("maps://maps.google.com/maps?daddr="+gHR.viewedHomred.b+","+gHR.viewedHomred.c+"&amp;ll=")}

	  else /* else use Google */
		{window.open("https://maps.google.com/maps?daddr="+gHR.viewedHomred.b+","+gHR.viewedHomred.c+"&amp;ll=")}
  }
}

//////////////////////////////////////////////////////////////////////////////////////////
//OTHER FUNCTIONS
async function setMapHeight(){
  cLog("started set Map Height function");
    vHt = $.mobile.getScreenHeight();
	//vWd = $(window).width();
	//cLog('vHt: '+vHt);
    //$("#hr_map, #list-canvas").height(vHt - 138);//for old design with sliders
    $("#hr_map, #list-canvas").height(vHt - 47);
	//$("#channel_form").height(vHt-144);
    //$("#channel_form_lists").css('max-height',(vHt - 150)+'px');//20 Jan 2017 after adding 20px for Terms div chnaged from 234
    //$("#homred_form_categories,#homred_form_channels,#homred_form_place_details,#homred_form_times_alt").css('max-height',(vHt - 320)+'px');
    $("#homred_form, #hr_terms_text").css('max-height',(vHt - 50)+'px');
	//$("#channel_form").css('height',(vHt - 46)+'px');
}
/////////////////////////////////////////////////////////////////////

async function WSonOpen(){
	cLog('websockets opened');
	retrieveFavs()
		.then(()=>{			
			processInvite();
			gViewMode = true;
			//BoundsChanged(3,'on ws opened');
			if($('#homred_details').is(':visible') && gHR.viewedHomred){
				var vMember = getMember(gHR.viewedHomred.n);
				logNotif(gHR.viewedHomred.a,vMember,null);//no need pubkey, as it was saved already in database
			}//20210620 create notif record so that voting is re-enabled
			//if(!findInObject(gFavs,'n','My Default Group')){saveChannel(true)}
		});		
}

async function ws(){
	if(vWSconnection){
		if(vWSconnection.readyState === vWSconnection.OPEN){
			cLog('WebSockets already open');
			return true;
		}
		else if (vWSconnection.readyState === vWSconnection.CONNECTING){
			cLog('WebSockets still connecting');
			while (vWSconnection.readyState !== vWSconnection.OPEN){
			  await new Promise(r => setTimeout(r, 250));
			}
			cLog('WebSockets now open');
			return true;
		}
		else if (vWSconnection.readyState === vWSconnection.CLOSING || WSconnection.readyState === vWSconnection.CLOSED){
			cLog('WebSockets closed. Re-connecting...');	
			return await connectWS();		
		}
	}
	else{
		cLog('WebSockets not yet created. Creating and connecting...');
		return await connectWS();
	}
}
				
async function connectWS(){
	try{
		vWSconnection = new WebSocket('wss://hom.red/wss');
		vWSconnection.onopen = () => {
			WSonOpen();
			return true;
		}
		vWSconnection.onerror = async function(e){
			cLog('websockets error');
			return await reConnectWS(e);
		}	    
		vWSconnection.onclose = async function(e){			
			cLog('websockets closed');
			return await reConnectWS(e);
		}
		vWSconnection.onmessage = function(message){
			var vMessage = JSON.parse(message.data);
			switch(vMessage[0].ap) {				
			  case 21://get homreds
				showHomreds(vMessage[0].data,parseInt(vMessage[0].ap,10));
				break;						
			  case 24://show new homred marker	//20210516 restored (not sure why deleted earlier)		    
				showNewHomredMarker(vMessage[0].bc);
				break;   							
			  case 37://show homreds list (no map) and log notif
				showHomreds(vMessage[0].data,parseInt(vMessage[0].ap,10));
				break;
			  case 11://show existing homred 
				showHomred(vMessage[0].data[0],false);//20201206 false = from clicking a pre-existing homred
				break;				
			  case 1://show new homred
				showHomred(vMessage[0].data[0],true);//20201206 true = returning a homred created just now
				break;						
			  case 3://create push notification for homred			    
				updatePushSwitched(vMessage); //bq:q.bq,a:q.a,ag:q.ag
				break;	 							
			  case 7://delete homred and remove homred details popup			    
				deleteHomredMarker(vMessage[0].bc,vMessage[0].ay);
				break;  							
			  case 30://notify about homred deletion by removing marker			    
				removeMarker(parseInt(vMessage[0].bc[0].a,10));
				break; 							
			  case 31://get list of channels
				listChannels(vMessage[0].data);	
				break; 							
			  case 43://get list of channels
				listTags(vMessage[0].data);	
				break; 							
			  case 33://generate newly created channel (from create_fav)
				processCreatedChannel(vMessage[0].data[0],vMessage[0].ei);//member hash, url title, url favicon
				break;      							
			  case 42://generate found channel (from create_member)
				processFoundChannel(vMessage[0].data[0],vMessage[0].dh,vMessage[0].ei,vMessage[0].en);//when explicitly follow channel returns member hash, url, url title, true. when view homred first time - member hash, channel name, false
				break;       							
			  case 55://generate channel from invite (from create_member)
				processChannelFromUri(vMessage[0].data[0].bq,vMessage[0].data[0].au,vMessage[0].data[0].s,vMessage[0].data[0].ck,vMessage[0].data[0].db,vMessage[0].data[0].di,vMessage[0].data[0].dn,vMessage[0].ei,vMessage[0].data[0].en);//member hash, url, url title, favicon, channel found, address duplicate, index, channel type
				break;  							
			  case 40://get_channel info and stats
				updateFavStats(vMessage[0].data[0],vMessage[0].bq);	
				break;        							
			  case 46://confirm_favs - get existing channels from DB
				processConfirmedFavs(vMessage[0].data);	
				break;         							
			  case 59://confirm_address from DB when restoring all addresses
				recordConfirmedAddress(vMessage[0].data[0].bq,vMessage[0].ei,vMessage[0].data[0].dk)
				/*if(vMessage[0].data[0]){recordConfirmedAddress(vMessage[0].data[0].bq,vMessage[0].data[0].dk)}//dk = address and flag whether channel deleted by owner, or unfollowed; (still has to be confirmed as existing address and stored at client, so that there is no gap for adresses re-generation)
				else {recordConfirmedAddress('-',null)}//no more addresses*/
				break;         							
			  case 56://follow channel for which member already pre-created via viewing channel's homred
				processConfirmedFavs(vMessage[0].data);
				break;      							
			  case 12://show Homred actions
				showActions(vMessage[0].bc[0].cp);
				break;      							
			  case 47://update shared location
				updateSharedLocation(vMessage[0].bc[0]);
				break;				
			  /*case 52://left fav
				leftFav(vMessage[0].bc[0].bq);
				break;*/				
			  case 53://get meta
				processMeta(vMessage[0].au,vMessage[0].s,vMessage[0].db,vMessage[0].eh,vMessage[0].eg);
				break;				
			  case 54://show country
			  //https://leafletjs.com/reference-1.6.0.html#map-methods-for-modifying-map-state
				if(!gHR.country /*gHR.lat===0 && gHR.lon===0*/){
					cLog('setting country');
					//vMapL.fitBounds(
					vMapL.panInsideBounds(
						L.latLngBounds([vMessage[0].de[0],vMessage[0].de[2]],[vMessage[0].de[1],vMessage[0].de[3]])
						//min latitude, max latitude, min longitude, max longitude
						//L.latLngBounds(lat,lng, lat,lng);
					);
					gHR.country = vMessage[0].df;
				}
				break;				
			  case 57://check if name aleady exists when creating or editing channel
				channelNameExists(vMessage[0].data[0].check_channel_name);
				break;				
			  case 58://check if name aleady exists when creating or editing channel
				processEditedChannel(vMessage[0].data[0].edit_channel);
				break;				
			  case 60://check if duplicate address used					
				processCreateNotifHomredDuplicteAddress(vMessage[0].data[0]);
				break;			
			  case 65://check if duplicate address used					
				updateChannelDislikeStats(vMessage[0].data,vMessage[0].bq);
				break;			
			  case 66://get next connector index (when inviting)				
				promptNickName(vMessage[0].data[0].eg,vMessage[0].bq,null,null,true);//next free connector index,memberHash,null when inviting a member, true = inviter
				break;			
			  case 67://get next connector index				
				sendInvite(vMessage[0].data[0].create_connection);//next free connector index,memberHash
				break;			
			  case 68://get group name and ensure the invite is still valid (not already accepted, expired, revoked, invitee previously left, invitee banned)
				checkGroupInviteStatus(vMessage[0].eo,vMessage[0].data[0].n,vMessage[0].data[0].et);//group name if invite stil valid
				break;       							
			  case 69://create new member and join inviter's connection (similar to process 55 (create Channel member) but for Groups
				processJoinedGroup(vMessage[0].bq,vMessage[0].eq,vMessage[0].data[0].au,vMessage[0].data[0].s,vMessage[0].data[0].ck,vMessage[0].data[0].db,vMessage[0].data[0].en);//returns INVITEE MEMBER, INVITEE CONNECTOR, group url, url title, favicon, channel type
				break;       							
			  case 70://existing group member to accept connection from another inviter
				processAddConnection(vMessage[0].bq,vMessage[0].eo);//returns INVITEE MEMBER, INVITEE CONNECTOR
				break;       							
			  case 71://returns set of messages records using pg-cursor
				showPrivateMessages(vMessage[0].data);
				break;       							
			  case 72://for encrypting private messages to a specific member
				returnPrivateMessagePubkey(vMessage[0].data[0].ep);
				break;       							
			  /*case 73:
				
				break; */      							
			  case 74://confirms private message status (sent, delivered, read, deleted, response being typed)
				confirmPrivateMessageStatus(vMessage[0].data[0].fb);
				break;       							
			  case 75://check connectors for a member: get connectors (and connections) - when opening members window
				processConfirmedConnectors(vMessage[0].bq,vMessage[0].data);
				break;       							
			  case 76://receive private message; returns one new private message based on listener
				showNewPrivateMessage(vMessage[0].bc[0]);
				break;
			  //default:
				// code block
			}
		}		
	}
	catch(e){
		cLog('websockets general error');
		return await reConnectWS(e);
	}
}
async function reConnectWS(e){
	vWSconnection = null;	
	gHR.gErrorObject = e;
	cLog('Socket issue: '+e.reason+'. Reconnect attempt '+vWSconnectionRetries+' will be attempted in 5 seconds.');
	vWSconnectionRetries += 1; 
	if(vWSconnectionRetries < 11){
		return await setTimeout(function(){connectWS()},5000)
	}
	else{
		cLog('Socket issue: '+e.reason+'. Last reconnect attempt '+vWSconnectionRetries+' failed to reconnect. Stopped reconnecting');
		return false;
	}
}


function cLog(pLog){if (gHR.debug === 1){console.log((new Date())+Date.now()+' - '+pLog)}}
//console.log = function() {} //20180319 https://stackoverflow.com/questions/1215392/how-to-quickly-and-conveniently-disable-all-console-log-statements-in-my-code

///////////////////////////////////////////////////////////////////

function showHomreds(r,pProcess){//21 - map view; 37 - list view
	if (r && typeof r !== 'undefined') {
		//gHR.returnedHomreds = JSON.parse(JSON.stringify(r));//https://scotch.io/bar-talk/copying-objects-in-javascript
		if(pProcess === 21){//gHR.mapView){
			var vMarker;
			if(vMcM && typeof vMcM !== 'undefined'){vMcM.clearLayers()} 
			gMarkers = [];		
			//if(gHR.selectedMarker){cLog('gHR.selectedMarker.options.id: '+gHR.selectedMarker.options.id);}
			$.each(r, function(i, item){
				vMarker = ShowMarker([item.b, item.c], item.a, item.bm, item.db);
				//cLog('item.a: '+item.a);
				//to show active marker as blinking, need to re-instate the gHR.selectedMarker  
				if(gHR.selectedMarker && parseInt(gHR.selectedMarker.options.id,10) === parseInt(item.a,10)){
					//cLog('gHR.selectedMarker.options.id === item.a');
					gHR.selectedMarker = vMarker;
				}
			});						
			if(gMarkers.length>0){
				vMcM.addLayers(gMarkers);
				if(gHR.selectedMarker && gHR.selectedMarker._icon){L.DomUtil.addClass(gHR.selectedMarker._icon, 'blinking')}
				//vMcM.refreshClusters();//20200809 caused errors
			}
		}/*else if(pProcess === 37){//list view
			var vLinkText, vEmoji, vFavicon;//, vFragment = document.createDocumentFragment();// https://stackoverflow.com/questions/16734608/javascript-create-and-add-div-vs-clone-modify-and-add-div
			$("#list-canvas").empty();//clearing previous list
			$.each(r, function(i, item){
				vLinkText = item.s||item.au;
				vEmoji = item.bm ? item.bm+' ' : '';
				vFavicon = item.db ? createImage(item.db) : '';
				$("#list-canvas").append('<li data-icon="false" class="'+item.a+'"><a href="#">'+vFavicon+vEmoji+vLinkText+'</a></li>');
				$('.'+item.a).click(function(e){getHomredDetails(item.a,null)});
			});
			if($('#list-canvas').children().length<1){//https://forum.jquery.com/topic/how-do-i-know-if-a-listview-is-empty-jqm
				$("#list-canvas").append('<li id="hr_listview_help" data-icon="false"><a href="#" style="white-space:normal !important">This view shows posts without location. Those could be blogs, articles, or virtual events. Click <span class="ui-btn-icon-notext ui-icon-hr-earth" style="position:relative;padding-left:15px;padding-right:15px"></span> to swith to map view. No posts yet.</a></li>');
			}
			$("#list-canvas").listview("refresh");		
		}*/
	}
	gViewMode = true;	
}

///////////////////////////////////////////////////////

function closeHomred() {
  cLog("started close Homred function");
	$('.blinking').removeClass('blinking');//remove marker animation
	$('#dislike_menu').slideUp();
	$('#hr_dislike').removeClass('hr-dislike-theme');
  if ($('#homred_details').is(':visible')) {
    $('#homred_details').slideUp(/*function(){$('#hr_search').slideDown()}*/);
	remTempMarker();
	if(gViewMode){
		var vPar = {
			ap: 23
		};
		sendWS(vPar,-1,-1); 
	}
    //gHR.viewedHomred = {}; 2020107 keep in memory for edit or duplicate homred function

	/*$('.ui-icon-2-active').removeClass('ui-icon-2-active').addClass('ui-icon-2');
	$('.ui-icon-3-active').removeClass('ui-icon-3-active').addClass('ui-icon-3');
	$('.ui-icon-4-active').removeClass('ui-icon-4-active').addClass('ui-icon-4');
	$('.ui-icon-5-active').removeClass('ui-icon-5-active').addClass('ui-icon-5');
	$('.ui-icon-6-active').removeClass('ui-icon-6-active').addClass('ui-icon-6');
	//$('.ui-icon-7-active').removeClass('ui-icon-7-active').addClass('ui-icon-7');
	$('.ui-icon-11-active').removeClass('ui-icon-11-active').addClass('ui-icon-11');
	$('.hr-action').text('0');
	$('#hr_going').text('Going 0');
	$('#hr_maybe').text('Maybe 0');*/
	//$('#homred_details_link').removeClass('hr-wrap').addClass('hr-nowrap').parent().css('width','100%').hide();//20211010 commented out as hides URL name
	$('#homred_details_link_wrap').hide().parent().css('width','0%');
	$('#homred_details_domain, #hr_viewed').hide();
  }
}

//PROCESS 12 HOMRED ACTIONS
function showActions(r){// r = vMessage[0].bc[0].cp
	if(r){
		cLog('started show Actions');
		$('.ui-icon-2-active').removeClass('ui-icon-2-active').addClass('ui-icon-2');
		$('.ui-icon-3-active').removeClass('ui-icon-3-active').addClass('ui-icon-3');//dislike button for showing total dislikes and toggling dislike menu
		//$('.ui-icon-4-active').removeClass('ui-icon-4-active').addClass('ui-icon-4');
		//$('.ui-icon-5-active').removeClass('ui-icon-5-active').addClass('ui-icon-5');
		$('.ui-icon-6-active').removeClass('ui-icon-6-active').addClass('ui-icon-6');
		$('.ui-icon-7-active').removeClass('ui-icon-7-active').addClass('ui-icon-7');
		$('.ui-icon-11-active').removeClass('ui-icon-11-active').addClass('ui-icon-11');
		$('.hr-dislike').removeClass('active-dislike');
		$('.hr-action').not('.hr-dislike').text('0');//https://stackoverflow.com/questions/9287621/how-can-i-exclude-a-class-from-my-jquery-selector			
		$('.hr-dislike > span').text('0');
		$('#hr_dislike').text('0');
		$('#hr_going').text('Going 0');
		$('#hr_going').removeClass('hr-going-active').addClass('hr-going');
		var vLen = r.length, vElement , vTotalDislikes = 0;
		if(vLen && vLen>0){//actions array - "cp" object
			while (vLen--){
				vElement = $('[data-hr-action="'+r[vLen].as+'"]');
				if(r[vLen].as === 4){$('#hr_going').text('Going '+r[vLen].cq)}
				else if(r[vLen].as === 7){$('#hr_viewed').text(r[vLen].cq)}
				else if(r[vLen].dw){//one of the dislike actions
					vTotalDislikes += r[vLen].cq;//counting number of total dislikes
					$('[data-hr-action="'+r[vLen].as+'"] > span').text(r[vLen].cq);
				}
				else{$('[data-hr-action="'+r[vLen].as+'"]').text(r[vLen].cq)}
				
				if(r[vLen].dg === 1){//own action - activate icon
					if(r[vLen].as === 4){$('#hr_going').removeClass('hr-going').addClass('hr-going-active')}
					else if(r[vLen].as === 7){$('#hr_viewed').removeClass('ui-icon-'+r[vLen].as).addClass('ui-icon-'+r[vLen].as+'-active')}
					else if(r[vLen].dw){//one of the dislike actions
						$('.ui-icon-3').removeClass('ui-icon-3').addClass('ui-icon-3-active');//dislike button for showing total dislikes and toggling dislike menu
						$('*[data-hr-action="'+r[vLen].as+'"]').addClass('active-dislike');
					}
					else{vElement.removeClass('ui-icon-'+r[vLen].as).addClass('ui-icon-'+r[vLen].as+'-active')}
				}
				/*else{// others actions
					vElement.removeClass('ui-icon-'+r[vLen].as+'-active').addClass('ui-icon-'+r[vLen].as); 
					if(r[vLen].as === 4){$('#hr_going').removeClass('hr-going-active').addClass('hr-going')}
				}*/				
			}
			$('#hr_dislike').text(vTotalDislikes);
		}			
		//checkRecordMnemonic(gVoteHomredInteractionWeight);//gViewHomredInteractionWeight, gVoteHomredInteractionWeight, gFollowChannelInteractionWeight, gCreateChannelInteractionWeight
	}
}

//from process 64 and 65 
/*function updateDislikeStats(r){
	var x = JSON.parse(r).ds, vItem;//, DislikeType;
	$.each(x, function(i, item){
		vItem = $('*[data-hr-dislike="'+item.dq+'"]');//https://stackoverflow.com/questions/2487747/selecting-element-by-data-attribute-with-jquery
		//DislikeType = vItem.text();
		//cLog('Dislike: '+vItem.text());
		vItem.text(item.dv+' ('+item.dt+')');
		if(item.dg===1){vItem.addClass('active-dislike')}
		else{vItem.removeClass('active-dislike')}
	});
}*/
/*function sendDislike(){
	//var vMember = gHR.currentMember;
	var vPar = {
		ap: 63,//process send Dislike		
		bq: gHR.currentMember || getMember(gHR.viewedHomred.n),
		dq: $(this).data('hr-dislike'),
		a: gHR.currentMember ? null : gHR.viewedHomred.a //if channel then null for homred id
	});
	sendWS(vPar,-1,-1);
	closeComplainMenu();
}*/

function getMember(pChannelName){
	var p;
    for (p in gFavs) {
        if(gFavs.hasOwnProperty(p) && typeof gFavs[p] === 'object' && gFavs[p].n === pChannelName){return p}
    }
}

function getDefaultMember(){
	var p;
    for (p in gFavs) {
        if(gFavs.hasOwnProperty(p) && typeof gFavs[p] === 'object' && gFavs[p].en === 5){return p}
    }
}

function sendAction(){
	if(gHR.viewedHomred.a && $('#homred_details').is(':visible')){//prevent sending when homred being created or when viewing complaints at channel level
		var vThis = $(this),
		vAction = vThis.data('hr-action'),
		vPar = {
			ap: 12,
			as: vAction,
			a: gHR.viewedHomred.a,
			bq: getMember(gHR.viewedHomred.n)
		};	
		//if(vAction===18){followPreviewedChannel(null)}//follow channel
		sendWS(vPar,-1,-1);//send reaction
	}
}
 
//PROCESSES 11 and 1 
function showHomred(r,pNewHomred){
	if (r && typeof r !== 'undefined') {
		//$('#homred_details').css('bottom','3.7em').css('top','auto').css('left','1em');
		gHR.viewedHomred=JSON.parse(JSON.stringify(r));//save homred object for any edits or cloning
		$('#homred_emojis').text(r.du);
		if(!pNewHomred){//gHR.selectedMarker && gHR.selectedMarker.options.icon.options.html.indexOf('img')>0){
			if(r.t){//if zoom provided that means it is homred has been shared via URL; need to set map view and date
				var vZoom = parseInt(r.t,10);
				if(!isNaN(vZoom)){//shared homred; need to set map view and date
					//gViewMode = false;//need BoundsChanged function to work, to display the marker of the just created homred being shared
					/*try{
						vMapL.setView([r.b, r.c],vZoom);						
					}
					catch(e){
						//gViewMode = true;
						cLog('cannot setView: '+e.reason);
					}*/
					//gViewMode = true;
					rangeDates(0,r.d);//setting the date of the homred	
					//return;
					mapMoveTo([r.b, r.c],vZoom).then(function(){
						gHR.selectedMarker = findMarker(r.a) ;
						if(!gHR.selectedMarker){
							//cLog('showHomred function: shared homred, gHR.selectedMarker is null');
							gHR.selectedMarker = ShowMarker([gHR.newObject.b, gHR.newObject.c], r.a, null, gHR.newObject.db);
							//cLog('showHomred function: shared homred, gHR.selectedMarker after ShowMarker function'); 
						}
						//L.DomUtil.addClass(gHR.selectedMarker._icon, 'blinking');
						//setTimeout(function(){
							L.DomUtil.addClass(gHR.selectedMarker._icon, 'blinking');
							cLog('gHR.selectedMarker.options.icon.options.html after 1 sec: '+gHR.selectedMarker.options.icon.options.html);
						//},1000); //when homred was editedб or shared, only works with setTimeout
						}
					);
				}
			}
			//cLog('gHR.selectedMarker.options.icon.options.html before 1 sec: '+gHR.selectedMarker.options.icon.options.html);
			if(gHR.selectedMarker && gHR.selectedMarker.options.icon.options.html && (
					gHR.selectedMarker.options.icon.options.html.indexOf('img')>0
					|| 
					gEmoji.test(gHR.selectedMarker.options.icon.options.html)
					)
			){
				$('#homred_details_favicon').html(gHR.selectedMarker.options.icon.options.html);
				gHR.viewedHomred.db = gHR.selectedMarker.options.icon.options.html;//not received from database
			}else if(r.db){//favicon provided from database
				$('#homred_details_favicon').html(createImage(r.db));
				delete gHR.viewedHomred.db;
			}else if(r.du){
				$('#homred_details_favicon').html(r.du);
				$('#homred_emojis').text('');
				delete gHR.viewedHomred.db;
			}else{
				$('#homred_details_favicon').html('');
				delete gHR.viewedHomred.db;
			}
		}else if(pNewHomred){//new homred just created, get favicon from channel
			//set date to the date of new homred, so that it is visbile
			setDates();
			$('#homred_details_favicon').html(createImage(gHR.newObject.db));
			gHR.selectedMarker = ShowMarker([gHR.newObject.b, gHR.newObject.c], r.a, null, gHR.newObject.db);			
			vMcM.addLayer(gHR.selectedMarker);
			setTimeout(function(){L.DomUtil.addClass(gHR.selectedMarker._icon, 'blinking')},1000); //when homred was edited, only works with setTimeout
			gHR.newObject = {};
		}
		//$('#homred_emojis').text(r.du);
		if(r.au && r.au !== ''){
			var vDomain = r.au;
			vDomain = vDomain.replace('http://','').replace('https://','').replace('www.','').split(/[/?#]/)[0];//http://scratch99.com/web-development/javascript/how-to-get-the-domain-from-a-url/
			$('#homred_details_domain').text(vDomain).attr("href",r.au).show();
			var vUriTitleElement = $('#homred_details_link');
			var vWrapButtonElement = $('#homred_details_link_wrap');
			//vUriTitleElement.text(r.s);//does not work
			$('#homred_details_link').text(r.s).show();//.attr("href",r.au); //link does not work for span
			$('#hr_viewed').show();
			setTimeout(//.ready() does not always work
				function(){ 
					cLog('vUriTitleElement.width() '+vUriTitleElement.width())
					cLog('vUriTitleElement.parent().width() '+vUriTitleElement.parent().width())
					if(vUriTitleElement.width()>=vUriTitleElement.parent().width()){
						vWrapButtonElement.show().parent().css('width','10%');
						vUriTitleElement.parent().css('width','90%');
					}
					else{
						vWrapButtonElement.hide().parent().css('width','0%');
						vUriTitleElement.parent().css('width','100%');
					}
				},1000			
			);
			/*setTimeout(function(){ 
				cLog('vUriTitleElement.width() '+vUriTitleElement.width())
				cLog('vUriTitleElement.parent().width() '+vUriTitleElement.parent().width())
				if(vUriTitleElement.width()>=vUriTitleElement.parent().width()){cLog('show wrap button')}
				else{cLog('hide wrap button')}
				},
			3000);*/
		}else{$('#homred_details_domain, #homred_details_link, #hr_viewed').hide()}
		//toggleMarquee($('#homred_details_link'));
		$('#homred_details_place').text(r.bo); 
		//toggleMarquee($('#homred_details_place'));
		$('#homred_details_time').text(formatTimeHomred(r.d,r.e));
		//$('#homred_details_channel').text(r.n);

		if(parseInt(r.dc,10)===1){//end date (if given) or start date is in the future, so display attendance buttons
			//$('.hr-opinion').hide();	
			$('#hr_going').show();
		}else{//end date (if given) or start date are in the past, so display opinion buttons
			$('#hr_going').hide();
			//$('.hr-opinion').show();
		}
		//if(gHomreds[gHR.viewedHomred.a] && gHomreds[gHR.viewedHomred.a].ag){$('#hr_notif').removeClass('ui-icon-11').addClass('ui-icon-11-active')} //TO DO
		//var vChannels = r.n.split('|');
		$('.hr-owner').hide();
		$("#hr_chann").show();//.removeClass('ui-icon-channel-active').addClass('ui-icon-channel'); //show follow channel button by default
		//address already created for channel by creating/following the channel, or viewing one of its homreds, or
		//no address exists for this channel, i.e. the homred is viewed 1st time, without following channel first, so generate address
		gHR.gActiveMember = getMember(r.n);		
		if(gHR.gActiveMember && gFavs[gHR.gActiveMember]){//homred previously followed
			cLog('homred previously followed');
			cLog('gHR.gActiveMember = '+gHR.gActiveMember);
			if(gFavs[gHR.gActiveMember].bu){//owner
				$('.hr-owner').show();
				$("#hr_chann").hide();
			}else if(gFavs[gHR.gActiveMember].dh){$("#hr_chann").hide()}//removeClass('ui-icon-channel').addClass('ui-icon-channel-active')}//non-owner
			logNotif(r.a,gHR.gActiveMember,null);//no need pubkey, as it was saved already in database
		}else{
			if(pNewHomred){//this post must have been created by "quick post" process, i.e. without group or channel, so get the default member
				gHR.gActiveMember = getDefaultMember();
				let vPubKey = createMemberObject(gFavs[gHR.gActiveMember].ei).ej;
				cLog('gHR.gActiveMember = '+gHR.gActiveMember);
				logNotif(r.a,gHR.gActiveMember,vPubKey);
			}else{//existing homred not previously followed, so generate new address
				cLog('homred not previously followed, so generate new address');
				var vMemberObject = generateMemberObject();//CHECK
				gHR.gActiveMember = vMemberObject.bq;			
				gFavs[gHR.gActiveMember] = {'ei':vMemberObject.ei, 'n':r.n, 'dh':false, 'en':5};//20210527 TO DO need to associate new address with the channel in the database
				//gFavs[vMember].dh = false;			
				cLog('gHR.gActiveMember = '+gHR.gActiveMember);
				logNotif(r.a,gHR.gActiveMember,vMemberObject.ej);
				cryptoStoreSet('favs', Object.keys(gFavs).length);//just store number of channel members
			}
		}
		$('#homred_details_channel').text(r.n ? r.n : '');
		$('#homred_details').slideDown();
		$('#hr_date_ranges').slideUp();
		//$('#hr_search').slideUp();
		if(!isDesktop()){hideChannels()}			
		checkRecordMnemonic(gViewHomredInteractionWeight);//gViewHomredInteractionWeight, gVoteHomredInteractionWeight, gFollowChannelInteractionWeight, gCreateChannelInteractionWeight		
	}
    else {cLog('ERROR: no result from database!')}	
  //}
}
////log notif about viewed homred - returns message if address duplicate found in database (should never happen) 
function logNotif(pHomred,pMember,pPubkey){
	var vPar = {
		a: pHomred,
		ap: 60,
		//at: new Date().getTimezoneOffset(),
		at: Intl.DateTimeFormat().resolvedOptions().timeZone,// used for create_notif, //https://stackoverflow.com/questions/1091372/getting-the-clients-timezone-offset-in-javascript
		//br: gHomreds&&gHomreds[gHR.viewedHomred.a]?gHomreds[gHR.viewedHomred.a].br:null,//homred creator hash
		//ei: pIndexPubkeyAddressObj.ei,//index
		ej: pPubkey,//pubKey	(if need to create new member in database)	
		bq: pMember// address(member) - used for create_notif and log_action; generate address 0 if no previous channel memberships exist
	};	
	sendWS(vPar,-1,-1);	
}
//responce from process 60 logNotif (create_notif - specific for viewed homred), when address duplicate found in database (should never happen)
function processCreateNotifHomredDuplicteAddress(r){
	if(r && r.dn){
		var vMemberObject = generateMemberObject();
		gFavs[r.bq] = {'ei' : vMemberObject.ei, 'dn':true};
		logNotif(r.a,vMemberObject.bq,vMemberObject.ej);
	}
}

function updateSharedLocation(r){
	if (r && typeof r !== 'undefined') {
		findMarker(r.a).setLatLng([r.b,r.c]);
	}
	
}

function showNewHomredMarker(r){//20210516 restored (not sure why deleted earlier)	
	if (r && typeof r !== 'undefined') {
		//removeMarker(r[0].a);//when existing homred has been updated (may not be needed as we call delete homred for homred updates
		vMcM.addLayer(ShowMarker([r[0].b, r[0].c], r[0].a, r[0].bm, r[0].db));	
	}	
}

//PROCESS 7 - run for the client that deleted homred 
function deleteHomredMarker(r,pNumberNotified){
	if (r && typeof r !== 'undefined') {
		var vHomred = r[0].a;
		//closeHomred();
		removeMarker(vHomred); 
		//delete gHomreds[vHomred];
		if (pNumberNotified > 0) {showAlert(pNumberNotified+' users have seen this change on their screens')} 
	}	
}

//PROCESSES 3 and 32 create push and switch push on/off
function updatePushSwitched(pData){//pHash,pHomredId,pMemberHash,pPushOnOff,pTotalPushNotifEnabled){vMessage[0].bd,vMessage[0].ag,vMessage[0].ad
	if (pData[0].a){//homred push
		null;//$('#hr_notif').toggleClass('ui-icon-11 ui-icon-11-active');//TO DO
	}
	else if (pData[0].bq){//channel push
		$('#hr_notif'+pData[0].bq+',#hr_notif_'+pData[0].bq).toggleClass('ui-icon-69 ui-icon-69-active');
	}
}

//send websockets message
function sendWS(pMessage,pMemberIndex,pConnectorIndex){	
    cLog("started send WS function with pMessage: "+JSON.stringify(pMessage));
	if(pMemberIndex !== -1){//must sign message for authenticity and integrity
		cLog("pMemberIndex: "+pMemberIndex);
		var vSignature = signTx(pMemberIndex,pConnectorIndex,pMessage),
		vMessage = {};
		cLog("vSignature: "+vSignature);
		vMessage.em = pMessage;	//original message, message object – used when sending with signature, which has to be easily separated from the message itself 
		vMessage.el = vSignature;//signature
		cLog("vMessage: "+JSON.stringify(vMessage));
		sendWebSocketsMessage(JSON.stringify(vMessage));
	}else{//no need to sign message
		sendWebSocketsMessage(JSON.stringify(pMessage));
	}
}

function sendWebSocketsMessage(pMessage){
	cLog('sendWebSocketsMessage: pMessage: '+pMessage);
	ws().then(res => {
		if(res){
			vWSconnection.send(pMessage);
			return;
		}
	});	
}
////////////////////////////////////////////////////////////////////////////////
//DATA STORAGE
function persistUserData(){//Mnemonic and Map
	cLog("started persist User Data function");	
	cryptoStoreSet('favs', Object.keys(gFavs).length);//just store number of channel members
	cryptoStoreSet('mnemrecorded', gMnemonicRecordedByUser);
	cryptoStoreSet('mnemthresh', gCurrentShowMnemonicThreshold);//https://stackoverflow.com/questions/55660945/output-the-object-keys-when-the-condition-for-object-values-is-greater-than-5
	if (typeof(Storage) !== "undefined") {
		localStorage.setItem('places', JSON.stringify(gPlaces));
		if(vMapL && vMapL.getCenter()){localStorage.setItem('savedmap', JSON.stringify({'cmap':gHR.mapView,'lat':vMapL.getCenter().lat,'lon':vMapL.getCenter().lng,'z':vMapL.getZoom(),'country':gHR.country}))}
	}
}

function logBrowser(pText){
	var vPar = {
		ap: 48,
		cz: pText
	};	
	sendWS(vPar,-1,-1);	
}

function checkFeedback(e){
	if(!e || (e.keyCode !== 46 && e.keyCode !== 8)) {//not delete or backspace
		if(e){cLog('e.keyCode: '+e.keyCode)}
		var vFeedbackText = $('#hr_feedback_text').val();
		//var vExcluded=/[\@\d]/;
		var vAllowed = /^[a-z\s]+$/i;//contain letters and spaces, case insensitive
		//var vAllowed = /^[A-Z]+$/i;
		//var vAllowed = [A-Za-z];
		if(vFeedbackText && vFeedbackText.length > 0){
			if (!vAllowed.test(vFeedbackText)){
				showAlert('Only text, please. No numbers or special characters. No emails, phone numbers or any other personal information, please. We do not want to collect your personal informtion');
				return false;
			}else if(vFeedbackText.length > 9 && vFeedbackText.length < 2800){return vFeedbackText}
		}
		return false;	
	}
}

/*function checkInput(pInput){//NOT USED letters and number only
	//var vExcluded=/[\@]/;
	//var vLettersNumbers = new RegExp('/^[a-z0-9\s]+$/i');//contain letters, numbers and spaces, case insensitive
	//var vAllowed = new RegExp(vLettersNumbers + gEmoji);
	//var vAllowed = /^[a-z0-9\s]+$/i;
	//https://stackoverflow.com/questions/43386001/regex-for-cyrillic-and-international-characters
	var vAllowed = /^(?=(?:.*[a-zA-ZÀ-ÖØ-ßŸà-çа-яА-ЯЁёè-ÿ0-9]){3,})(?!.*\b([a-zA-ZÀ-ÖØ-ßŸà-çа-яА-ЯЁёè-ÿ])\1+\b)(?!.*([a-zA-ZÀ-ÖØ-ßŸà-çа-яА-ЯЁёè-ÿ])\2{3,})(?![a-zA-ZÀ-ÖØ-ßŸà-çа-яА-ЯЁёè-ÿ]{3,}$)(?=([0-9])\3+$|(?!\d+$))(?!.*[\ *"(:,\/.\\;&)\[\]_+#'-]{2,})[a-zA-ZÀ-ÖØ-ßŸà-çа-яА-ЯЁёè-ÿ0-9\ *"(:,\/.\\;&)\[\]_+#'-]{3,40}$/gm;
	if(pInput && pInput.length > 0){
		if (!vAllowed.test(pInput)){
			showAlert('letters and numbers only, please');
			return false;
		}else{return pInput}
	}
	return false;
}*/

function sendFeedback(){
	var vFeedback = checkFeedback();
	if(vFeedback){
		var vPar = {
			ap: 51,
			da: vFeedback
		};	
		sendWS(vPar,-1,-1);
		toggleFeedback();
		$('#hr_feedback_text').val('');
		showAlert('thank you for your feedback');
	}else{
		showAlert('your feedback message must be 10 characters minimum and not more than around 400 words')
	}
}

function manageHelp(){
	if(!localStorage.getItem('help')){localStorage.setItem('help',JSON.stringify({'v':'m'}))}
	//setTimeout(function () {if($('#hr_about').is(':hidden')){showCookieWarning()}},10000);
}

function showAbout(){	
	$('#hr_about, .hr-modal').show();
	if(!isDesktop()){hideMenu()}
}
function hideAbout(){$('#hr_about, .hr-modal').hide();}

function showDonate(){
	if(!isDesktop()){hideMenu()}
	$('#hr_donate, .hr-modal').show();
}
function hideDonate(){$('#hr_donate, .hr-modal').hide()}

function togglePopup(){//invoked automatically
	var vThis = $(this),
	vPopup = $('#'+vThis.data('hr-help'));
	if(vPopup.is(':visible')){vPopup.slideUp()}
	else{
		if(gHR.helpText[vThis.data('hr-help')].v < gHR.helpText.maxHelpShow){	
			vPopup.slideDown();	
			setTimeout(function(){
				gHR.helpText[vThis.data('hr-help')].v = gHR.helpText[vThis.data('hr-help')].v+1;
				cryptoStoreSet('interactivehelp', Object.keys(gHR.helpText).filter(el => gHR.helpText[el].v > 0).join());
			},1000);
			//https://stackoverflow.com/questions/55660945/output-the-object-keys-when-the-condition-for-object-values-is-greater-than-5
		}
	}
}
function hidePopup(){
	$('.hr-popup').slideUp();
	//$('#hr_popup').offset({top:0,left:0});	
}
function resetHelp(){
	if(!isDesktop()){hideMenu()}
	showAlert('You can now see interactive help again for all elements. It will be hidden again automatically again for each element individually after you have seent it '+gHR.helpText.maxHelpShow+' times. But you can reset it any time again.');
	var p;
    for (p in gHR.helpText) {
        if(gHR.helpText.hasOwnProperty(p) && typeof gHR.helpText[p] === 'object') {gHR.helpText[p].v = 0}
    }
	cryptoStoreSet('interactivehelp', null);//https://stackoverflow.com/questions/55660945/output-the-object-keys-when-the-condition-for-object-values-is-greater-than-5
}

//PROCES 53 - GET METADATA for channel or homred link
function getMeta(){
	cLog('start get Meta');
	var vThis = $(this),
	vUriProvided = vThis.val(),
	vHasHttpPosition,
	vUriProcessed;
	if(vUriProvided && vUriProvided.length > 0){
		cLog('get Meta: vUriProvided && vUriProvided.length > 0');
		vUriProvided = vUriProvided.trim();
		if(vUriProvided.indexOf(".")>2 && vUriProvided.indexOf(" ") ===-1){
			vHasHttpPosition = vUriProvided.indexOf("http");//https://stackoverflow.com/questions/354110/what-is-the-difference-between-indexof-and-search
			if(vHasHttpPosition === 0){vUriProcessed = vUriProvided}//string has http at the start 
			else if(vHasHttpPosition > 0){vUriProcessed = vUriProvided.substring(vHasHttpPosition)} //free text preceeds http
			else{vUriProcessed='https://'+vUriProvided}//trying to prefix with https		
			vThis.val(vUriProcessed);
			cLog('vUriProcessed before send: '+vUriProcessed);
			if((gHR.newObject.bq && gFavs[gHR.newObject.bq].au !== vUriProcessed)//editing channel and channel URL is changing
				||
				!gHR.newObject.bq){// or new channel
				//gHR.newObject.au = vUriProcessed;
				sendWS({
					ap: 53,
					au: vUriProcessed,
					ec: gUserLang //'en-GB'
				},-1,-1);
			}else{//channel URL has not changed, delete, so that no change is triggered in database
				delete gHR.newObject.au;
				delete gHR.newObject.db;
				delete gHR.newObject.s;
				if(gFavs[gHR.newObject.bq].db && $('#hr_new_channel_favicon').html()===''){//restore favicon, if exists
					$('#hr_new_channel_favicon').html(createImage(gFavs[gHR.newObject.bq].db)).parent().width('10%');
				}
			}
		}else{showAlert('Please, provide a valid URL link')}
	}else if(!vUriProvided || vUriProvided.length < 1){		
		cLog('get Meta: !vUriProvided || vUriProvided.length < 1');
		if(gHR.newObject.bq){//if editing existing channel
			if(gFavs[gHR.newObject.bq].au){gHR.newObject.au = 0}//flag to show that Uri to be deleted in DB for this channel
			if(gFavs[gHR.newObject.bq].db){gHR.newObject.db = 0}//flag to show that Uri Favicon to be deleted in DB for this channel
			if(gFavs[gHR.newObject.bq].s){gHR.newObject.s = 0}//flag to show that Uri Title to be deleted in DB for this channel
		}else{//new channel
			delete gHR.newObject.au;
			delete gHR.newObject.db;
			delete gHR.newObject.s;
		}
		$('.hr-uri-title').hide().text('Add weblink (optional)');
		if(!gEmoji.test($('#hr_new_channel_favicon').html())){
			$('#hr_new_channel_favicon').html('').parent().width('0');
		}//only delete favicon and not if it is emoji		
	}
}

function processMeta(pUri,pTitle,pFavicon,pErrorCode,pErrorMsg){
	cLog('process Meta: '+pErrorMsg);
	if(pUri){//check if ULR is valid and no errors
		var vErrorCode = parseInt(pErrorCode,10);
		if(vErrorCode > 0){
			switch(vErrorCode) {				
				case 1: showAlert('Sorry, we cannot process this website. Homred uses an external service to check domain reputaiton and it returned a score lower than normal.');
				return;
				case 2: showAlert('We could not get the logo (favicon) from this website. You can still proceed with using this website and pick an emoji as your logo, instead.');
				break;
				case 3: showAlert('Sorry, we cannot process this website at this time. Homred uses an external service to check domain reputaiton and it returned an error.');
				return;
				case 4: showAlert('This website appears unreachable. You can still proceed with using this website, but please check it is working.');
				break;
				case 7: showAlert('Sorry, we had a database error: '+pErrorMsg);
				return;
			}
		}	
		gHR.newObject.au = pUri;
		gHR.newObject.s = pTitle;
		gHR.newObject.db = pFavicon;
		var vIcon = createImage(pFavicon);
		manageUriFields();
		if(vIcon){//test if this is for new homred or new channel
			if($('#homred_form').is(':visible')){//NEW / EDITED HOMRED
				delete gHR.newObject.bm;//to stop emoji from being the default icon
				if(gHR.selectedMarker){gHR.selectedMarker.setIcon(vIcon)}
			}else{//NEW / EDITED CHANNEL
				$('#hr_new_channel_favicon').html(vIcon).parent().width('10%');
			}
		} 
	} 
}

function toggleWrap(){
	//cLog('toggle Wrap called for element: '+$(this).data('hr-wrap'));
	//var vThis = $('#'+$(this).data('hr-wrap'));
	$('#'+$(this).data('hr-wrap')).toggleClass('hr-nowrap hr-wrap');//.css('height',vThis.hasClass('hr-wrap')?'37px':'17px');//.animate('height',1000);
	//$('#'+$(this).data('hr-wrap')).toggleClass('hr-wrap');//.animate('height',1000);
}
/////////////////////////////////////////////////////
//BIP39

function showRestoreWallet(){	
	if(!gMnemonic || (gMnemonic && confirm('Wallet already generated. Your current 12 words are:\n'+gMnemonic.toUpperCase()+' . Are you sure you want to restore your data from a different 12 words phrase? If yes, PLEASE ENSURE YOU WRITE DOWN THE CURRENT 12 WORDS, so that you can restore them again, if needed.')))
	{
		if(!isDesktop()){hideMenu()}
		$('#hr_mnemonics_restore, .hr-modal').show();
	}
}

function getWordsList(){
	var vThis = $(this);
	if(vThis.val().length > 2){
		var vWordHtml = "", $WordUI = $('#hr_word_list'+vThis.data('hr-word'));
		$.each( bip39.wordlists.english, function ( i, val ) {
			cLog('found word: '+val);
			if(val.startsWith(vThis.val())){
				vWordHtml += '<li data-word-number="' + vThis.data('hr-word') + '" class="hr-word-found">' + val + '</li>';
			}		
		});
		$WordUI.html(vWordHtml);
		$WordUI.listview("refresh");
		$WordUI.trigger("updatelayout");
	}
}
function addWord(){
	var vThis = $(this);
	$('#hr_w'+vThis.data('word-number')).val(vThis.text());
	$('#hr_word_list'+vThis.data('word-number')).empty();
}

function switchMenomicEnterMode(){
	if($('#hr_mnemonics_enter_string').is(':visible')){
		$('#hr_mnemonics_enter_mode').text('Or, enter words as one string');		
	}else{
		$('#hr_mnemonics_enter_mode').text('Or, enter words as a list');
	}
	$('#hr_mnemonics_enter_string, #hr_mnemonics_enter_list').toggle();
}

function restoreWallet(){
	//if wallet (mnemonic,master private key) already exists in memory (restored from IndexedDB or restored by user), do not re-create
	var vNewMnemonic;
	if($('#hr_mnemonics_enter_string').is(':visible')){
		vNewMnemonic = $('#hr_mnemonics_string').val().trim();
	}else{
		for (let i = 1; i < 13; i++) {
			if($('#hr_w'+i).val().length>2){
				vNewMnemonic += ' '+$('#hr_w'+i).val()
				cLog('word '+i);
			}else{
				showAlert('Please check word '+i);
				return;
			}
		}
	}
	cLog('mnemonic: '+vNewMnemonic);
	if(bip39.validateMnemonic(vNewMnemonic)){//if Mnemonic is given then - re-generate all addresses
		gFavs = {};
		gMnemonic = null;
		gPrimaryHDKey = {};
		gMnemonicRecordedByUser = 0;//0 not recorded, 1 - confirmed recorded
		gCurrentShowMnemonicThreshold = 0;//0 = user have not done enough interaction to bother him/her with asking to write down th emnemonic
		gAllAddressesRestored = 0;//0 = Datbase keeps returning addresses; once no address is found = set to 1 and stop address restoration process
		$('#hr_channels').empty();//DELETE ALL CHANNELS FROM UI
		Promise.all([
			cryptoStore.delete('fav'),
			cryptoStore.delete('pk'),
			cryptoStore.delete('mnemrecorded'),
			cryptoStore.delete('mnemthesh')
			])
		.then(function(){
			cLog('IndexedDB cleared from old data');
			generatePrimaryHDKey(vNewMnemonic);
		});
		gMnemonicRecordedByUser = 1;
		$('#hr_mnemonics_restore, .hr-modal').hide();
		$('.hr-words').val('');
		$('#hr_mnemonics_string').val('');
	}else{
		showAlert("Entered words are not correct.");
		return;
	}
}

function generatePrimaryHDKey(pMnemonic){//generate (when pMnemonic is null) or restore (when pMnemonic phrase is given) HDWallet
	if(!gMnemonic /*|| pMnemonic*/){
		//if wallet (mnemonic,master private key) already exists in memory (restored from IndexedDB or restored by user), do not re-create, unless user gives pre-existing mnemonic
		if(pMnemonic){//if Mnemonic is given then - re-generate wallet
			if(!bip39.validateMnemonic(pMnemonic)) {
				showAlert("Entered mnemonic words or random number are not correct.");
				return null;
			}
			gMnemonic = pMnemonic;
			//confirm Address();//cannot do it before generating wallet			
		}else{//Mnemonic is null - then generate new wallet
			gMnemonic = bip39.generateMnemonic();//https://github.com/bitcoinjs/bip39
			/*showAlert('homred adopts advanced encryption used for cryptocurrencies to maximise your data protection. If you clear your broswser data you will be able to restore your channels with the 12 words below. PLEASE WRITE THEM DOWN IN THE SAME ORDER AND KEEP IN A SECURE PLACE. NEVER SAVE THEM IN YOUR PHONE OR COMPUTER: '+gMnemonic);*/
		}
		gPrimaryHDKey = createDepth4HDKey(gMnemonic); //https://github.com/bitpay/bitcore/tree/v8.0.0/packages/bitcore-lib
		cryptoStoreSet('pk', gMnemonic);
		if(gMnemonic){confirmAddress()}
		$('#hr_words').show();		
		//privateExtendedKey = gPrimaryHDKey.privateExtendedKey();
		//publicExtendedKey = gPrimaryHDKey.publicExtendedKey();
		//cLog("gMnemonic: "+gMnemonic);
		//cLog("seed: "+seed);
		//cLog("Master Private Key: "+privateExtendedKey);
		//cLog("Master Public Key: "+publicExtendedKey);			
	}else{cLog('Wallet already generated')}	
	return gPrimaryHDKey;//creates Etherium Master HD Key object (depth 4)
}

function createDepth4HDKey(pMnemonic){//https://github.com/ethereumjs/ethereumjs-wallet
	var seed = bip39.mnemonicToSeed(pMnemonic);	
	//return HDKey.fromMasterSeed(seed).derive("m/44'/60'/0'/0");//creates HD Key object https://github.com/cryptocoinjs/hdkey , depth 0, then creates Etherium Master HD Key object (same structure, but depth 4, i.e.: //m/purpose'/coin_type'/account'/change/address_index) https://github.com/critesjosh/ethereum-address-generator-js	
	return HDKey.fromMasterSeed(seed).derive("m/44'/60'/0'/0'");//creates HD Key object https://github.com/cryptocoinjs/hdkey , depth 0, then creates Etherium Master HD Key object (same structure, but depth 4, i.e.: //m/purpose'/coin_type'/account'/change/address_index) https://github.com/critesjosh/ethereum-address-generator-js
}

function createMemberObject(pIndex){//creates depth 5 HD Key and its N-th child from Etherium Master HD Key and then generates its wallet and then address
	//https://github.com/ethereumjs/ethereumjs-wallet/blob/master/docs/classes/ethereumhdkey.md
	let 
		vIndex = parseInt(pIndex,10),
		vHDKey = generatePrimaryHDKey().deriveChild(vIndex+cHardenedOffset);
	//var vPrivateKeyBuffer = EthJS.Util.toBuffer(vHDKey.privateKey); //must convert private key to buffer, although looks the same as .privateKey and .privKeyBytes
	return {
		ei:vIndex,//MEMBER INDEX
		ej:window.EthCrypto.util.uint8ArrayToHex(vHDKey.pubKey),//MEMBER PUBKEY convert Uint8Array to hex format for portability. convert back by window.EthCrypto.util.hexToUnit8Array()
		bq:window.EthCrypto.publicKey.toAddress(vHDKey.publicKey) //MEMBER
	};
}

function createConnectionObject(pMemberIndex,pConnectorIndex){//creates depth 6 HD Key and its N-th child from Etherium Master HD Key and then generates its wallet and then address
	//https://github.com/ethereumjs/ethereumjs-wallet/blob/master/docs/classes/ethereumhdkey.md
	cLog('function createConnectionObject got pMemberIndex = '+pMemberIndex);
	let
		vMemberIndex = parseInt(pMemberIndex,10),
		vConnectorIndex = parseInt(pConnectorIndex,10),
		vHDKey = generatePrimaryHDKey().deriveChild(vMemberIndex+cHardenedOffset).deriveChild(vConnectorIndex+cHardenedOffset);
	//var vPrivateKeyBuffer = EthJS.Util.toBuffer(vHDKey.privateKey); //must convert private key to buffer, although looks the same as .privateKey and .privKeyBytes
	return {
		ei:vMemberIndex,
		es:vConnectorIndex,
		ep:window.EthCrypto.util.uint8ArrayToHex(vHDKey.publicKey),//convert Uint8Array to hex format for portability. convert back by window.EthCrypto.util.hexToUnit8Array()
		//ep:EthJS.Util.bufferToHex(vHDKey.pubKey),//convert Uint8Array to hex format for portability. convert back by EthJS.Util.toBuffer()
		//eo:EthJS.Util.privateToAddress(vPrivateKeyBuffer).toString("hex")
		eo:window.EthCrypto.publicKey.toAddress(vHDKey.publicKey)
	};
}

function signTx(pMemberIndex,pConnectorIndex,pMessage){//sign at depth 5 (member) or depth 6 (connector)
	let 
		vPrivKey,
		vMemberIndex = parseInt(pMemberIndex,10),
		vConnectorIndex = parseInt(pConnectorIndex,10)
	if(vConnectorIndex === -1){//depth 5 - sign with member privkey
		cLog('sign Tx function got no pConnectorIndex '+pConnectorIndex);
		vPrivKey = generatePrimaryHDKey().deriveChild(vMemberIndex+cHardenedOffset).privateKey;
	}else{//depth 6 - sign with connector privkey
		cLog('sign Tx function got pConnectorIndex: '+pConnectorIndex);
		vPrivKey = generatePrimaryHDKey().deriveChild(vMemberIndex+cHardenedOffset).deriveChild(vConnectorIndex+cHardenedOffset).privateKey;
	}
	var vPrivKeyHex = window.EthCrypto.util.uint8ArrayToHex(vPrivKey),
	vMessageHash = EthCrypto.hash.keccak256(pMessage);
	//return window.EthCrypto.sign(vPrivKeyHex,vMessageHash);	
	return window.EthCrypto.sign(vPrivKeyHex,vMessageHash);
}

/*function encodeMessage(pMessage) {
	var enc = new TextEncoder();
	return enc.encode(pMessage);	
}*/

/*async function signTx(pMemberIndex,pMessage){//https://github.com/paulmillr/noble-secp256k1
	return new Promise((resolve, reject) => {
		var vPrivKey = generatePrimaryHDKey().deriveChild(pMemberIndex).privateKey;
		cLog('vPrivKey: '+vPrivKey);
		var enc = new TextEncoder();
		var vEncodedMessage = enc.encode(pMessage);
		cLog('vEncodedMessage: '+vEncodedMessage);
		window.nobleSecp256k1.Secp.sign(vEncodedMessage,vPrivKey)//generatePrimaryHDKey().deriveChild(x).privKey or .privateKey
		.then(function(vSign){
			cLog('vSign: '+vSign);
			cLog('vEncodedMessage: '+vEncodedMessage);
			//resolve ({el:EthJS.Util.bufferToHex(vSign),em:EthJS.Util.bufferToHex(vEncodedMessage)});
			resolve ({el:window.EthCrypto.util.uint8ArrayToHex(vSign),em:window.EthCrypto.util.uint8ArrayToHex(vEncodedMessage)});
		});
	});
}*/
//this is for serviceside:
/*async function verifyTx(pSignature,pMessage,pPubKey){//https://github.com/paulmillr/noble-secp256k1
	return await window.nobleSecp256k1.Secp.verify(pSignature,pMessage,pPubKey);//generatePrimaryHDKey().deriveChild(x).pubKey or .publicKey
}*/

/*async function signTx(pMemberIndex,pMessage) {//https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest
  const msgUint8 = new TextEncoder().encode(pMessage);                           // encode as (utf-8) Uint8Array
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);           // hash the message
  const hashArray = Array.from(new Uint8Array(hashBuffer));                     // convert buffer to byte array
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); // convert bytes to hex string
  var vUnit8Array = new Uint8Array(hashHex);
  return generatePrimaryHDKey().deriveChild(pMemberIndex).sign(vUnit8Array);
}*/

/*function toUint8Array(pDigest){//https://stackoverflow.com/questions/34946642/convert-string-to-uint8array-in-javascript
	var result = [];
	for(var i = 0; i < pDigest.length; i+=2)
	{
		result.push(parseInt(pDigest.substring(i, i + 2), 16));
	}
	return Uint8Array.from(result);
}*/

/*function createChannelPublicKey(pIndex){//creates depth 5 HD Key and its N-th child from Etherium Master HD Key and then generates its wallet and then public key
	//https://github.com/ethereumjs/ethereumjs-wallet/blob/master/docs/classes/ethereumhdkey.md
	return generatePrimaryHDKey().deriveChild(pIndex).getWallet().getPublicKeyString(); 
}

function createConnectionObject(pMemberIndex,pInviteeIndex){//creates public key for the invited person of a channel (depth 6 HD Key for channel followers)
	return generatePrimaryHDKey().deriveChild(pMemberIndex).deriveChild(pInviteeIndex);
}*/


//function checkEmptyAddresses(){for (p in gFavs) {if(gFavs.hasOwnProperty(p) && typeof gFavs[p] === 'object' && !gFavs[p].n){return p}}}

//BIP32, BIP44 //https://vault12.com/securemycrypto/crypto-security-basics/bip39/bip32-and-bip44 
function generateMemberObject(pIncrement){//if pIncrement - duplicate address found in database, due to address deleted on client (via delete gFavs['xxx'];)
	/*var p;
	for (p in gFavs) {//this is to find any disused addresses to be recycled, so that there are no gaps in adresses
        if(gFavs.hasOwnProperty(p) && typeof gFavs[p] === 'object' && !gFavs[p].n){
			return createMemberObject(gFavs[p].ei);
		} // 2022131 caused indefinite loop, until gFavs[p].n is updated 
    }*/
	var vMemberObject, vCurrIndex = (gFavs && typeof gFavs === 'object') ? Object.keys(gFavs).length : 0;
	cLog('function generate Member Object vCurrIndex='+vCurrIndex);
	if (pIncrement){vCurrIndex+=1}
	vMemberObject = createMemberObject(vCurrIndex);
	if(gFavs[vMemberObject.bq]){//if somehow duplicate address found locally
		cLog('Address: '+vMemberObject.bq+' already exists under index '+vCurrIndex);		;
		vMemberObject = createMemberObject(vCurrIndex+=1);		
	}
	cLog("Address: "+ vMemberObject.bq);
	//cryptoStoreSet('favs', Object.keys(gFavs).join(','));//update IndexedDB //2021058 do not store just generated address before the relevant channel is created successfully in database
	return vMemberObject;	
}
function showMnemonic(){
	if(!isDesktop()){hideMenu()}
	if(gMnemonic){
		var vMnemonics = gMnemonic.split(' ');
		$('#hr_mnemonics_list').empty();
		$.each( vMnemonics, function ( i, val ) {
			$('#hr_mnemonics_list').append('<li style="padding-bottom:2px;padding-top:2px">'+val+'</li>')
		});		
		$('#hr_mnemonics_list').listview("refresh");
		$('#hr_mnemonics, .hr-modal').show();		
		if(gMnemonicRecordedByUser===0 && gCurrentShowMnemonicThreshold >= gShowMnemonicThreshold){
			//gMnemonicRecordedByUser = confirm(gMnemonicText+gMnemonic.toUpperCase()+'"')?1:0;
			$('#hr_mnemonics_confirm').show();
		}
	}
}

function cryptoStoreSet(pKey,pValue){
	return cryptoStore.set(pKey, pValue);
}
function cryptoStoreGet(pKey){
	return cryptoStore.get(pKey);
}

function checkRecordMnemonic(pInteractionWeight){//gViewHomredInteractionWeight, gVoteHomredInteractionWeight, gFollowChannelInteractionWeight, gCreateChannelInteractionWeight
	//checking if need to prompt/remind user to record mnemonic
	if(gMnemonicRecordedByUser === 0 && gCurrentShowMnemonicThreshold < gShowMnemonicThreshold){gCurrentShowMnemonicThreshold += pInteractionWeight}
	else if(gMnemonicRecordedByUser === 0){
		//gMnemonicRecordedByUser = confirm(gMnemonicText+gMnemonic.toUpperCase()+'"')?1:0;	
		showMnemonic();		
	}
}
/*function generateButtonLink(){
	
}*/
/////////////////////////////////////////////////////////
//animate map marker for clicked homred
function animateSelectedMarker(pMarker){
	/*vThis = $(this);
	vThis.css({width: "25px", transition: "0.5s"});
	vThis.css({hight: "25px", transition: "0.5s"});*/
	$('.blinking').removeClass('blinking');
	L.DomUtil.addClass(pMarker._icon, 'blinking');
}

const mapMoveTo = (pGeoPosition,pZoom) => {//https://stackoverflow.com/questions/33565068/leaflet-js-fire-event-when-setview-has-finished-the-animation-how-is-that-po
    return new Promise((resolve, reject) => {
		try{
		 vMapL.setView(pGeoPosition,pZoom);
		 resolve();
		}
		catch(e){		
			reject(cLog('cannot setView: '+e.reason));
		}
    });
};

function manageUriFields(){//manage URI fields
	if(gHR.newObject.au && gHR.newObject.au !== 0){
		if(gHR.newObject.s || !gHR.newObject.s === '0'){$('.hr-uri-title').show().text(gHR.newObject.s)}
		$('.hr-uri').val(gHR.newObject.au);
	}else{
		$('.hr-uri-title').hide().text('Add weblink (optional)');
		//$('.hr-uri').attr('placeholder','Add weblink to event');
		$('.hr-uri').val('');
	}	
}

function ensureEmojisOnly(){
	//https://stackoverflow.com/questions/37089427/javascript-find-emoji-in-string-and-parse
	var vThis = $(this),
	vValue = vThis.val();
	if(vValue && vValue !== ''){
		vValue = vValue.match(/(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu);
		if(vValue && vValue.length && vValue.length > 0){
			vThis.val(vValue.join(''));
			gHR.selectedMarker.setIcon(createImage(vValue[0]));
		}
		else{vThis.val('')}
	}
}

function ChannelsOpen(){//true if open
	return $('#channel_form').is(':visible');
}

function MenuOpen(){//true if open
	return $('#main_menu').is(':visible');
}

/*function isSmallDesktop(){
	return window.matchMedia("(min-width: 34em)").matches
}*/

function isDesktop(){
	return window.matchMedia("(min-width: 67em)").matches
}

function setInteractiveHelpStatuses(){
	cryptoStoreGet('interactivehelp').then(x =>{
		cLog('setInteractiveHelpStatuses got: '+x);
		if(!!x && x !== '' && x !== 'null' ){
			var vArray = x.split(',');
			if (vArray && vArray.length > 0){
				vArray.forEach(function(e){
					cLog('interactivehelp for: '+e);
					gHR.helpText[e].v = gHR.helpText.maxHelpShow;
				})			
			}			
		}		
		if(gHR.helpText.main.v < gHR.helpText.maxHelpShow){
			showAbout();
			gHR.helpText.main.v = gHR.helpText.main.v+1;
			cryptoStoreSet('interactivehelp', Object.keys(gHR.helpText).filter(el => gHR.helpText[el].v > 0).join());
		}
		if(gHR.helpText.main.v === gHR.helpText.maxHelpShow){$('#hr_no_splash').attr('checked', 'checked').checkboxradio("refresh")}
	});
}

/*const getTitle = (url) => {  
  return fetch(url,{mode:"no-cors"})
    .then((response) => response.text())
    .then((html) => {
      const doc = new DOMParser().parseFromString(html, "text/html");
      const title = doc.querySelectorAll('title')[0];
      return title.innerText;
    });
};*/

async function anyEncrypt(pPublicKeyHex,pMessage){//pPublicKey format: hex produced by window.EthCrypto.util.uint8ArrayToHex(vHDKey.publicKey), pMessage format: string
	try{
		var vPublicKeyUint8Array33 = window.EthCrypto.util.hexToUnit8Array(pPublicKeyHex);//returning to vHDKey.publicKey Uint8Array(33) format from portable hex format
		var vEnc = await window.EthCrypto.encryptWithPublicKey(vPublicKeyUint8Array33,pMessage);
		return window.EthCrypto.cipher.stringify(vEnc);	
	}catch(e){cLog(e)}
}
async function anyDecrypt(pPrivateKey,pEncryptedString){//pPublicKey format: vHDKey.privateKey (i.e. Uint8Array(32)), pEncryptedString format: string
	try{
		var vPrivateKeyHex = window.EthCrypto.util.uint8ArrayToHex(pPrivateKey);//hex is the required format of the decrypt function
		var vEncryptedStringParsed = window.EthCrypto.cipher.parse(pEncryptedString);
		return await window.EthCrypto.decryptWithPrivateKey(vPrivateKeyHex,vEncryptedStringParsed);		
	}catch(e){cLog(e)}
}

function replaceURLs(pText,pClass) {//https://codepremix.com/detect-urls-in-text-and-create-a-link-in-javascript
  if(!pText) return;
  let vClass = pClass ? 'class="'+pClass+'"' : '';
  let vUrlRegex = /(((https?:\/\/)|(www\.))[^\s]+)/g;
  return pText.replace(vUrlRegex, function (url) {
    let pHyperlink = url;
    if (!pHyperlink.match('^https?:\/\/')) {
      pHyperlink = 'http://' + pHyperlink;
    }
    return '<a href="' + pHyperlink + ' "'+vClass+' target="_blank" rel="noopener noreferrer">' + url + '</a>'
  });
}
function showAlert(pText){
	$('#hr_alert_text').text(pText);
	$('#hr_alert,#hr_modal').show();
}

async function symmetricEncrypt(pMemberIndex,pConnectorIndex,pOtherPartyPubKey){
	return await nobleSecp256k1.getSharedSecret(await generatePrimaryHDKey().deriveChild(pMemberIndex).deriveChild(pConnectorIndex).privKey,pOtherPartyPubKey);
}