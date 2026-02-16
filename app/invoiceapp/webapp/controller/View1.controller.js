sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller, MessageToast, MessageBox) {
    "use strict";

    return Controller.extend("com.mycompany.invoice.invoiceapp.controller.View1", {

        onPrintPDF: function (oEvent) {
            var oButton = oEvent.getSource();
            var oContext = oButton.getBindingContext();
            
            if (!oContext) {
                MessageBox.error("No data");
                return;
            }
            
            var sInvoiceId = oContext.getProperty("ID");
            var sInvoiceNumber = oContext.getProperty("invoiceNumber");

            MessageToast.show("Generating PDF...");
            var sUrl = "/odata/v4/invoice/Invoices(" + sInvoiceId + ")/InvoiceService.generatePDF";
            
            console.log("PDF URL:", sUrl);

            fetch(sUrl, { method: 'POST' })
                .then(function(r) { 
                    if (!r.ok) throw new Error('Failed');
                    return r.blob(); 
                })
                .then(function(blob) {
                    var url = URL.createObjectURL(blob);
                    var a = document.createElement('a');
                    a.href = url;
                    a.download = "invoice_" + sInvoiceNumber + ".pdf";
                    a.click();
                    URL.revokeObjectURL(url);
                    MessageToast.show("Downloaded!");
                })
                .catch(function(e) {
                    MessageBox.error("Failed: " + e.message);
                });
        }
    });
});