const cds = require('@sap/cds');
const PDFDocument = require('pdfkit');

module.exports = cds.service.impl(async function() {

    this.on('generatePDF', 'Invoices', async (req) => {
        
        try {
           const invoiceID = req.params[0].ID || req.params[0];
            
            console.log('Generating PDF');
            console.log('Invoice ID:', invoiceID);
            console.log('Request params:', req.params);
            
            // Get invoice
            const invoices = await SELECT.from('invoice.app.Invoices').where({ ID: invoiceID });
            const invoice = invoices[0];
            
            if (!invoice) {
                console.error('Invoice not found');
                req.reject(404, 'Invoice not found');
                return;
            }
           console.log('Invoice found:', invoice.invoiceNumber);

// Get items
const items = await SELECT.from('invoice.app.InvoiceItems').where({ invoice_ID: invoiceID });
invoice.items = items || [];

console.log('Items count:', invoice.items.length);

// Calculate total from items
invoice.totalAmount = invoice.items.reduce(function(sum, item) {
    return sum + parseFloat(item.amount || 0);
}, 0);

console.log('Calculated total:', invoice.totalAmount);


            // Generate PDF
            const pdfBuffer = await makePDF(invoice);
            
            console.log('PDF generated, size:', pdfBuffer.length);
            
            // Set headers and return
            req._.res.set('Content-Type', 'application/pdf');
            req._.res.set('Content-Disposition', `attachment; filename="invoice.pdf"`);
            req._.res.send(pdfBuffer);
            
        } catch (error) {
            console.error('Message:', error.message);
            console.error('Stack:', error.stack);
            req.reject(500, 'PDF generation failed: ' + error.message);
        }
    });
});
function makePDF(invoice) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        try {
            // ===== HEADER SECTION =====
            const path = require('path');
            const logoPath = path.join(__dirname, 'images', 'ustlogo.jpg');

            // Logo
            try {
                doc.image(logoPath, 50, 40, { width: 80, height: 80 });
            } catch (err) {
                console.log('Logo not found');
                doc.rect(50, 40, 80, 80).stroke();
            }
            
            // Company info - right aligned
            doc.fontSize(12).font('Helvetica-Bold')
               .fillColor('#0066cc')
               .text('US Technology International Pvt. Ltd.', 320, 45, { align: 'right', width: 230 });
            
            doc.fontSize(9).font('Helvetica')
               .fillColor('#333333')
               .text('ITC Tech Park', 320, 65, { align: 'right', width: 230 })
               .text('Hyderabad, Telangana - 500081', 320, 78, { align: 'right', width: 230 })
               .text('Phone: +91 (123) 456-7890', 320, 91, { align: 'right', width: 230 })
               .text('Email: info@ustglobal.com', 320, 104, { align: 'right', width: 230 });
            
            // Horizontal line below header
            doc.moveTo(50, 135).lineTo(550, 135).lineWidth(2).strokeColor('#0066cc').stroke();
            
            // ===== INVOICE TITLE =====
            doc.fontSize(20).font('Helvetica-Bold')
               .fillColor('#0066cc')
               .text('Purchase Order Invoice', 30, 155);
            
            // ===== INVOICE DETAILS BOX =====
            const detailsY = 155;
            
            // Right side box with invoice details
            doc.rect(350, detailsY, 200, 60).fillAndStroke('#f0f0f0', '#cccccc');
            
            doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000');
            doc.text('Invoice No:', 360, detailsY + 10);
            doc.font('Helvetica').text(invoice.invoiceNumber || 'N/A', 440, detailsY + 10);
            
            doc.font('Helvetica-Bold').text('Date:', 360, detailsY + 28);
            doc.font('Helvetica').text(invoice.invoiceDate || 'N/A', 440, detailsY + 28);
            
            
            // ===== BILL TO SECTION =====
            const billToY = 235;
            
            doc.fontSize(11).font('Helvetica-Bold')
               .fillColor('#0066cc')
               .text('BILL TO', 50, billToY);
            
            doc.fontSize(10).font('Helvetica-Bold')
               .fillColor('#000000')
               .text(invoice.customerName || 'N/A', 50, billToY + 20);
            
            doc.fontSize(9).font('Helvetica')
               .fillColor('#333333')
               .text(invoice.customerAddress || 'N/A', 50, billToY + 35, { width: 250 });
            
            // ===== ITEMS TABLE =====
            const tableTop = 320;
            
            // Table header with gradient effect
            doc.rect(50, tableTop, 500, 30).fill('#0066cc');
            
            doc.fontSize(10).font('Helvetica-Bold').fillColor('#ffffff');
            doc.text('DESCRIPTION', 60, tableTop + 10);
            doc.text('QTY', 320, tableTop + 10, { width: 50, align: 'center' });
            doc.text('RATE', 390, tableTop + 10, { width: 70, align: 'right' });
            doc.text('AMOUNT', 470, tableTop + 10, { width: 70, align: 'right' });
            
            // Reset colors
            doc.fillColor('#000000').strokeColor('#cccccc');
            
            // Table items
            let y = tableTop + 40;
            const rowHeight = 25;
            
            if (invoice.items && invoice.items.length > 0) {
                invoice.items.forEach(function(item, index) {
                    // Alternate row background
                    if (index % 2 === 0) {
                        doc.rect(50, y - 5, 500, rowHeight).fill('#f9f9f9');
                        doc.fillColor('#000000');
                    }
                    
                    // Item details
                    doc.fontSize(9).font('Helvetica');
                    doc.text(item.description || '', 60, y, { width: 250 });
                    doc.text((item.quantity || 0).toString(), 320, y, { width: 50, align: 'center' });
                    doc.text('$' + parseFloat(item.unitPrice || 0).toFixed(2), 390, y, { width: 70, align: 'right' });
                    doc.font('Helvetica-Bold')
                       .text('$' + parseFloat(item.amount || 0).toFixed(2), 470, y, { width: 70, align: 'right' });
                    
                    y += rowHeight;
                });
            }
            
            // Bottom border of table
            doc.moveTo(50, y).lineTo(550, y).stroke();
            
            // ===== SUMMARY SECTION =====
            const summaryX = 350;
            y += 20;
            
            // Subtotal
            doc.fontSize(10).font('Helvetica');
            doc.text('Subtotal:', summaryX, y, { width: 90, align: 'left' });
            doc.text('$' + (invoice.totalAmount || 0).toFixed(2), summaryX + 100, y, { width: 90, align: 'right' });
            
            // Tax (example)
            y += 18;
            doc.text('Tax (0%):', summaryX, y, { width: 90, align: 'left' });
            doc.text('$0.00', summaryX + 100, y, { width: 90, align: 'right' });
            
            // Total box
            y += 25;
            doc.rect(summaryX, y - 8, 200, 35).fillAndStroke('#0066cc', '#0066cc');
            
            doc.fontSize(14).font('Helvetica-Bold').fillColor('#ffffff');
            doc.text('TOTAL:', summaryX + 10, y + 5);
            doc.fontSize(16).text('$' + (invoice.totalAmount || 0).toFixed(2), summaryX + 100, y + 3, { width: 90, align: 'right' });
            
            // ===== PAYMENT & TERMS SECTION =====
            y += 60;
            doc.fontSize(10).font('Helvetica-Bold')
               .fillColor('#0066cc')
               .text('PAYMENT INFORMATION', 50, y);
            
            doc.fontSize(9).font('Helvetica')
               .fillColor('#333333')
               .text('Bank: HDFC Bank', 50, y + 20)
               .text('Account No: 1234567890', 50, y + 33)
               .text('IFSC Code: HDFC0001234', 50, y + 46)
               .text('Branch: Hyderabad', 50, y + 59);
            
            // Terms
            doc.fontSize(10).font('Helvetica-Bold')
               .fillColor('#0066cc')
               .text('TERMS & CONDITIONS', 300, y);
            
            doc.fontSize(8).font('Helvetica')
               .fillColor('#333333')
               .text('• Payment is due within 30 days', 300, y + 20, { width: 250 })
               .text('• Please include invoice number with payment', 300, y + 33, { width: 250 })
               .text('• Late payments subject to 2% monthly fee', 300, y + 46, { width: 250 });
            
            // ===== FOOTER =====
            const footerY = 750;
            doc.moveTo(50, footerY).lineTo(550, footerY).lineWidth(1).strokeColor('#cccccc').stroke();
            
            doc.fontSize(9).font('Helvetica-Oblique')
               .fillColor('#666666')
               .text('Thank you for your business!', 50, footerY + 10, { align: 'center', width: 500 });
            
            doc.fontSize(8)
               .text('This is a computer-generated invoice and does not require a signature.', 50, footerY + 25, { align: 'center', width: 500 });
            
            doc.end();
        } catch (err) {
            reject(err);
        }
    });
}
// function makePDF(invoice) {
//     return new Promise((resolve, reject) => {
//         const doc = new PDFDocument({ margin: 50, size: 'A4' });
//         const buffers = [];

