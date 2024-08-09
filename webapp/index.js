sap.ui.define([
    "sap/ui/core/ComponentContainer"
    ], function (ComponentContainer) {
        "use strict";
    
    new ComponentContainer({
            name: "sap.btp.cpidashboard",
            settings : {
                id : "cpidashboard"
            },
            async: true
        }).placeAt("content");
    });