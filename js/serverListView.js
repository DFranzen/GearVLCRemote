var app;     // from app.js
var toolbar; // from app.js
var vlc;     // from vlc.js
var serverView; // from serverView.js
var HTML_getdef; // from aux.js
var colorSetter; // from aux.js

var serverListView = {
		status: "select", //could be "select", "edit", "delete", "add", "scan"
		init: function() {
			serverListView.status = "select";
			
	    	//Init Main Menu
	    	toolbar.setPosition("btnAdd", 0);
	    	toolbar.setPosition("btnDelete", 1);
	    	toolbar.setPosition("btnEdit", -1);
	    	document.getElementById("btnEdit").addEventListener("click",   serverListView.Edit_onClick);
	    	document.getElementById("btnDelete").addEventListener("click", serverListView.Delete_onClick);
	    	document.getElementById("btnAdd").addEventListener("click",    serverListView.Add_onClick);
	    	
	    	// Init Edt Menu
	    	toolbar.setPosition("btnEditEdit", 0);
	    	toolbar.setPosition("btnEditUp"  , 1);
	    	toolbar.setPosition("btnEditDown", -1);
	    	document.getElementById("btnEditEdit").addEventListener("click",   serverListView.EditEdit_onClick);
	    	document.getElementById("btnEditUp"  ).addEventListener("click",   serverListView.EditUp_onClick);
	    	document.getElementById("btnEditDown").addEventListener("click",   serverListView.EditDown_onClick);
	    	
	    	
		},
		show: function() {
			app.rotate = app.scroll;
    		
			// init menu
			document.getElementById("topMenuBtns").style.display="block";
			document.getElementById("edtMenuBtns").style.display="none";
    		// init list:
			serverListView.status = "select";
    		serverListView.showList();
    		//app.snapList = tau.helper.SnapListStyle.create(list);
    		//app.snapList.destroy(); //The handlers don't work here, so disable them.
		},
		showList: function() {	
	    	if (app.snapList) {
				app.snapList.destroy();
			}
			var i,li,
			list=document.getElementById("serverList");
			list.innerHTML = "";
			
			//Populate the List
			switch (serverListView.status) {
				case "select":
				case "edit":
				case "delete":
					for (i=vlc.serverList.length-1;i>=0;i--) {
						li = document.createElement("li");
						li.longpress = serverListView.generate_li_onLP(i);
						li.innerHTML = '<span class="serverListName">' + vlc.serverList[i].name + '</span>' + 
									   '<span class="serverListIP">' + vlc.serverList[i].ip + '</span>';
						li.addEventListener("click",serverListView.generate_li_onClick(i));
						li.classList.add("ui-snap-listview-item");
						li.children[1].style.color="yellow";
						list.appendChild(li);
						vlc.testServerAvailable (vlc.serverList[i].ip,vlc.serverList[i].port,colorSetter(li,"green"),colorSetter(li,"red"),12000, vlc.serverList[i].password);
					}
					break;
				case "add":
					// Add element "Scan"
					li = document.createElement("li");
					li.innerHTML = '<span class="addElement">Perform Scan</span>';
					li.addEventListener("click",serverListView.AddScan_onClick);
					list.appendChild(li);
					// Add element "Manual"
					li = document.createElement("li");
					li.innerHTML = '<span class="addElement">Add Manual</span>';
					li.addEventListener("click",serverListView.AddManual_onClick);
					list.appendChild(li);
					break;
				case "scan":
					// Add already found servers
					for (i=0; i < vlc.scannedList.length ; i++) {
						li = document.createElement("li");
						li.longpress = serverListView.generate_li_onLP(i);
						li.innerHTML = '<span class="serverListIP">' + vlc.scannedList[i].ip + '</span>';
						li.addEventListener("click",serverListView.generate_add_li_onClick(i));
						li.classList.add("ui-snap-listview-item");
						li.children[0].style.color="green";
						list.appendChild(li);
					}
					
					// Add notice "Scan in progress"
					li = document.createElement("li");
					li.id = "ScanInProgress";
					li.innerHTML = '<span id="scanHeader">Scan in Progress</span><br>' + 
					   '<span id="scanMsg">0%</span>';
					list.appendChild(li);
					// Add notice "Scan in progress"
					li = document.createElement("li");
					li.innerHTML = '<span id="scanAbort">Abort</span>';
					li.addEventListener("click",serverListView.ScanAbort_onClick);
					list.appendChild(li);
			}
			
			
			// show correct view
			list.classList.remove("edit");
			list.classList.remove("delete");
			list.classList.remove("add");
			list.classList.remove("scan");
			list.classList.remove("select");
			list.classList.add(serverListView.status);
			document.getElementById("serverCaptionEdit").style.display = "none";
			document.getElementById("serverCaptionDelete").style.display = "none";
			document.getElementById("serverCaptionSelect").style.display = "block";
			document.getElementById("serverCaption").innerHTML = "Connect to ..";
			switch (serverListView.status) {
				case "select":
					serverListView.showTopMenu();
					app.onback = function() {
						return true;
					};
					break;
				case "edit":
					document.getElementById("serverCaptionSelect").style.display = "none";
					document.getElementById("serverCaptionEdit").style.display = "block";
					serverListView.showEdtMenu();
					app.onback = function() {
						serverListView.status = "select";
						serverListView.showList();
						return false;
					};
					break;
				case "delete":
					document.getElementById("serverCaptionSelect").style.display = "none";
					document.getElementById("serverCaptionDelete").style.display = "block";
				case "scan":
				case "add": 
					serverListView.hideMenus();
					app.onback = function() {
						vlc.abortScan = true;
						serverListView.status = "select";
						serverListView.showList();
						return false;
					};
					break;
				default:
					break;
			}
		},
		deselct_all: function(except) {
			var list=document.getElementById("serverList");
			var items = list.getElementsByTagName("li");
			for (var i=0; i<items.length; i++) {
				if (i !== except) {
					items[i].classList.remove("selected");
				}
			}
			serverListView.selected = -1;
		},
		hideMenus: function() {
			document.getElementById("topMenuBtns").style.display="none";
			document.getElementById("btnEdit").style.display="none";
			document.getElementById("btnAdd").style.display="none";
			document.getElementById("btnDelete").style.display="none";
			document.getElementById("edtMenuBtns").style.display="none";
			document.getElementById("btnEditEdit").style.display="none";
			document.getElementById("btnEditUp").style.display="none";
			document.getElementById("btnEditDown").style.display="none";
			document.getElementById("btnAddAbort").style.display="none";
		},
		showTopMenu: function() {
			serverListView.hideMenus();
			document.getElementById("topMenuBtns").style.display="block";
			document.getElementById("btnEdit").style.display="block";
			document.getElementById("btnAdd").style.display="block";
			document.getElementById("btnDelete").style.display="block";
		},
		showEdtMenu: function() {
			serverListView.hideMenus();
			document.getElementById("edtMenuBtns").style.display="block";
			document.getElementById("btnEditEdit").style.display="block";
			document.getElementById("btnEditUp").style.display="block";
			document.getElementById("btnEditDown").style.display="block";
		},
		showAddMenu: function() {
			serverListView.hideMenus();
			document.getElementById("btnAddAbort").style.display="block";
		},
	    generate_li_onClick: function(index) {
	    	return function () {
	    		if (app.longpressExec) {
	    			return;
	    		}
	    		app.handleLongPressCancel();
	    		switch (serverListView.status) {
					case "select":
						app.showSpinner("Waiting for " + vlc.serverList[index].name + " on <br>" + vlc.serverList[index].ip + ":" + vlc.serverList[index].port);
			    		vlc.connect(index);
						break;
					case "edit":
						var list=document.getElementById("serverList");
						var items = list.getElementsByTagName("li");
						
						serverListView.showEdtMenu();
						
						serverListView.deselct_all(items.length - index -1);
						items[items.length - index -1].classList.toggle("selected");
						serverListView.selected = index;
						console.log("Setting item " + index + " as selected" );
						break;
					case "delete":
						vlc.serverList.splice(index,1);
						app.writePrefs();
						serverListView.showList();
						break;
					default:
						break;
				}
	    		
	    	};
	    },
	    generate_li_onLP: function(id) {
	    	return function(e) {
		    	console.log("LP executed");
		    	console.log(HTML_getdef(e.target));
		    	switch(serverListView.status) {
		    		case "select":
		    			serverView.showId(id);
		    			break;
		    		default:
		    			break;
		    	}
		    	
	    	};
	    },
	    generate_add_li_onClick: function(id) {
	    	return function(e) {
	    		console.log("Handling click on found server");
	    		console.log(HTML_getdef(e.target));
	    		// Abort further scans
	    		vlc.abortScan = true;
	    		// Go back to displaying previousely known servers
	    		serverListView.status = "select";
	    		// Show this new server in the Edit-View
	    		serverView.showNew(vlc.scannedList[id].ip);
	    		delete app.LPelem;
	    	};
	    },
		Edit_onClick: function() {
			serverListView.status = "edit";
			serverListView.showList();
		},
		Delete_onClick: function() {
			serverListView.status = "delete";
			serverListView.showList();
		},
		Add_onClick: function() {
			serverListView.status = "add";
			serverListView.showList();
		},
		EditEdit_onClick: function() {
			serverView.showId(serverListView.selected);
		},
		EditDown_onClick: function() {
			// moving down in the list means decreasing the index in the serverList
			var index = serverListView.selected;
			if ( index -1 < 0 ) { return; }
			
			var tmp = vlc.serverList[index];
			vlc.serverList[index] = vlc.serverList[index-1];
			vlc.serverList[index-1] = tmp;
			
			serverListView.selected = index - 1;
			
			serverListView.showList();
			var items = document.getElementById("serverList").getElementsByTagName("li");
			items[items.length - (index -1)-1].classList.add("selected");
			
		},
		EditUp_onClick: function() {
			// moving up in the list means increasing the index in the serverList
			var index = serverListView.selected;
			if (index +1 >= vlc.serverList.length) { return;}
			
			var tmp = vlc.serverList[index];
			vlc.serverList[index] = vlc.serverList[index+1];
			vlc.serverList[index+1] = tmp;
			
			serverListView.selected = index + 1;
			serverListView.showList();
			var items = document.getElementById("serverList").getElementsByTagName("li");
			items[items.length - (index +1)-1].classList.add("selected");
		},
		AddScan_onClick: function() {
			serverListView.status = "scan";
			serverListView.showList();
			vlc.scanAll();
		},
		ScanAbort_onClick: function() {
			vlc.abortScan = true;
			serverListView.status = "select";
			serverListView.showList();
		},
		AddManual_onClick: function() {
			serverListView.status = "select";
			serverView.showNew();
		}
};