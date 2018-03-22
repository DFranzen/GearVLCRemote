(function () {
	window.addEventListener("tizenhwkey", function (ev) {
		console.log("Received hardwarekey: " + ev);
	});
}());

var toolbar; //From circularToolBar.js
var vlc; //From vlc.js

/* TODO:
 * input form for Name and port
 * default values for input elements
 * Deactivate during makeRequest
 * Indicatoren für online servers
 * scan network
 */

/* Git IP adress:
 * function successCallback(wifi) {
    	console.log("Status: " + wifi.status +  "    SSID: " + wifi.ssid
        + "\nIP Address: " + wifi.ipAddress  + "    Signal Strength: " + wifi.signalStrength);
    }
 * function errorCallback(error) {
        console.log("Wifi Not supported: " + error.message);
    }
    tizen.systeminfo.getPropertyValue("WIFI_NETWORK", successCallback, errorCallback);
 */

var app = {
	back: function () {},
	rotate: function () {},
	scroll: function(e) {
		var scroller=document.getElementsByClassName("ui-scroller")[0];
	    if (e.detail.direction === "CW") {
	    	scroller.scrollTop+=50;
	    } else if (e.detail.direction === "CCW") {
	    	scroller.scrollTop-=50;
	    }
	},	
    updateView: function () {
    	document.getElementById("serverName").innerHTML = vlc.serverName;
    	document.getElementById("serverIP").innerHTML = vlc.serverIP;
    	document.getElementById("whatson").innerHTML = vlc.title;
    	if (vlc.status === "playing") {
    		document.getElementById("play").style.display = "none";
    		document.getElementById("pause").style.display = "block";
    	} else {
    		document.getElementById("pause").style.display = "none";
    		document.getElementById("play").style.display = "block";
    	}
    },
    init: function () {
    	
    	//Load 
    	var lastIP = localStorage.getItem("lastIP");
    	var lastPassword = localStorage.getItem("lastPassword");
    	if (lastIP !== null) {
    		document.getElementById("inputIP").value=lastIP;
    	}
    	if (lastPassword !== null) {
    		document.getElementById("inputPassword").value = lastPassword;
    	}
    	window.addEventListener("tizenhwkey", function (ev) {
    		if (ev.keyName === "back") {
    			app.back(ev);
    		}
    	});
    	//Init remote View
    	toolbar.setPosition("btn1", 0);
    	toolbar.setPosition("btn2", 1);
    	toolbar.setPosition("btn3", -1);
    	document.getElementById("btn3").addEventListener("click", function(){vlc.makeRequest("command=seek&val=-10S");});
    	document.getElementById("btn2").addEventListener("click", function(){vlc.makeRequest("command=seek&val=%2B10S");});
    	document.getElementById("btn1").addEventListener("click", function(){vlc.makeRequest("command=pl_pause");});
    	
    	vlc.init();
    	
    	//Init Server view 
    	toolbar.setPosition("btnGo", 0);
    	document.getElementById("btnGo").addEventListener("click", app.addVLCconnection);
		
    	document.addEventListener('rotarydetent', function(ev){app.rotate(ev);});
    	
    	app.show("serverList");
    },
    hideView: function (view) {
    	var i,
    		divs=document.getElementsByClassName(view);
		for (i=0;i<divs.length;i++) {
			divs[i].style.display="none";
		}
    },
    hideAllViews: function() {
    	if (app.snapList) {
    		app.snapList.destroy();
    		app.snapList = null;
    	}
    	
    	app.hideView("viewServer");
    	app.hideView("viewRemote");
    	app.hideView("viewMessage");
    	app.hideView("viewServerList");
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
    show: function(view) {
    	if (view==="remote") {
    		app.view=view;
    		app.hideAllViews();
    		app.showView("viewRemote");
    		
    		app.back=function(ev) {
    			vlc.disconnect();
    			app.show("serverList"); 
    			if (ev) {
    				ev.stopPropagation();
    			}
    		};
    	} else if (view==="server") {
    		app.hideAllViews();
    		app.showView("viewServer");	
    		
    		app.view=view;
    		app.back = function(ev) {
    			app.show("serverList"); 
    			if (ev) {
    				ev.stopPropagation();
    			}
    		};
    	} else if (view==="serverList") {
    		app.hideAllViews();
    		app.showView("viewServerList");
    		app.view=view;
    		app.back = function() {tizen.application.getCurrentApplication().exit();};
    		app.rotate = app.scroll;
    		
    		// init list:
    		if (app.snapList) {
    			app.snapList.destroy();
    		}
    		var i,li,
    			list=document.getElementById("serverList");
    		list.innerHTML = "";
    		for (i=0;i<vlc.serverList.length;i++) {
    			li = document.createElement("li");
    			li.innerHTML = '<span class="serverListName">' + vlc.serverList[i].serverName + '</span>' + 
    						   '<span class="serverListIP">' + vlc.serverList[i].serverIP + '</span>';
    			li.addEventListener("click",app.initVLCconnection(i));
    			list.appendChild(li);
    		}
    		li = document.createElement("li");
			li.innerHTML = 'Add new server';
			li.addEventListener("click",function(){app.show("server");});
			list.appendChild(li);
    		//app.snapList = tau.helper.SnapListStyle.create(list);
    		//app.snapList.destroy(); //The handlers don't work here, so disable them.
    	} else if (view==="message") {
    		app.hideAllViews();
    		app.showView("viewMessage");	
    		var lastView=app.view;
    		app.back = function(ev) {
    			app.show(lastView); 
    			if (ev) {
    				ev.stopPropagation();
    			}
    		};
    		app.view=view;
    	}
    },
    addVLCconnection: function() {
    	var server = {};
    	server.serverIP = document.getElementById("inputIP").value;
    	server.password = document.getElementById("inputPassword").value;
    	server.serverName = "new server";
    	server.serverPort = "8080";
    	
    	vlc.serverList[vlc.serverList.length] = server;
    	
    	localStorage.setItem("serverList",JSON.stringify(vlc.serverList));
    	
    	vlc.connect(vlc.serverList.length - 1);
    },
    initVLCconnection: function(id) {
    	return function () {
    		var index=id;
    		vlc.connect(index);
    	};
    }
};

window.addEventListener("load", app.init);