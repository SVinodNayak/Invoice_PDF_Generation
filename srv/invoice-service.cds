using invoice.app from '../db/schema';

service InvoiceService {
    entity Invoices as projection on app.Invoices actions {
        action generatePDF() returns LargeBinary;
    };
    entity InvoiceItems as projection on app.InvoiceItems;
}