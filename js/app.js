(function () {
	window.addEventListener("tizenhwkey", function (ev) {
		console.log("Received hardwarekey: " + ev);
	});
}());

var toolbar; //From circularToolBar.js
var tau; //From tau.js
var vlc; //From vlc.js
var serverView; //from serverView.js
var serverListView; // from serverListView.js
//From aux.js:
var secToStr;

/* TODO:
 * scan network
 * suspend Interval when not showing
 */

/* DONE
 * Delete and edit from serverList
 * Fix error in server list
 * clean views on startup
 * Added CSP
 * Progress marker
 */

var app = {
	viewStack: [],
	closeView: function(view) {
		// if view is provided only close the given view
		if ( (view !== undefined) && (view !== app.currentView()) ) {
			return;
		}
		
		app.viewStack.pop();
		if (app.viewStack.length === 0) {
			tizen.application.getCurrentApplication().exit();
		}
		app.show(app.currentView());
		//remove the view we have just added again
		app.viewStack.pop();
	},
	back: function () {
		if (app.onback()) {
			app.closeView();
		}
	},
	currentView : function() {
		return app.viewStack[app.viewStack.length-1];
	},
	
	onback: function() {return true;},
	rotate: function () {},
	abort: function () {},
	scroll: function(e) {
		var scroller=document.getElementsByClassName("ui-scroller")[0];
	    if (e.detail.direction === "CW") {
	    	scroller.scrollTop+=50;
	    } else if (e.detail.direction === "CCW") {
	    	scroller.scrollTop-=50;
	    }
	},	
    updateView: function () {
    	//remoteView:
    	document.getElementById("serverName").innerHTML = vlc.server.name;
    	document.getElementById("serverIP").innerHTML = vlc.server.ip;
    	
    	var div = document.getElementById("whatson");
    	var currTitle = div.innerHTML;
    	// if marquee is setup the title is one level deeper
    	if (div.children[0]) {
    		currTitle = div.children[0].innerHTML;
    	}
    	if (currTitle !== vlc.title) {
    		if (app.marquee) {
        		app.marquee.destroy();
        		app.marquee = null;
        	}
    		div.innerHTML = vlc.title;
    		app.marquee = tau.widget.Marquee(div);
    		app.marquee.reset();
    		app.marquee.options.iteration = "infinite";
    		app.marquee.options.ellipsisEffect="ellipsis";
    		app.marquee.start();
    	}
    	
    	if (vlc.status === "playing") {
    		document.getElementById("play").style.display = "none";
    		document.getElementById("pause").style.display = "block";
    	} else {
    		document.getElementById("pause").style.display = "none";
    		document.getElementById("play").style.display = "block";
    	}
    	app.setVol(vlc.volume);
    	app.setPlayProgress(vlc.progress);
    	
    	document.getElementById("seek").innerHTML = secToStr(vlc.seek);
    	document.getElementById("length").innerHTML = secToStr(vlc.length);
    },
    init: function () {
    	// get Information:
    	app.readPrefs();
    	
    	// my IP
    	function successCallback(wifi) {
    		app.myip = wifi.ipAddress;
    		document.getElementById("inputIP").value = app.myip;
	    }
		function errorCallback(error) {
	        console.log("Wifi Not supported: " + error.message);
	        app.myip="192.168.1.100";
	    }
		try {
			tizen.systeminfo.getPropertyValue("WIFI_NETWORK", successCallback, errorCallback);
		} catch (err) {
			app.myip="192.168.1.100";
		}
    	app.fullHeight = window.innerHeight;
    	
    	//register input handlers
    	window.addEventListener("tizenhwkey", function (ev) {
    		if (ev.keyName === "back") {
    			app.back();
    			ev.stopPropagation();
    		}
    	});
    	//for Keybord show/hide
    	window.addEventListener("resize", app.onResize);
    	//for longpress
    	window.addEventListener("touchstart", app.handleLongPressStart);
    	window.addEventListener("touchstop", app.handleLongPressCancel);
    	window.addEventListener("touchmove", app.handleLongPressCancel);
    	//for lunette
    	document.addEventListener('rotarydetent', function(ev){app.rotate(ev);});
    	
    	//Init remoteView
    	toolbar.setPosition("btn1", 0);
    	toolbar.setPosition("btn2", 1);
    	toolbar.setPosition("btn3", -1);
    	document.getElementById("btn3").addEventListener("click", function(){vlc.makeRequest("command=seek&val=-10S");});
    	document.getElementById("btn2").addEventListener("click", function(){vlc.makeRequest("command=seek&val=%2B10S");});
    	document.getElementById("btn1").addEventListener("click", function(){vlc.makeRequest("command=pl_pause");});
    	
    	//Init modules
    	serverListView.init();
    	serverView.init();
    	vlc.init();
    	
    	//Create options file, if it already exists throws exception.
    	tizen.filesystem.resolve(
			"documents", 
			function(dir) {
				dir.createFile("VLCRemote.cnf");
			},
			function(e) {
				console.log("Error " + e.message);
			}
		);
    	
    	app.show("serverList");
    },
    onResize: function() {
    	if (window.innerHeight === app.fullHeight) {
    		app.onKeybordHide();
    	} else {
    		app.onKeybordShow();
    	}
    },
    onKeybordShow: function() {
    	serverView.onKeyboardShow();
    },
    onKeybordHide: function() {
    	serverView.onKeyboardHide();
    },
    hideView: function (view) {
    	var i,
    		divs=document.getElementsByClassName(view);
		for (i=0;i<divs.length;i++) {
			divs[i].style.display="none";
		}
    },
    hideAllViews: function() {
    	app.hideView("view");
    },
    showView: function (view) {
    	var i,
    	    divs=document.getElementsByClassName(view);
		for (i=0;i<divs.length;i++) {
			divs[i].style.display="block";
		}
    },
    showMessage: function (message) {
    	app.show("message");
    	document.getElementById("messageContent").innerHTML = message;
    },
    handleLongPressStart: function(e) {
    	console.log("LPstart");
    	app.longpressExec = false;
    	var elem = e.target;
    	while (elem !== null && !elem.longpress) {
    		elem = elem.parentElement;
    	}
    	if (elem ===null) {
    		return;
    	}
    	//longpress does not show
    	app.LPelem = elem;
    	elem.classList.add("longpress");
		app.LPtimeout = window.setTimeout(function(){app.handleLongPress(e);}, 1000);
		return;
    },
    handleLongPressCancel: function() {
    	if (app.LPelem === undefined) {
    		return;
    	}
    	console.log("LPcancel");
    	app.longpressExec = false;
    	var elem = app.LPelem;
    	delete app.LPelem;
    	
    	console.log("found longpressed item: " + elem.innerHTML);
    	elem.classList.remove("longpress");
    	//Does not clear!!!
    	window.clearTimeout(app.LPtimeout);
    },
    handleLongPress: function(e) {
    	if (app.LPelem === undefined) {
    		return;
    	}
    	console.log("LP!!!");
    	var elem = app.LPelem;
    	delete app.LPelem;
    	app.longpressExec = true;
    	
    	console.log("found longpressed item: " + elem.innerHTML);
    	elem.classList.remove("longpress");
    	//Does not clear!!!
    	elem.longpress(e);
    },
    show: function(view) {
    	app.rotate = app.scroll;
    	app.onback = function() {return true;};
    	app.lastView = null;
    	if (view==="remote") {
    		app.hideAllViews();
    		app.showView("viewRemote");
    		
    		app.onback=function() {
    			vlc.disconnect(); 
    			return true;
    		};
    		app.rotate = function(e) {
    		    if (e.detail.direction === "CW") {
    		    	vlc.decVol();
    		    } else if (e.detail.direction === "CCW") {
    		    	vlc.incVol();
    		    }
    		};
    	} else if (view==="server") {
    		app.hideAllViews();
    		app.showView("viewServer");	
    	} else if (view==="serverList") {
    		app.hideAllViews();
    		app.showView("viewServerList");
    		serverListView.show();
    	} else if (view==="message") {
    		if (app.currentView() === "message") {
    			return;
    		}
    		app.hideAllViews();
    		app.showView("viewMessage");	
    	} else if (view==="spinner") {
    		app.hideAllViews();
    		app.showView("viewSpinner");
    		app.onback = function () {
    			app.abort();
    			return true;
    		};
    	} else {
    		return;
    	}
    	app.viewStack.push(view);
    },
    showSpinner: function(msg) {
    	document.getElementById("spinnerText").innerHTML = msg;
    	app.onBack=function() {};
    	app.show("spinner");
    },
    /*value: 0-200*/
    setVol: function(value) {
    	var valueLow, valueMid, valueHigh;
    	
    	// Remap value to a scale 0..70
    	value = (value>512) ? 70 : Math.round(value*70/512);
    	valueLow = (value > 35) ? 35 : value; //35 % display space correspond to 100% vol in VLC (green area)
    	value = (value > 35) ? value - 35 : 0;
    	valueMid = (value > 5) ? 5 : value;  // 5% display space correspond to 12% vol in VLC (yellow area)
    	valueHigh = (value > 5) ? value - 5 : 0;
    	// the top 15% and bottom 15% are not visible
    	document.getElementById("volHigh").style.top=((100-15-35-5)-valueHigh) + "%";
    	document.getElementById("volMid").style.top=((100-15-35)-valueMid) + "%";
    	document.getElementById("volLow").style.top=((100-15)-valueLow) + "%";
    },
    setPlayProgress: function(value) {
    	value = Math.round(value *70/100);
    	document.getElementById("playProgress").style.right = (85-value) + "%";
    },
    writePrefs: function() {
    	var prefText = JSON.stringify({"serverList":vlc.serverList});
    	tizen.filesystem.resolve(
			"documents", 
			function(dir) {
				var file = dir.resolve("VLCRemote.cnf");
				file.openStream(
					"w",
					function(fs) {
						console.log("got filehandler");
						fs.write(prefText);
						fs.close();
					},
					function(e) {
						console.log("Error " + e.message);
					}, 
					"UTF-8"
				);
    		}
    	);
    },
    readPrefs: function() {
    	tizen.filesystem.resolve("documents", function(dir) 
    		    {
    		       var file = dir.resolve("VLCRemote.cnf");
    		       file.openStream(
    		    	    "r", 
    				    function(fs) {
    		                var prefText = fs.read(file.fileSize);
    		                fs.close();
    		                vlc.serverList = JSON.parse(prefText).serverList || [];
    		                serverListView.showList();
    		            }, function(e) {
    		                console.log("Error " + e.message);
    		            }, "UTF-8");
    		    });
    }
};

window.addEventListener("load", app.init);