sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageToast",
	"sap/ui/core/Fragment",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Sorter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/FilterType",
	"sap/ui/core/format/DateFormat"
], (Controller, MessageToast, Fragment, JSONModel, Sorter, Filter, FilterOperator, FilterType, DateFormat) => {
	"use strict";
	let monitoringLogList = [];
	let sURL = "";
	let jsonData = "";
	let isoDateCurrDate = "";
	let isoDateYestDate = "";
	let oModel = new JSONModel();

	return Controller.extend("sap.btp.cpidashboard.controller.CPIMonitoringOverview", {
		onInit: function () {
			this.getView().byId("busyIndicator").setVisible(false);
            this.getView().byId("tbMonitoringOverview").setVisible(true);
			//Moved to component.js
			console.log("In CPI Monitoring Overview Init Function");

			//loadVarAndCall();

			let monitoringList = [];
			let monitoring = "";
			let id = "";
			let monitoringSize = "";
			let monitoringIndex = 0;
			let monitoringLogs = {};

			console.log("Calling Monitoring Logs");

			// Get the current date and time
			let currentDate = new Date();

			// Subtract 24 hours from the current date and time
			let yesterdayDate = new Date(currentDate.getTime() - (24 * 60 * 60 * 1000));
			
			var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({ pattern: "MMM d, yyyy, hh:mm:ss a" });
            var oDateCurrentDate = new Date(currentDate);
            var oDateYesterdayDate = new Date(yesterdayDate);
            var sFormattedCurrentDate = oDateFormat.format(oDateCurrentDate);
            var sFormattedYesterdayDate = oDateFormat.format(oDateYesterdayDate);
            
            //debugger
            this.byId("DTP1").setValue(sFormattedYesterdayDate);
            this.byId("DTP2").setValue(sFormattedCurrentDate);
            
			
			//debugger;

			// Convert the date to AEST time zone
			let options = {
				timeZone: 'Australia/Sydney',
				year: 'numeric',
				month: '2-digit',
				day: '2-digit',
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit',
				hour12: false
			};
			yesterdayDate = yesterdayDate.toLocaleString('en-AU', {
				timeZone: 'UTC'
			});
			currentDate = currentDate.toLocaleString('en-AU', {
				timeZone: 'UTC'
			});

			//debugger;
			console.log("yesterdayDate: " + yesterdayDate); // Output: "2023-03-16T00:00:00"   AEST Time
			console.log("currentDate: " + currentDate); // Output: "2023-03-16T00:00:00"       AEST Time

			let dateParts = yesterdayDate.split(", "); // Split the date and time
			let date = dateParts[0].split("/"); // Split the date into day, month, and year
			let time = dateParts[1].split(" ")[0]; // Get the time without AM/PM
			let ampm = dateParts[1].split(" ")[1]; // Get the AM/PM value
			let hour = parseInt(time.split(":")[0]); // Get the hour value
			if (ampm.toLowerCase() === "pm" && hour !== 12) {
				hour += 12; // Add 12 hours for PM times
			} else if (ampm.toLowerCase() === "pm" && hour === 12) {
				hour = 0;
			}

			this.isoDateYestDate = `${date[2]}-${date[1]}-${date[0]}T${hour}:${time.split(":")[1]}:${time.split(":")[2]}`;

			console.log("Yesterday Date: " + this.isoDateYestDate); // Output: "2023-03-20T13:15:01.000Z"

			dateParts = currentDate.split(", "); // Split the date and time
			date = dateParts[0].split("/"); // Split the date into day, month, and year
			time = dateParts[1].split(" ")[0]; // Get the time without AM/PM
			ampm = dateParts[1].split(" ")[1]; // Get the AM/PM value
			hour = parseInt(time.split(":")[0]); // Get the hour value
			//debugger;

			if (ampm.toLowerCase() === "pm" && hour !== 12) {
				hour += 12; // Add 12 hours for PM times
			} else if (ampm.toLowerCase() === "pm" && hour === 12) {
				hour = 0;
			}
			this.isoDateCurrDate = `${date[2]}-${date[1]}-${date[0]}T${hour}:${time.split(":")[1]}:${time.split(":")[2]}`;

			console.log("CurrentDate: " + this.isoDateCurrDate); // Output: "2023-03-17T14:30:00"

			//debugger;
            this.getView().byId("busyIndicator").setVisible(true);
            this.getView().byId("tbMonitoringOverview").setVisible(false);
            
			console.log("/v1/MessageProcessingLogs?$filter=LogStart gt datetime'" + this.isoDateYestDate + "' and LogEnd lt datetime'" +
				this.isoDateCurrDate + "'");

			this.sURL = "/v1/MessageProcessingLogs?$filter=LogStart gt datetime'" + this.isoDateYestDate + "' and LogEnd lt datetime'" +
				this.isoDateCurrDate + "'";
			this.jsonData = $.ajax({
				type: "GET",
				url: this.sURL,
				contentType: "application/json",
				dataType: "json",
				success: this.successREST.bind(this),
				error: [this.errorREST, this]
			});

		},
		loadVarAndCall: function () {

		},
		onTabBarSelected: function (event) {
			var key = event.getParameter("key");

			// Remove previously loaded content, if any
			var iconTabBar = this.getView().byId("myIconTabBar");

			// Remove previously loaded content, if any
			var selectedItem = iconTabBar.getItems().find(function (item) {
				return item.getKey() === key;
			});

			if (selectedItem && selectedItem.getContent().length > 0) {
				selectedItem.destroyContent();
			}

			// Load content based on the selected tab
			if (key === "tab1Key") {
				console.log("tab1Key selected");
				
			} else if (key === "tab2Key") {
				console.log("tab2Key selected");
			}

		},
		successREST: function (data) {

			console.log("Entered successREST");

			if (this.monitoringLogs === undefined) {
				this.monitoringLogs = {
					monitoringRecords: data.d.results
				}
			} else if (this.monitoringLogs.monitoringRecords.length === 0 || this.monitoringLogs.monitoringRecords.length >= 1000) { //has next block
				this.monitoringLogs.monitoringRecords = this.monitoringLogs.monitoringRecords.concat(data.d.results);
			}

			for (let i = 0; i < this.monitoringLogs.monitoringRecords.length; i++) {
				const record = this.monitoringLogs.monitoringRecords[i];
				const logStartTimestamp = parseInt(record.LogStart.match(/\d+/)[0]);
				const logEndTimestamp = parseInt(record.LogEnd.match(/\d+/)[0]);

				record.LogStart = new Date(logStartTimestamp).toLocaleString();
				record.LogEnd = new Date(logEndTimestamp).toLocaleString();
			}

			this.monitoringLogs.monitoringRecords.sort((a, b) => {
				const dateA = new Date(a.LogStart.replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$2/$1/$3"));
				const dateB = new Date(b.LogStart.replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$2/$1/$3"));
				return dateB - dateA;
			});

			console.log("monitoringLogs JSON:");
			console.log(JSON.stringify(this.monitoringLogs));
			//Loop through packageData array to get each package id and call the artefact details within them
			this.id = "";

			oModel = new JSONModel(); //declared oModel outside the functions

			if (this.monitoringLogList != undefined) {
				//debugger;
				this.monitoringLogList.push(data.d.results);
			} else {
				//debugger;
				this.monitoringLogList = [];
				this.monitoringLogList.push(data.d.results);
			}

			if (data.d.hasOwnProperty('__next')) {
				console.log('__next property exists in JSON object');
				let sURL = "/v1/" + data.d.__next;
				let jsonData = $.ajax({
					type: "GET",
					url: sURL,
					contentType: "application/json",
					dataType: "json",
					success: this.successREST.bind(this),
					error: [this.errorREST, this]
				});
			} else {
				console.log('__next property does not exist in JSON object');

				// Initialize payload object
				var payload = {};

				// Loop through the monitoring records
				for (var i = 0; i < this.monitoringLogs.monitoringRecords.length; i++) {
					var record = this.monitoringLogs.monitoringRecords[i];

					// Get the integration artifact name
					var integrationArtifactName = record.IntegrationArtifact.Name;

					// If the integration artifact name does not exist in the payload, create a new entry
					if (!payload[integrationArtifactName]) {
						payload[integrationArtifactName] = {
							"IntegrationArtifactName": integrationArtifactName,
							"Successful": 0,
							"Failed": 0
						};
					}

					// Increment the corresponding count based on the status
					if (record.Status === "COMPLETED") {
						payload[integrationArtifactName].Successful++;
					} else if (record.Status === "FAILED") {
						payload[integrationArtifactName].Failed++;
					}
				}

				// Convert payload object to an array
				var payloadArray = Object.values(payload);

				this.monitoringLogs = {
					monitoringRecords: payloadArray
				}

				console.log(`monitoringLogs Payload: ${JSON.stringify(this.monitoringLogs)}`);

				oModel.setData(this.monitoringLogs);

				this.getView().byId("tbMonitoringOverview").setModel(oModel);

				//Clear data
				this.monitoringLogs = {
						monitoringRecords: []
					}
					
					this.getView().byId("busyIndicator").setVisible(false);
                    this.getView().byId("tbMonitoringOverview").setVisible(true);
			}

		},
		errorREST: function (data) {
			console.log("Entered Error");
		},
		successRESTPackageById: function (data) {

			//debugger;

			console.log("Entered successRESTPackageById");
			let errorStatusObj = {
				errorStatus: data.d.results
			};
			//debugger;

			if (data.d.results.length == 0) {
				this.monitoringSize = this.monitoringSize - 1;
			}

			for (let errStatusObj in errorStatusObj.errorStatus) {
				this.monitoring = {
					PackageId: errorStatusObj.errorStatus[errStatusObj].PackageId,
					ArtefactName: packageArtefactsObj.packageArtefacts[errStatusObj].Name,
					ArtefactId: packageArtefactsObj.packageArtefacts[errStatusObj].Id
				}
				this.monitoringList.push(this.monitoring);
			}
			//Done with all packages
			//Below condition is always true since the loop is already executed and only waiting for call backs

			var uniquePackages = new Set();
			var uniqueData = [];

			//debugger;

			for (var i = 0; i < this.monitoringList.length; i++) {
				if (!uniquePackages.has(this.monitoringList[i].PackageId)) {
					uniquePackages.add(this.monitoringList[i].PackageId);
					uniqueData.push(this.monitoringList[i]);
				}
			}

			console.log("uniqueData: " + JSON.stringify({
				"uniqueData": uniqueData
			}));
			console.log("monitoringSize: " + this.monitoringSize);
			console.log("uniqueData length: " + uniqueData.length);

			if ((this.monitoringSize) == uniqueData.length) {
				//Only enters here in the last package
				console.log("Final monitoringList: " + JSON.stringify(this.monitoringList));
				let oModel = new JSONModel();
				oModel.setData({
					"Artefacts": this.monitoringList
				});
				this.getView().setModel(oModel);
				//this.getView().byId("tbMasterInterface").bindRows("/Artefacts");
			}
		},
		errorRESTPackageById: function (data) {
			//debugger;
			console.log("Entered Error");
		},
		onSearchInterfaceName: function () {
			//debugger;
			let oView = this.getView(),
				sValue = oView.byId("searchInterfaceName").getValue(),
				oFilter = new Filter("IntegrationArtifactName", FilterOperator.Contains, sValue);

			oView.byId("tbMonitoringOverview").getBinding("items").filter(oFilter, FilterType.Application);
		},
		onRefresh: function () {
			//Same as init function
			console.log("In CPI Monitoring Dashboard Init Function");

			let monitoringList = [];
			let monitoring = "";
			let id = "";
			let monitoringSize = "";
			let monitoringIndex = 0;
			let monitoringLogs = {};

			console.log("Calling Monitoring Logs");

			// Get the current date and time
			let currentDate = new Date();

			// Subtract 24 hours from the current date and time
			let yesterdayDate = new Date(currentDate.getTime() - (24 * 60 * 60 * 1000));

			// Convert the date to AEST time zone
			let options = {
				timeZone: 'Australia/Sydney',
				year: 'numeric',
				month: '2-digit',
				day: '2-digit',
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit',
				hour12: false
			};
			yesterdayDate = yesterdayDate.toLocaleString('en-AU', options);
			currentDate = currentDate.toLocaleString('en-AU', options);

			console.log("yesterdayDate: " + yesterdayDate); // Output: "2023-03-16T00:00:00"   AEST Time
			console.log("currentDate: " + currentDate); // Output: "2023-03-16T00:00:00"       AEST Time

			//Convert AEST to GMT/UTC and also in required format to Query
			//const inputDateString = "17/03/2023, 14:30:00"; // Example input date string
			let inputDateYest = new Date(yesterdayDate.replace(/(\d{2})\/(\d{2})\/(\d{4}), (\d{2}):(\d{2}):(\d{2})/, "$3-$2-$1T$4:$5:$6")); // Parse input date string using regular expression and create a Date object
			let yestDate = inputDateYest.toISOString().slice(0, -5); // Convert Date object to ISO 8601 format and remove the last 5 characters
			console.log("yesterdayDate: " + yestDate); // Output: "2023-03-17T14:30:00"

			let inputDateCurr = new Date(currentDate.replace(/(\d{2})\/(\d{2})\/(\d{4}), (\d{2}):(\d{2}):(\d{2})/, "$3-$2-$1T$4:$5:$6")); // Parse input date string using regular expression and create a Date object
			let currDate = inputDateCurr.toISOString().slice(0, -5); // Convert Date object to ISO 8601 format and remove the last 5 characters
			console.log("CurrentDate: " + currDate); // Output: "2023-03-17T14:30:00"

			console.log("/v1/MessageProcessingLogs?$filter=LogStart gt datetime'" + yestDate + "' and LogEnd lt datetime'" + currDate + "'");
			//debugger;

			//let sURL = "/v1/MessageProcessingLogs?$filter=Status eq 'COMPLETED' or Status eq 'FAILED'";

			let sURL = "/v1/MessageProcessingLogs?$filter=LogStart gt datetime'" + yestDate + "' and LogEnd lt datetime'" + currDate + "'";
			let jsonData = $.ajax({
				type: "GET",
				url: sURL,
				contentType: "application/json",
				dataType: "json",
				success: this.successREST.bind(this),
				error: [this.errorREST, this]
			});
		},
		onPress: function (oEvent) {   //Item press

			//debugger;
			let oTable = this.getView().byId("tbMonitoringOverview");
			let modelData = oTable.getModel();
			let oItem = oEvent.getSource();
			let sPath_IntegrationArtifactName = oItem.getBindingContext().getPath("IntegrationArtifactName");
			//let sPath_FromDateTime = this.isoDateYestDate;
			//let sPath_ToDateTime = this.isoDateCurrDate;

			let dataIntegrationArtifactName = modelData.getProperty(sPath_IntegrationArtifactName);
			//let dataiFlowName = modelData.getProperty(sPath_iFlowName);

			let oRouter = this.getOwnerComponent().getRouter();
			oRouter.navTo("monitoringDashboard", {
				//messageGuid: window.encodeURIComponent(oItem.getBindingContext("monitoring").getPath().substr(1))
				integrationArtifactName: dataIntegrationArtifactName,
				fromDate: this.isoDateYestDate,
				toDate: this.isoDateCurrDate
			});
		},
		onGoPress: function () {   //New from and to date button press
			this.getView().byId("busyIndicator").setVisible(true);
			this.getView().byId("tbMonitoringOverview").setVisible(false);
			var oFromDateTimePicker = this.byId("DTP1");
			var oToDateTimePicker = this.byId("DTP2");

			var oFromDate = oFromDateTimePicker.getDateValue();
			var oToDate = oToDateTimePicker.getDateValue();

			// Convert timezone from AEST to GMT
			var oFromGMTDate = new Date(oFromDate.getUTCFullYear(), oFromDate.getUTCMonth(), oFromDate.getUTCDate(),
				oFromDate.getUTCHours(), oFromDate.getUTCMinutes(), oFromDate.getUTCSeconds());
			var oToGMTDate = new Date(oToDate.getUTCFullYear(), oToDate.getUTCMonth(), oToDate.getUTCDate(),
				oToDate.getUTCHours(), oToDate.getUTCMinutes(), oToDate.getUTCSeconds());

			var oDateFormat = DateFormat.getDateTimeInstance({
				pattern: "yyyy-MM-dd'T'HH:mm:ss",
				timezone: "GMT"
			});

			var sFromDateTime = oDateFormat.format(oFromGMTDate);
			var sToDateTime = oDateFormat.format(oToGMTDate);

			// Perform actions with selected dates in GMT
			// ...

			// Example: Log the selected dates in GMT to the console
			console.log("From Date (GMT):", sFromDateTime);
			console.log("To Date (GMT):", sToDateTime);
			
			this.isoDateYestDate = sFromDateTime;
			this.isoDateCurrDate = sToDateTime;	

			let sURL = "/v1/MessageProcessingLogs?$filter=LogStart gt datetime'" + sFromDateTime + "' and LogEnd lt datetime'" + sToDateTime +
				"'";
			let jsonData = $.ajax({
				type: "GET",
				url: sURL,
				contentType: "application/json",
				dataType: "json",
				success: this.successREST.bind(this),
				error: [this.errorREST, this]
			});
		}
	});
});