sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "com/mycompany/invoice/invoiceapp/model/models"
], (UIComponent, Device, models) => {
    "use strict";

    return UIComponent.extend("com.mycompany.invoice.invoiceapp.Component", {
        metadata: {
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },

        init() {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // set the device model
            this.setModel(models.createDeviceModel(), "device");

            // enable routing
            this.getRouter().initialize();
        }
    });
});