//         doc.on('data', buffers.push.bind(buffers));
//         doc.on('end', () => resolve(Buffer.concat(buffers)));
//         doc.on('error', reject);

//         try {
//             // ===== LOGO =====
//             const path = require('path');
//             const logoPath = path.join(__dirname, 'images', 'ustlogo.jpg');

//             try {
//                 doc.image(logoPath, 30, 30, { width: 100 });
//             } catch (err) {
//                 console.log('Logo not found, using placeholder');
//                 doc.rect(50, 40, 100, 60).stroke();
//                 doc.fontSize(8).text('LOGO', 70, 65);
//             }
            
//             // Company info on the right
//             doc.fontSize(10).font('Helvetica-Bold')
//                .text('US Technology International pvt.ltd', 400, 45, { align: 'right' });
//             doc.fontSize(8).font('Helvetica')
//                .text('ITC Tech Park', 400, 60, { align: 'right' })
//                .text('Hyderabad, Telangana- 500081', 400, 72, { align: 'right' })
//                .text('Phone: (123) 456-7890', 400, 84, { align: 'right' })
//                .text('Email: info@ust.com', 400, 96, { align: 'right' });
            
//             // ===== INVOICE TITLE =====
//             doc.fontSize(24).font('Helvetica-Bold')
//                .text('INVOICE', 50, 100);
            
