var app; 			 //from app.js
var serverListView;  // from serverListView.js

var vlc = {
	serverList: [],
	server: {
		name: "VLCTest",
		ip: "",
		password: "",
		port: "8080",	
	},
	scannedList: [],
	timeoutForHTTPRequest: 12000,
	timeoutForOnlineRequests: 4000,
	timeoutForScanRequest: 800,
	afterRequestTime: 350,
	afterBatchTime: 10000,
	finished: 0,
	batch: 0,
	progress: 0,
	abortScan : false,
	
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
					vlc.onDisconnect	//onTimeout
			);
		}
		vlc.makeRequest('command=volume&val=%2B13',
				null, //onSuccess
				vlc.onDisconnect,  //onErrorCode
				vlc.onDisconnect  //onTimeout
		);
	},
	decVol: function() {
		if (vlc.volume <= 5) {
			vlc.makeRequest('command=volume&val=0',
					null, //onSuccess
					vlc.onDisconnect,  //onErrorCode
					vlc.onDisconnect   //onTimeout
			);
		}
		vlc.makeRequest('command=volume&val=-13',
				null, //onSuccess
				vlc.onDisconnect,  //onErrorCode
				vlc.onDisconnect  //onTimeout
		);
	},
	scanAll: function() {
		console.log("Download API available? " + tizen.systeminfo.getCapability("http://tizen.org/feature/download"));
		console.log("download API: " + JSON.stringify(tizen.download));
		var baseIp = app.myip;
		var lastIndex = baseIp.lastIndexOf('.');
		baseIp = baseIp.substring(0, lastIndex+1);
		console.log("Scanning subnet " + baseIp + "*");
		vlc.scannedList = [];
		serverListView.showList();
		vlc.finished = 0;
		vlc.progress = 0;
		vlc.abortScan = false;
		for (var i = 0; i < 3;i++) {
			vlc.scanIp(baseIp,i,3);
		}
	},
	scanIp: function(baseIp, startIp, threads) {
		threads = threads || 1;
		vlc.progress = Math.max(vlc.progress, startIp*100/255);
		document.getElementById("scanMsg").innerHTML = Math.trunc(vlc.progress) + '%';
		
		var breakTime = vlc.afterRequestTime;
		console.log("Sending request " + vlc.batch + " in this batch");
		vlc.batch++;
		
		// handle end of scan
		if ( ( vlc.abortScan) || (startIp > 255) ) {
			console.log("Thread " + (startIp % threads) + " finished in position " + (++vlc.finished));
			if (vlc.finished === threads) {
				console.log("All Threads finished. Found " + vlc.scannedList.length + " VLCs");
			}
			document.getElementById("ScanInProgress").remove();
			return;
		}
		
		// handle break after one batch
		if (vlc.batch > 20 ) {
			breakTime = vlc.afterBatchTime;
			console.log("++++ Pause +++++");
		}
		
		console.log("Scanning on ip " + startIp);
		vlc.testServerAvailable(baseIp+startIp,"8080",function(){
			console.log('Found VLC on ' + startIp);
			vlc.scannedList.push({ip:baseIp+startIp});
			serverListView.showList();
			
			setTimeout( function() {
				if ( (breakTime > 1000 ) && (vlc.batch > 20 ) ) {
					vlc.batch = 0;
				}
				vlc.scanIp(baseIp,startIp + threads, threads);
			}, breakTime);
		},function() {
			console.log('HTTP request return error on ' + startIp);
			setTimeout( function() {
				if ( (breakTime > 1000 ) && (vlc.batch > 20 ) ) {
					vlc.batch = 0;
				}
				vlc.scanIp(baseIp,startIp + threads, threads);
			}, breakTime);
		}, vlc.timeoutForScanRequest);
	},
	makeRequest: function (request, handlerSuccess, handlerError, handlerTimeout, timeout) {
		request = request || '';
		handlerSuccess   = handlerSuccess   || function() {};
		handlerTimeout   = handlerTimeout   || function() {};  
		handlerError     = handlerError     || function() {};
		timeout          = timeout    		|| vlc.timeoutForHTTPRequest;
		
		var downloadRequest = new tizen.DownloadRequest('http://' + vlc.server.ip + ':' + vlc.server.port + '/requests/status.json?' + request, 'downloads');
		console.log("connecting with password " + vlc.server.password);
		downloadRequest.httpHeader.Authorization = "Basic " + window.btoa(":" + vlc.server.password);
		var cleanup = function() {
			app.abort = function(){};
			app.closeView("spinner");
			try { tizen.download.cancel(downloadId);  } catch (e) {}
	    	try { tizen.download.abandon(downloadId); } catch (e) {}
	    	try { clearTimeout(timeoutHandler);       } catch (e) {}
		};
		
		var listener = {
			    /* When the download is completed */
			    oncompleted: function(id, path) {
			    	cleanup();
			    	console.log("available (path: " + path + "-> executing Success");
			    	tizen.filesystem.resolve(path, function(file) {
			    		file.readAsText(
			    				function(str) {
					    			var res    = JSON.parse(str),
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
									handlerSuccess();
									app.updateView();
					    		}, // readAsText.onSuccess
			    		function(e) {
			    			console.log("Error reading response: " + e.message);
			    		}, // readAsText.onError
			    		"UTF-8");
			    	}, // resolve.onSuccess
			    	function(e) {
			    		console.log("Error opening response: " + e.message);
			    	}, // resolve.onError
			    	"r");
			    },
			    /* When the download fails */
			    onfailed: function(id, error) {
			    	cleanup();
			    	console.log('Request returned error ' + error.message.toString());
					handlerError(error);
			    }
			};
		var downloadId = tizen.download.start(downloadRequest, listener);
		var timeoutHandler = setTimeout(function (){
			cleanup();
			
			app.closeView("spinner");
			console.log('HTTP request timed out');
			handlerTimeout();
		}, timeout);
		return {abort: function() {
			try { tizen.download.cancel(downloadId);  } catch (e) {}
	    	try { tizen.download.abandon(downloadId); } catch (e) {}
	    	try { clearTimeout(timeoutHandler);       } catch (e) {}
		}};
	},
	connect: function(server) {
		var id;
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
		
		var download = vlc.makeRequest("", 
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
			function(error) { //onErrorCode
				if (error.message.indexOf("401") >= 0) {
					error = "Wrong password (401)";
				}
				app.showMessage("Failed to connect to server: " + error);
				vlc.connecting = false;
			},
			function() { // onTimeout
				app.showMessage("No response from server " + vlc.server.ip + "<br>Restart VLC");
				vlc.connecting = false;
			}
		);
		app.abort = function() {
			console.log("aborting connection");
			
			download.abort();
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
		//if (app.currentView() === "remote") {
			app.closeView("remote");
			app.showMessage("Server disconnected");
		//}
	},
	testServerAvailable: function(ip,port,handlerSuccess,handlerError, timeout, password) {
		handlerSuccess= handlerSuccess || function() {};
		handlerError  = handlerError   || function() {};
		password = password || "noPass"; // Default password, for when no password is provided. -> only 401 response counts
		
		var downloadRequest = new tizen.DownloadRequest('http://' + ip + ':' + port + '/requests/status.json', 'downloads');
		downloadRequest.httpHeader.Authorization = "Basic " + window.btoa(":"+password);
		var cleanup = function() {
			try { tizen.download.cancel(downloadId);  } catch (e) {}
	    	try { tizen.download.abandon(downloadId); } catch (e) {}
	    	try { clearTimeout(timeoutHandler);       } catch (e) {}
		};
		var listener = {
			    /* When the download is completed */
			    oncompleted: function() {
			    	cleanup();
			    	console.log("available -> executing Success");
					handlerSuccess();
			    },
			    /* When the download fails */
			    onfailed: function(id, error) {
			    	cleanup();
			        if (error.message.includes("401")) {
			        	console.log("available but password protected -> executing Success");
						handlerSuccess();
			        } else {
			        	console.log("Unknown error (" + error.message  + ") -> executing Error");
						handlerError();
			        }
			    }
			};
		var downloadId = tizen.download.start(downloadRequest, listener);
		var timeoutHandler = setTimeout(function (){
			//Timeout -> Server is not available
			cleanup();
			console.log("timeout -> executing Error");
			handlerError();
		}, timeout);
	},
	updateStatus: function() {
		vlc.makeRequest("",
					null, //onSuccess
					vlc.onDisconnect,  //onError
					vlc.onDisconnect,  //onTimeout
					800
				);
	}
};