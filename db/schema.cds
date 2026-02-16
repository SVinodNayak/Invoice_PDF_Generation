namespace invoice.app;

entity Invoices {
    key ID          : UUID;
    invoiceNumber   : String(20);
    invoiceDate     : Date;
    customerName    : String(100);
    customerAddress : String(200);
    totalAmount     : Decimal(10,2);
    items           : Composition of many InvoiceItems on items.invoice = $self;
}

entity InvoiceItems {
    key ID          : UUID;
    invoice         : Association to Invoices;
    description     : String(200);
    quantity        : Integer;
    unitPrice       : Decimal(10,2);
    amount          : Decimal(10,2);
}