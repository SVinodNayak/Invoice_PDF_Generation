# Invoice PDF Generator

### PDF Generation

The application generates professional invoices with:
- Company logo and branding
- Invoice header (number, date, customer details)
- Itemized line items with quantities and prices
- Automatic total calculation
- Payment information and terms
- Professional footer


### Bounded Actions

Uses OData V4 bounded actions for PDF generation:
```javascript
// Service Definition
action generatePDF() returns LargeBinary;

// Frontend Call
POST /odata/v4/invoice/Invoices(ID)/InvoiceService.generatePDF
```

### Navigation

- **List Report**: View all invoices
- **PDF Download**: One-click PDF generation from both views



## Data Model

### Invoices Entity
- ID (UUID)
- Invoice Number
- Invoice Date
- Customer Name
- Customer Address
- Total Amount
- Items (Composition)

### Invoice Items Entity
- ID (UUID)
- Description
- Quantity
- Unit Price
- Amount

##  Customization

### Add Your Company Logo

1. Place your logo in `srv/images/logo.png`
2. Update the path in `srv/invoice-service.js`:
```javascript
const logoPath = path.join(__dirname, 'images', 'logo.png');
```

### Customize PDF Template

Edit the `makePDF` function in `srv/invoice-service.js` to modify:
- Colors and styling
- Header/footer content
- Company information
- Terms and conditions

- 
## Sample Data

Sample invoices are included in `db/data/`:
- `invoice.app-Invoices.csv` - Invoice headers
- `invoice.app-InvoiceItems.csv` - Invoice line items


## Testing

### Test PDF Generation

1. Navigate to http://localhost:4004/invoiceapp/webapp/index.html
2. Click on any invoice row to view details
3. Click "Print PDF" button
4. PDF will download automatically
