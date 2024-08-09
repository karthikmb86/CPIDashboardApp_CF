sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox"
], function (Controller, JSONModel, MessageBox) {
	"use strict";
	return Controller.extend("sap.btp.cpidashboard.controller.CPIMessageLogDetails", {
		msgGUIDVal: null, // Controller-level variable to hold msgGUIDVal
		onInit: function () {
			var oRouter = this.getOwnerComponent().getRouter();
			oRouter.getRoute("detail").attachPatternMatched(this._onObjectMatched, this);
		},
		_onObjectMatched: function (oEvent) {

			console.log("Entered _onObjectMatched");
			
			this.clearTextAreaPayload(); // Clear the text area payload
			
			this.msgGUIDVal = oEvent.getParameter("arguments").messageGuid;
			let iFlowNameVal = oEvent.getParameter("arguments").iFlowName;


			let messageHeader = {
				msgGUIDParam: this.msgGUIDVal,
				iFlowNameParam: iFlowNameVal
			}

			let oModelMessageHeader = new JSONModel(messageHeader);
			this.getView().setModel(oModelMessageHeader);

			//Get Error Log if "Status" is FAILED

			console.log("/v1/MessageProcessingLogErrorInformations('" + this.msgGUIDVal + "')/$value");

			let sURL = "/v1/MessageProcessingLogErrorInformations('" + this.msgGUIDVal + "')/$value";
			let jsonData = $.ajax({
				type: "GET",
				url: sURL,
				contentType: "application/json",
				dataType: "json",
				success: this.successREST.bind(this),
				error: this.errorREST.bind(this)
			});
		},
		successREST: function (data) {

			console.log("Entered successREST of Initializer Function");
			//debugger;
			//let lblMsgErrLog = this.getView().byId("lblMessageLogText");
			//lblMsgErrLog.setText(data.responseText);

			//Added to display payload in textbox
			let sURL = "/sap/opu/odata/sap/ZMONITORING_CPI_SRV_SRV_02/PayloadSet('" + this.msgGUIDVal + "')";
			console.log("MessageID: " + this.msgGUIDVal);
			console.log("URL: " + sURL)

			debugger;

			this.displayPayloadInTextBox(sURL);
		},
		errorREST: function (data) {

			console.log("Entered errorREST");
			//debugger;
			let lblMsgErrLog = this.getView().byId("lblMessageLogText");
			lblMsgErrLog.setText(data.responseText);
		},
		onNavBack: function () {
			history.go(-1);
		},
		onPressDownloadPayload: function (oEvent) {
			console.log("Entered onPressDownloadPayload");
		
			let sURL = "/sap/opu/odata/sap/ZMONITORING_CPI_SRV_SRV_02/PayloadSet('" + this.msgGUIDVal + "')";
			console.log("MessageID: " + this.msgGUIDVal);
			console.log("URL: " + sURL)

			debugger;

			this.downloadPayload(sURL);
		},
		successDownloadPayload: function (data) {

			console.log("Entered successDownloadPayload");
		},
		downloadPayload: function (sURL) {
			let jsonData = $.ajax({
				type: "GET",
				url: sURL,
				contentType: "application/json",
				dataType: "json",
				success: function (data) {
					var payloadContent = data.d.LvPayload;
					var guid = data.d.LvGuid;
					//var fileName = guid + ".csv";
					var fileName = guid + "." + data.d.LvFiletype;

					if (!payloadContent || payloadContent == "No valid file found") {
						MessageBox.error("No payload available for downloading!");
						return;
					} else {

						var a = document.createElement("a");

						var blobType;
						if (data.d.LvFiletype === "xml") {
							blobType = "application/xml;charset=utf-8;";
						} else if (data.d.LvFiletype === "json") {
							blobType = "application/json;charset=utf-8;";
						} else if (data.d.LvFiletype === "csv") {
							blobType = "text/csv;charset=utf-8;";
						} else {
							throw new Error("Unsupported content type");
						}

						var blob = new Blob([payloadContent], {
							//type: "text/csv;charset=utf-8;"
							type: blobType
						});

						if (navigator.msSaveBlob) {
							// For IE 10+
							navigator.msSaveBlob(blob, fileName);
						} else {
							// For other browsers
							var url = URL.createObjectURL(blob);
							a.href = url;
							a.download = fileName;
							document.body.appendChild(a);
							a.click();
							document.body.removeChild(a);
							URL.revokeObjectURL(url);
						}
						// Handle successful response
						MessageBox.success("Payload downloaded successfully!");
						console.log(data); // Do something with the response data
					}
				},
				error: function (jqXHR, textStatus, errorThrown) {
					// Handle error
					MessageBox.error("Failure downloading payload. Error Details: " + textStatus);
					console.error(errorThrown);
				}
			});
		},
		displayPayloadInTextBox: function (sURL) {
			let oView = this.getView(); // Get the current view
			var oTextArea = oView.byId("textAreaPayload"); // Get the TextArea control

			$.ajax({
				type: "GET",
				url: sURL,
				contentType: "application/json",
				dataType: "json",
				success: function (data) {
					var payloadContent = data.d.LvPayload;

					if (!payloadContent || payloadContent === "No valid file found") {
						// Clear and hide the TextArea
						if (oTextArea) {
							oTextArea.setValue(""); // Clear the content
							oTextArea.setVisible(false); // Hide the TextArea
						}
						sap.m.MessageBox.error("No payload available for displaying!");
						return;
					} else {
						// Display the content in the TextArea
						if (oTextArea) {
							oTextArea.setValue(payloadContent);
							oTextArea.setVisible(true); // Ensure the TextArea is visible
						} else {
							sap.m.MessageBox.error("Unable to find the text area to display the payload.");
						}

						// Handle successful response
					//	sap.m.MessageBox.success("Payload displayed successfully!");
						console.log(data); // Do something with the response data
					}
				}.bind(this), // Ensure the success function is in the correct context
				error: function (jqXHR, textStatus, errorThrown) {
					// Handle error
					if (oTextArea) {
						oTextArea.setValue(""); // Clear the content
						oTextArea.setVisible(false); // Hide the TextArea
					}
					sap.m.MessageBox.error("Failure displaying payload. Error Details: " + textStatus);
					console.error(errorThrown);
				}
			});
		},
        clearTextAreaPayload: function () {
            let oView = this.getView();
            let oTextArea = oView.byId("textAreaPayload");
            if (oTextArea) {
                oTextArea.setValue("");
            }
        },

		//End of Display Payload Function
	});
});