(function () {
	window.addEventListener("tizenhwkey", function (ev) {
		console.log("Received hardwarekey: " + ev);
	});
}());

var toolbar; //From circularToolBar.js
var vlc; //From vlc.js

/* TODO:
 * input form for Name and port
 * Delete and edit from serverList
 * scan network
 * suspend Interval when not showing
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
	secToStr: function(sec) {
		var hh, mm, ss,
		    hhString, mmString, ssString;
		hh = Math.floor( sec / (60*60) );
    	sec -= hh*60*60;
    	mm = Math.floor( sec / 60 );
    	ss = sec - mm * 60;
    	hhString = (hh === 0) ? "" : ( (hh < 10) ? "0" + hh + ":" : hh + ":");
    	mmString = (mm < 10) ? "0" + mm :  "" + mm;
    	ssString = (ss < 10) ? "0" + ss :  "" + ss;
    	
    	return hhString + mmString + ":" + ssString;
	},
    updateView: function () {
    	document.getElementById("serverName").innerHTML = vlc.serverName;
    	document.getElementById("serverIP").innerHTML = vlc.serverIP;
    	
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
    	
    	document.getElementById("seek").innerHTML = app.secToStr(vlc.seek);
    	document.getElementById("length").innerHTML = app.secToStr(vlc.length);
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
    	//get my IP
    	function successCallback(wifi) {
    		app.myip = wifi.ipAddress;
    		document.getElementById("inputIP").value = app.myip;
	    }
		function errorCallback(error) {
	        console.log("Wifi Not supported: " + error.message);
	    }
	    tizen.systeminfo.getPropertyValue("WIFI_NETWORK", successCallback, errorCallback);
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
    	app.rotate = app.scroll;
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
    		for (i=vlc.serverList.length-1;i>=0;i++) {
    			li = document.createElement("li");
    			li.innerHTML = '<span class="serverListName">' + vlc.serverList[i].serverName + '</span>' + 
    						   '<span class="serverListIP">' + vlc.serverList[i].serverIP + '</span>';
    			li.addEventListener("click",app.initVLCconnection(i));
    			li.classList.add("ui-snap-listview-item");
    			li.children[1].style.color="yellow";
    			list.appendChild(li);
    			vlc.testServer(vlc.serverList[i].serverIP,vlc.serverList[i].serverPort,colorSetter(li,"green"),colorSetter(li,"red"));
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
    		if (lastView !== "message") {
    			app.back = function(ev) {
    				app.show(lastView); 
    				if (ev) {
    					ev.stopPropagation();
    				}
    			};
    		}
    		app.view=view;
    	}
    },
    addVLCconnection: function() {
    	var server = {};
    	server.serverIP   = document.getElementById("inputIP").value;
    	server.password   = document.getElementById("inputPassword").value;
    	server.serverPort = document.getElementById("inputPort").value;
    	server.serverName = document.getElementById("inputName").value;
    	
    	vlc.serverList[vlc.serverList.length] = server;
    	
    	localStorage.setItem("serverList",JSON.stringify(vlc.serverList));
    	
    	vlc.connect(vlc.serverList.length - 1);
    },
    initVLCconnection: function(id) {
    	return function () {
    		var index=id;
    		vlc.connect(index);
    	};
    },
    /*value: 0-200*/
    setVol: function(value) {
    	var valueLow, valueMid, valueHigh;
    	
    	value = (value>512) ? 70 : Math.round(value*70/512);
    	valueLow = (value > 40) ? 40 : value;
    	value = (value > 40) ? value - 40 : 0;
    	valueMid = (value > 15) ? 15 : value;
    	valueHigh = (value > 15) ? value - 15 : 0;
    	document.getElementById("volHigh").style.top=(30-valueHigh) + "%";
    	document.getElementById("volMid").style.top=(45-valueMid) + "%";
    	document.getElementById("volLow").style.top=(85-valueLow) + "%";
    },
    setPlayProgress: function(value) {
    	value = Math.round(value *70/100);
    	document.getElementById("playProgress").style.right = (85-value) + "%";
    }
};

function colorSetter(element,color) {
	var that = element;
	return function() {
		that.children[1].style.color=color;
	};
}

window.addEventListener("load", app.init);