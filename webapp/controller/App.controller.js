sap.ui.define(
    [
        "sap/ui/core/mvc/Controller",
    ],
    function(BaseController) {
      "use strict";
  
      return BaseController.extend("sap.btp.cpidashboard.controller.App", {
        onInit: function() {
          console.log("In App Controller Init Function");
        }
      });
    }
  );
  