var app; //from app.js

var vlc = {
	serverList: [],
	server: {
		name: "VLCTest",
		ip: "",
		password: "",
		port: "8080",	
	},
	timeoutForHTTPRequest: 4000,
	
	init: function() {
		console.log("reading serverList");
		//vlc.serverList = JSON.parse(localStorage.getItem("serverList")) || [];
		console.log("serverList: "+vlc.serverList.length);
	},
	incVol: function() {
		if (vlc.volume >= 499 ) {
			vlc.makeRequest('command=volume&val=512',
					null, //onSuccess
					vlc.onDisconnect,  //onErrorCode
					vlc.onDisconnect,  //onTimeout
					vlc.onDisconnect   //onConnError
			);
		}
		vlc.makeRequest('command=volume&val=%2B13',
				null, //onSuccess
				vlc.onDisconnect,  //onErrorCode
				vlc.onDisconnect,  //onTimeout
				vlc.onDisconnect   //onConnError
		);
	},
	decVol: function() {
		if (vlc.volume <= 5) {
			vlc.makeRequest('command=volume&val=0',
					null, //onSuccess
					vlc.onDisconnect,  //onErrorCode
					vlc.onDisconnect,  //onTimeout
					vlc.onDisconnect   //onConnError
			);
		}
		vlc.makeRequest('command=volume&val=-13',
				null, //onSuccess
				vlc.onDisconnect,  //onErrorCode
				vlc.onDisconnect,  //onTimeout
				vlc.onDisconnect   //onConnError
		);
	},
	makeRequest: function (request, handlerSuccess, handlerErrorCode, handlerTimeout, handlerConnError) {
		request = request || '';
		handlerSuccess   = handlerSuccess   || function() {};
		handlerTimeout   = handlerTimeout   || function() {};  
		handlerErrorCode = handlerErrorCode || function() {};
		handlerConnError = handlerConnError || function() {};
		
		var xhr = new XMLHttpRequest();
		xhr.open('GET', 'http://' + vlc.server.ip + ':' + vlc.server.port + '/requests/status.json?' + request, true);
		console.log("connecting with password " + vlc.server.password);
		xhr.setRequestHeader("Authorization", "Basic " + window.btoa(":" + vlc.server.password));
		xhr.timeout = vlc.timeoutForHTTPRequest;
		xhr.onload = function() {
			
			if (xhr.readyState === 4) {
				app.abort = function(){};
				app.closeView("spinner");
				if (xhr.status === 200) {
					if (xhr.responseText) {
						var res    = JSON.parse(xhr.responseText),
						    title  = res.information || {};
						
						title  = title.category || {};
						title  = title.meta || {};
						title  = title.filename || '--';
						vlc.title    = title;
						vlc.status   = res.state.toLowerCase();
						vlc.volume   = res.volume || 0;
						vlc.length   = res.length || 0;
						vlc.seek     = res.time || 0;
						vlc.progress = Math.round(vlc.seek *100 / vlc.length);
						handlerSuccess(xhr);
						app.updateView();
					} else {
						console.log('Invalid response received! ' + JSON.stringify(xhr));
						//sendAppMessage('Error: Invalid response received!');
					}
				} else {
					console.log('Request returned error code ' + xhr.status.toString());
					handlerErrorCode(xhr);
					//sendAppMessage('Error: ' + xhr.statusText);
				}
			}
		};
		xhr.ontimeout = function() {
			app.closeView("spinner");
			console.log('HTTP request timed out');
			handlerTimeout(xhr);
		}; 
		xhr.onerror = function() {
			app.closeView("spinner");
			console.log('HTTP request return error');
			handlerConnError(xhr);
		};
		xhr.send(null);
		return xhr;
	},
	connect: function(server) {
		var xhr,id;
		if (vlc.connecting) {return; }
		
		if ((typeof server) !== "object") {
			id = server;
			server = vlc.serverList[server];
		} else {
			id = server.id;
			delete server.id;
		}

		console.log("Connecting to " + JSON.stringify(server));
		
		vlc.server = server;
		vlc.connecting = true;
		
		xhr = vlc.makeRequest("", 
			function() {  //onSuccess
				vlc.serverList[id] = server;
				app.writePrefs();
				app.closeView("server");
				app.show("remote");
				if (vlc.watcher) {
					window.clearInterval(vlc.watcher);
					vlc.watcher=null;
				}
	    		vlc.watcher=window.setInterval(vlc.updateStatus, 1000);
	    		vlc.connecting = false;
			}, 
			function(xhr) {
				app.showMessage("Could not connect to server: Error code " + xhr.status.toString());
				vlc.connecting = false;
			},
			function() {
				app.showMessage("No response from server " + vlc.serverIP);
				vlc.connecting = false;
			},
			function() {
				app.showMessage("Failed to connect");
				vlc.connecting = false;			
			}
		);
		app.abort = function() {
			console.log("aborting connection");
			xhr.abort();
			app.onback = function() {};
			vlc.connecting = false;
		};
	},
	disconnect: function() {
		if (vlc.watcher) {
			window.clearInterval(vlc.watcher);
			vlc.watcher=null;
		}
	},
	onDisconnect: function() {
		vlc.disconnect();
		app.closeView("remote");
		app.showMessage("Server disconnected");
	},
	testServer: function(ip,port,handlerSuccess,handlerError) {
		handlerSuccess= handlerSuccess || function() {};
		handlerError  = handlerError   || function() {};
		
		var xhr = new XMLHttpRequest();
		xhr.open('GET', 'http://' + ip + ':' + port + '/requests/status.json', true);
		xhr.timeout = 12000;
		var handler = function() {
			var success = false;
			if ( (xhr.status < 300) && (xhr.status >= 200) ) {
				success = true;
			}
			if ( xhr.status === 401 ) {
				console.log("401 received");
				success = true;
			}
			console.log("Status "+xhr.status);
			if (success) {
				console.log("executing Success");
				handlerSuccess();
			} else {
				console.log("executing Error");
				handlerError();
			}
		};
		xhr.onerror = xhr.onload = handler;
		xhr.ontimeout = handlerError;
		xhr.send();
	},
	updateStatus: function() {
		vlc.makeRequest("",
					null, //onSuccess
					vlc.onDisconnect,  //onErrorCode
					vlc.onDisconnect,  //onTimeout
					vlc.onDisconnect   //onConnError
				);
	}
};