//             // Invoice details
//             const invoiceDetailsY = 170;
            
//             doc.fontSize(10).font('Helvetica-Bold').text('Invoice Number:', 50, invoiceDetailsY);
//             doc.font('Helvetica').text(invoice.invoiceNumber || 'N/A', 150, invoiceDetailsY);
            
//             doc.font('Helvetica-Bold').text('Invoice Date:', 50, invoiceDetailsY + 15);
//             doc.font('Helvetica').text(invoice.invoiceDate || 'N/A', 150, invoiceDetailsY + 15);
            
//             // ===== BILL TO =====
//             doc.fontSize(12).font('Helvetica-Bold').text('Bill To:', 50, invoiceDetailsY + 50);
//             doc.fontSize(10).font('Helvetica')
//                .text(invoice.customerName || 'N/A', 50, invoiceDetailsY + 68)
//                .text(invoice.customerAddress || 'N/A', 50, invoiceDetailsY + 82);
            
//             // ===== TABLE =====
//             const tableTop = invoiceDetailsY + 120;
            
//             // Table header with blue background
//             doc.rect(50, tableTop - 5, 500, 25).fill('#0066cc');
            
//             doc.fontSize(11).font('Helvetica-Bold').fillColor('#ffffff');
//             doc.text('Description', 55, tableTop + 3);
//             doc.text('Qty', 305, tableTop + 3);
//             doc.text('Price', 375, tableTop + 3);
//             doc.text('Amount', 455, tableTop + 3);
            
//             // Reset color
//             doc.fillColor('#000000');
            
//             // Items
//             doc.font('Helvetica').fontSize(10);
//             let y = tableTop + 30;
            
//             if (invoice.items && invoice.items.length > 0) {
//                 invoice.items.forEach(function(item, index) {
//                     // Alternate row colors
//                     if (index % 2 === 0) {
//                         doc.rect(50, y - 5, 500, 22).fill('#f5f5f5');
//                         doc.fillColor('#000000');
//                     }
                    
