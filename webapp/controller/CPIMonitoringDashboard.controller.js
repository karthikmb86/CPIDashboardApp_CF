sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageToast",
	"sap/ui/core/Fragment",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Sorter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/FilterType",
	"sap/ui/core/format/DateFormat",
	"sap/ui/core/routing/History"
], (Controller, MessageToast, Fragment, JSONModel, Sorter, Filter, FilterOperator, FilterType, DateFormat, History) => {
	"use strict";

	function formatToAEST(dateString) {
		let date = new Date(dateString);
		let aestOffset = 10 * 60; // AEST is UTC+10
		if (isDaylightSavingTime(date)) {
			aestOffset += 60; // AEDT is UTC+11
		}
		date.setMinutes(date.getMinutes() + aestOffset);
		let options = {
			timeZone: 'Australia/Sydney',
			year: 'numeric',
			month: 'short',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			hour12: true
		};
		let formattedDate = date.toLocaleString('en-AU', options);
		// Convert am/pm to uppercase AM/PM
		return formattedDate.replace('am', 'AM').replace('pm', 'PM');
	}

	function isDaylightSavingTime(date) {
		let year = date.getUTCFullYear();
		let startDST = new Date(Date.UTC(year, 9, 1)); // 1st Sunday in October
		startDST.setDate(startDST.getDate() + (7 - startDST.getUTCDay()) % 7);
		let endDST = new Date(Date.UTC(year, 3, 1)); // 1st Sunday in April
		endDST.setDate(endDST.getDate() + (7 - endDST.getUTCDay()) % 7);

		return date >= startDST && date < endDST;
	}
	let monitoringLogList = [];
	return Controller.extend("sap.btp.cpidashboard.controller.CPIMonitoringDashboard", {
		onInit: function () {
			//Moved to component.js
			console.log("In CPI Monitoring Dashboard Init Function");

			//debugger;
			//Router
			var oRouter = this.getOwnerComponent().getRouter();

			var oHistory = History.getInstance();
			var sPreviousHash = oHistory.getPreviousHash();

			if (sPreviousHash !== undefined) {
				//Navigated
				oRouter.getRoute("monitoringDashboard").attachPatternMatched(this._onObjectMatched, this);
			} else {
				//Not from navigation. Fresh load
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
				//yesterdayDate = yesterdayDate.toLocaleString('en-AU', options);
				//currentDate = currentDate.toLocaleString('en-AU', options);
				yesterdayDate = yesterdayDate.toLocaleString('en-AU', {
					timeZone: 'UTC'
				});
				currentDate = currentDate.toLocaleString('en-AU', {
					timeZone: 'UTC'
				});

				//debugger;
				console.log("yesterdayDate: " + yesterdayDate); // Output: "2023-03-16T00:00:00"   AEST Time
				console.log("currentDate: " + currentDate); // Output: "2023-03-16T00:00:00"       AEST Time

				//Convert AEST to GMT/UTC and also in required format to Query
				//const inputDateString = "17/03/2023, 14:30:00"; // Example input date string
				//let inputDateYest = new Date(yesterdayDate.replace(/(\d{2})\/(\d{2})\/(\d{4}), (\d{2}):(\d{2}):(\d{2})/, "$3-$2-$1T$4:$5:$6")); // Parse input date string using regular expression and create a Date object
				//let yestDate = inputDateYest.toISOString().slice(0, -5); // Convert Date object to ISO 8601 format and remove the last 5 characters
				//console.log("yesterdayDate: " + yestDate); // Output: "2023-03-17T14:30:00"

				//let inputDateCurr = new Date(currentDate.replace(/(\d{2})\/(\d{2})\/(\d{4}), (\d{2}):(\d{2}):(\d{2})/, "$3-$2-$1T$4:$5:$6")); // Parse input date string using regular expression and create a Date object
				//let currDate = inputDateCurr.toISOString().slice(0, -5); // Convert Date object to ISO 8601 format and remove the last 5 characters

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
				//let isoDateYestDate = new Date(`${date[2]}-${date[1]}-${date[0]}T${hour}:${time.split(":")[1]}:${time.split(":")[2]}`).toISOString();

				let isoDateYestDate = `${date[2]}-${date[1]}-${date[0]}T${hour}:${time.split(":")[1]}:${time.split(":")[2]}`;

				//isoDateYestDate = isoDateYestDate.substring(0, isoDateYestDate.length - 5);

				console.log("Yesterday Date: " + isoDateYestDate); // Output: "2023-03-20T13:15:01.000Z"

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
				//let isoDateCurrDate = new Date(`${date[2]}-${date[1]}-${date[0]}T${hour}:${time.split(":")[1]}:${time.split(":")[2]}`).toISOString();
				let isoDateCurrDate = `${date[2]}-${date[1]}-${date[0]}T${hour}:${time.split(":")[1]}:${time.split(":")[2]}`;

				//isoDateCurrDate = isoDateCurrDate.substring(0, isoDateCurrDate.length - 5);

				console.log("CurrentDate: " + isoDateCurrDate); // Output: "2023-03-17T14:30:00"

				//debugger;

				console.log("/v1/MessageProcessingLogs?$filter=LogStart gt datetime'" + isoDateYestDate + "' and LogEnd lt datetime'" +
					isoDateCurrDate + "'");

				//let sURL = "/v1/MessageProcessingLogs?$filter=Status eq 'COMPLETED' or Status eq 'FAILED'";

				let sURL = "/v1/MessageProcessingLogs?$filter=LogStart gt datetime'" + isoDateYestDate + "' and LogEnd lt datetime'" +
					isoDateCurrDate + "'";
				let jsonData = $.ajax({
					type: "GET",
					url: sURL,
					contentType: "application/json",
					dataType: "json",
					success: this.successREST.bind(this),
					error: [this.errorREST, this]
				});
			}

		},
		_onObjectMatched: function (oEvent) {

			//debugger;
			let integrationArtifactNameVal = oEvent.getParameter("arguments").integrationArtifactName;
			let fromDateVal = oEvent.getParameter("arguments").fromDate;
			let toDateVal = oEvent.getParameter("arguments").toDate;

			let messageHeader = {
				integrationArtifactNameParam: integrationArtifactNameVal,
				fromDateParam: fromDateVal,
				toDateParam: toDateVal
			}

			//debugger;

			// Given date in UTC format
			const aestDateFrom = formatToAEST(fromDateVal);
			const aestDateTo = formatToAEST(toDateVal);

			this.byId("DTP1").setValue(aestDateFrom);
			this.byId("DTP2").setValue(aestDateTo);

			let oModelMessageHeader = new JSONModel(messageHeader);
			this.getView().setModel(oModelMessageHeader);

			let monitoringList = [];

			let monitoring = "";
			let id = "";
			let monitoringSize = "";
			let monitoringIndex = 0;
			let monitoringLogs = {};

			console.log("Calling Monitoring Logs");

			console.log("Yesterday Date: " + fromDateVal); // Output: "2023-03-20T13:15:01.000Z"

			console.log("CurrentDate: " + toDateVal); // Output: "2023-03-17T14:30:00"

			//debugger;

			console.log("/v1/MessageProcessingLogs?$filter=LogStart gt datetime'" + fromDateVal + "' and LogEnd lt datetime'" +
				toDateVal + "' and  IntegrationArtifact/Name eq '" + integrationArtifactNameVal + "'");

			let sURL = "/v1/MessageProcessingLogs?$filter=LogStart gt datetime'" + fromDateVal + "' and LogEnd lt datetime'" +
				toDateVal + "' and  IntegrationArtifact/Name eq '" + integrationArtifactNameVal + "'";
			let jsonData = $.ajax({
				type: "GET",
				url: sURL,
				contentType: "application/json",
				dataType: "json",
				success: this.successREST.bind(this),
				error: [this.errorREST, this]
			});
		},
		successREST: function (data) {

			console.log("Entered successREST");
			//debugger;
			//try{
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
			//debugger;

			this.monitoringLogs.monitoringRecords.sort((a, b) => {
				const dateA = new Date(a.LogStart.replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$2/$1/$3"));
				const dateB = new Date(b.LogStart.replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$2/$1/$3"));
				return dateB - dateA;
			});

			console.log("monitoringLogs JSON:");
			console.log(JSON.stringify(this.monitoringLogs));
			//Loop through packageData array to get each package id and call the artefact details within them
			this.id = "";

			let oModel = new JSONModel();

			if (this.monitoringLogList != undefined) {
				//debugger;
				this.monitoringLogList.push(data.d.results);
			} else {
				//debugger;
				this.monitoringLogList = [];
				this.monitoringLogList.push(data.d.results);
			}

			//debugger;

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

				// debugger; 
				oModel.setData(this.monitoringLogs);
				//sap.ui.getCore().setModel(oModel, "monitoring"); //Not working
				//this.getView().byId("tbMonitoringDashboard").setModel(oModel, "monitoring"); //Working
				this.getView().byId("tbMonitoringDashboard").setModel(oModel);

				//Clear data
				this.monitoringLogs = {
						monitoringRecords: []
					}
					//this.getView().setModel(oModel, "monitoring");
					//this.getView().setModel(oModel);   //Commenting this code which binds the entire view to the model. Instead only the table control is bound in the line above
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
		onSearch: function () {
			let oView = this.getView(),
				sValue = oView.byId("searchField").getValue(),
				oFilter = new Filter("Status", FilterOperator.Contains, sValue);

			oView.byId("tbMonitoringDashboard").getBinding("items").filter(oFilter, FilterType.Application);
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
		onPress: function (oEvent) {

			//debugger;
			let oTable = this.getView().byId("tbMonitoringDashboard");
			let modelData = oTable.getModel();
			let oItem = oEvent.getSource();
			let sPath_MessageGuid = oItem.getBindingContext().getPath("MessageGuid");
			let sPath_iFlowName = oItem.getBindingContext().getPath("IntegrationArtifact/Name");

			let dataMsgID = modelData.getProperty(sPath_MessageGuid);
			let dataiFlowName = modelData.getProperty(sPath_iFlowName);

			let oRouter = this.getOwnerComponent().getRouter();
			oRouter.navTo("detail", {
				//messageGuid: window.encodeURIComponent(oItem.getBindingContext("monitoring").getPath().substr(1))
				messageGuid: dataMsgID,
				iFlowName: dataiFlowName
					//messageGuid: window.encodeURIComponent(oItem.oParent.getBindingContext(this.getView().getModel()).getPath().substr(1))
					//messageGuid: window.encodeURIComponent(oItem.getBindingContext().getProperty("MessageGuid"))
					//messageGuid: window.encodeURIComponent(oItem.getBindingContext().getProperty())
			});
		},
		onGoPress: function () {
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
		},
		onNavBack: function () {
			history.go(-1);
		}
	});
});