sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller, MessageToast, MessageBox) {
    "use strict";

    return Controller.extend("com.mycompany.invoice.invoiceapp.controller.App", {

        onPrintPDF: function (oEvent) {
            const oButton = oEvent.getSource();
            const oContext = oButton.getBindingContext();
            
            const sInvoiceId = oContext.getProperty("ID");
            const sInvoiceNumber = oContext.getProperty("invoiceNumber");

            MessageToast.show("Generating PDF...");

            const sUrl = `/odata/v4/invoice/Invoices(${sInvoiceId})/InvoiceService.generatePDF()`;
            
            console.log("PDF URL:", sUrl);

            fetch(sUrl, {
                method: 'POST'
            })
            .then(response => response.blob())
            .then(blob => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `invoice_${sInvoiceNumber}.pdf`;
                a.click();
                URL.revokeObjectURL(url);
                MessageToast.show("Downloaded!");
            })
            .catch(() => MessageBox.error("Failed"));
        }
    });
});