//                     doc.text(item.description || '', 55, y, { width: 240 });
//                     doc.text((item.quantity || 0).toString(), 305, y);
//                     doc.text('$' + parseFloat(item.unitPrice || 0).toFixed(2), 375, y);
//                     doc.text('$' + parseFloat(item.amount || 0).toFixed(2), 455, y);
//                     y += 22;
//                 });
//             } else {
//                 doc.text('No items', 55, y);
//                 y += 22;
//             }
            
//             // ===== TOTAL SECTION =====
//             y += 10;
//             doc.rect(350, y, 200, 30).stroke();
            
//             doc.fontSize(14).font('Helvetica-Bold');
//             doc.text('TOTAL:', 360, y + 8);
//             doc.text('$' + (invoice.totalAmount || 0).toFixed(2), 455, y + 8);
            
//             // ===== FOOTER =====
//             // doc.fontSize(9).font('Helvetica-Oblique').fillColor('#666666');
//             // doc.text('Thank you for your business!', 50, y + 60, { align: 'center', width: 500 });
//             // doc.text('Payment is due within 30 days', 50, y + 75, { align: 'center', width: 500 });
            
//             doc.end();
//         } catch (err) {
//             reject(err);
//         }
//     });
// }
// function makePDF(invoice) {
//     return new Promise((resolve, reject) => {
//         const doc = new PDFDocument({ margin: 50, size: 'A4' });
//         const buffers = [];

//         doc.on('data', buffers.push.bind(buffers));
//         doc.on('end', () => resolve(Buffer.concat(buffers)));
//         doc.on('error', reject);

//         try {
//             // Header
//             doc.fontSize(24).font('Helvetica-Bold').text('INVOICE', { align: 'center' });
//             doc.moveDown();
//             doc.fontSize(10).font('Helvetica')
//                .text('Your Company Name', { align: 'center' })
//                .text('123 Business Street', { align: 'center' });
//             doc.moveDown();
            
//             // Invoice info
//             doc.fontSize(12).font('Helvetica-Bold').text('Invoice: ', { continued: true })
//                .font('Helvetica').text(invoice.invoiceNumber || 'N/A');
//             doc.font('Helvetica-Bold').text('Date: ', { continued: true })
//                .font('Helvetica').text(invoice.invoiceDate || 'N/A');
//             doc.font('Helvetica-Bold').text('Customer: ', { continued: true })
//                .font('Helvetica').text(invoice.customerName || 'N/A');
//             doc.moveDown(2);
            
//             // Table header
//             const tableTop = doc.y;
//             doc.fontSize(11).font('Helvetica-Bold');
//             doc.text('Description', 50, tableTop);
//             doc.text('Qty', 300, tableTop);
//             doc.text('Price', 370, tableTop);
//             doc.text('Amount', 450, tableTop);
//             doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();
            
//             // Items
//             doc.font('Helvetica').fontSize(10);
//             let y = tableTop + 25;
            
//             if (invoice.items && invoice.items.length > 0) {
//                 invoice.items.forEach(function(item) {
//                     doc.text(item.description || '', 50, y, { width: 240 });
//                     doc.text((item.quantity || 0).toString(), 300, y);
//                     doc.text('$' + parseFloat(item.unitPrice || 0).toFixed(2), 370, y);
//                     doc.text('$' + parseFloat(item.amount || 0).toFixed(2), 450, y);
//                     y += 20;
//                 });
//             } else {
//                 doc.text('No items', 50, y);
//                 y += 20;
//             }
            
//             // Total
//             y += 10;
//             doc.moveTo(50, y).lineTo(550, y).stroke();
//             doc.fontSize(14).font('Helvetica-Bold');
//             doc.text('TOTAL:', 370, y + 15);
//             doc.text('$' + parseFloat(invoice.totalAmount || 0).toFixed(2), 450, y + 15);
            
//             doc.end();
//         } catch (err) {
//             reject(err);
//         }
//     });
// }