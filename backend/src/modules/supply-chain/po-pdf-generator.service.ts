import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import * as puppeteer from 'puppeteer';

export interface POPDFData {
  po: any;
  company: any;
  supplier: any;
  lines: any[];
  totals: {
    subtotal: number;
    tax: number;
    total: number;
  };
}

@Injectable()
export class POPDFGeneratorService {
  private readonly logger = new Logger(POPDFGeneratorService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Generate PDF for Purchase Order
   */
  async generatePOPDF(companyId: string, poId: string): Promise<Buffer> {
    this.logger.log(`Generating PDF for PO ${poId}`);

    // Get PO data with all related information
    const poData = await this.getPOData(companyId, poId);
    
    // Generate HTML content
    const htmlContent = this.generatePOHTML(poData);
    
    // Convert HTML to PDF using Puppeteer
    const pdfBuffer = await this.htmlToPDF(htmlContent);
    
    this.logger.log(`PDF generated successfully for PO ${poData.po.po_number}`);
    return pdfBuffer;
  }

  /**
   * Get comprehensive PO data for PDF generation
   */
  private async getPOData(companyId: string, poId: string): Promise<POPDFData> {
    const po = await this.prisma.opsPurchaseOrder.findUnique({
      where: { id: poId, company_id: companyId },
      include: {
        company: true,
        supplier: true,
        lines: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!po) {
      throw new Error('Purchase Order not found');
    }

    // Calculate totals
    const subtotal = po.lines.reduce((sum, line) => 
      sum + (Number(line.quantity) * Number(line.unit_price)), 0
    );
    const tax = subtotal * 0.15; // 15% VAT (configurable)
    const total = subtotal + tax;

    return {
      po,
      company: po.company,
      supplier: po.supplier,
      lines: po.lines,
      totals: {
        subtotal,
        tax,
        total,
      },
    };
  }

  /**
   * Generate HTML content for PO PDF
   */
  private generatePOHTML(data: POPDFData): string {
    const { po, company, supplier, lines, totals } = data;
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Purchase Order ${po.po_number}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #007bff;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .company-info {
            flex: 1;
        }
        .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #007bff;
            margin-bottom: 5px;
        }
        .po-title {
            text-align: right;
            flex: 1;
        }
        .po-number {
            font-size: 28px;
            font-weight: bold;
            color: #007bff;
            margin-bottom: 5px;
        }
        .po-details {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
        }
        .section {
            flex: 1;
            margin-right: 20px;
        }
        .section:last-child {
            margin-right: 0;
        }
        .section-title {
            font-weight: bold;
            font-size: 14px;
            color: #007bff;
            margin-bottom: 10px;
            text-transform: uppercase;
        }
        .info-row {
            margin-bottom: 5px;
            font-size: 12px;
        }
        .label {
            font-weight: bold;
            display: inline-block;
            width: 100px;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        .items-table th {
            background-color: #007bff;
            color: white;
            padding: 12px 8px;
            text-align: left;
            font-size: 12px;
            font-weight: bold;
        }
        .items-table td {
            padding: 10px 8px;
            border-bottom: 1px solid #ddd;
            font-size: 11px;
        }
        .items-table tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        .text-right {
            text-align: right;
        }
        .text-center {
            text-align: center;
        }
        .totals {
            float: right;
            width: 300px;
            margin-top: 20px;
        }
        .totals-table {
            width: 100%;
            border-collapse: collapse;
        }
        .totals-table td {
            padding: 8px 12px;
            border-bottom: 1px solid #ddd;
            font-size: 12px;
        }
        .totals-table .total-row {
            font-weight: bold;
            background-color: #007bff;
            color: white;
        }
        .terms {
            clear: both;
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
        }
        .terms-title {
            font-weight: bold;
            margin-bottom: 10px;
            color: #007bff;
        }
        .terms-content {
            font-size: 11px;
            line-height: 1.4;
        }
        .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 20px;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status-draft {
            background-color: #ffc107;
            color: #000;
        }
        .status-approved {
            background-color: #28a745;
            color: white;
        }
        .status-sent {
            background-color: #007bff;
            color: white;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-info">
            <div class="company-name">${company.name}</div>
            <div style="font-size: 12px; color: #666;">
                ${company.contact_details?.address || 'Company Address'}<br>
                ${company.contact_details?.phone || 'Phone'} | ${company.contact_details?.email || 'Email'}
            </div>
        </div>
        <div class="po-title">
            <div class="po-number">PURCHASE ORDER</div>
            <div style="font-size: 18px; margin-bottom: 10px;">${po.po_number}</div>
            <span class="status-badge status-${po.status.toLowerCase()}">${po.status}</span>
        </div>
    </div>

    <div class="po-details">
        <div class="section">
            <div class="section-title">Supplier Information</div>
            <div class="info-row">
                <span class="label">Company:</span> ${supplier.name}
            </div>
            <div class="info-row">
                <span class="label">Code:</span> ${supplier.supplier_code}
            </div>
            <div class="info-row">
                <span class="label">Contact:</span> ${supplier.contact_info?.email || 'N/A'}
            </div>
            <div class="info-row">
                <span class="label">Phone:</span> ${supplier.contact_info?.phone || 'N/A'}
            </div>
            <div class="info-row">
                <span class="label">Address:</span> ${supplier.contact_info?.address || 'N/A'}
            </div>
        </div>
        
        <div class="section">
            <div class="section-title">Order Details</div>
            <div class="info-row">
                <span class="label">PO Date:</span> ${new Date(po.created_at).toLocaleDateString()}
            </div>
            <div class="info-row">
                <span class="label">Required By:</span> ${new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString()}
            </div>
            <div class="info-row">
                <span class="label">Payment Terms:</span> Net 30 Days
            </div>
            <div class="info-row">
                <span class="label">Currency:</span> ZAR (South African Rand)
            </div>
        </div>

        <div class="section">
            <div class="section-title">Delivery Information</div>
            <div class="info-row">
                <span class="label">Ship To:</span> Main Warehouse
            </div>
            <div class="info-row">
                <span class="label">Address:</span> 123 Industrial Park<br>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Johannesburg, South Africa
            </div>
            <div class="info-row">
                <span class="label">Contact:</span> Warehouse Manager
            </div>
        </div>
    </div>

    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 10%;">Item #</th>
                <th style="width: 15%;">SKU</th>
                <th style="width: 35%;">Description</th>
                <th style="width: 10%;" class="text-center">Qty</th>
                <th style="width: 15%;" class="text-right">Unit Price</th>
                <th style="width: 15%;" class="text-right">Total</th>
            </tr>
        </thead>
        <tbody>
            ${lines.map((line, index) => `
                <tr>
                    <td class="text-center">${index + 1}</td>
                    <td>${line.product.sku}</td>
                    <td>
                        <strong>${line.product.name}</strong><br>
                        <span style="color: #666; font-size: 10px;">${line.product.description || ''}</span>
                    </td>
                    <td class="text-center">${Number(line.quantity).toLocaleString()}</td>
                    <td class="text-right">R${Number(line.unit_price).toFixed(2)}</td>
                    <td class="text-right">R${(Number(line.quantity) * Number(line.unit_price)).toFixed(2)}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>

    <div class="totals">
        <table class="totals-table">
            <tr>
                <td>Subtotal:</td>
                <td class="text-right">R${totals.subtotal.toFixed(2)}</td>
            </tr>
            <tr>
                <td>VAT (15%):</td>
                <td class="text-right">R${totals.tax.toFixed(2)}</td>
            </tr>
            <tr class="total-row">
                <td>Total Amount:</td>
                <td class="text-right">R${totals.total.toFixed(2)}</td>
            </tr>
        </table>
    </div>

    <div class="terms">
        <div class="terms-title">Terms and Conditions</div>
        <div class="terms-content">
            <p><strong>Payment Terms:</strong> Net 30 days from invoice date. Late payments may incur interest charges.</p>
            <p><strong>Delivery:</strong> Goods must be delivered to the specified address during business hours (8 AM - 5 PM, Monday to Friday).</p>
            <p><strong>Quality:</strong> All goods must meet the specifications outlined in this purchase order. Defective items will be returned at supplier's expense.</p>
            <p><strong>Invoicing:</strong> Please reference PO number ${po.po_number} on all invoices and delivery notes.</p>
            <p><strong>Changes:</strong> Any changes to this order must be approved in writing by the purchasing department.</p>
        </div>
    </div>

    <div class="footer">
        <p>This is a computer-generated document. No signature required.</p>
        <p>Generated on ${new Date().toLocaleString()} | PO ID: ${po.id}</p>
    </div>
</body>
</html>`;
  }

  /**
   * Convert HTML to PDF using Puppeteer
   */
  private async htmlToPDF(htmlContent: string): Promise<Buffer> {
    let browser;
    
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();
      
      // Set content and wait for any dynamic content to load
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      // Generate PDF with specific options
      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
        printBackground: true,
        preferCSSPageSize: true,
      });

      return Buffer.from(pdfBuffer);
    } catch (error) {
      this.logger.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF');
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Generate PO acknowledgment form (for supplier to sign)
   */
  async generatePOAcknowledgment(companyId: string, poId: string): Promise<Buffer> {
    const poData = await this.getPOData(companyId, poId);
    const htmlContent = this.generateAcknowledgmentHTML(poData);
    return this.htmlToPDF(htmlContent);
  }

  /**
   * Generate HTML for PO acknowledgment form
   */
  private generateAcknowledgmentHTML(data: POPDFData): string {
    const { po, company, supplier } = data;
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>PO Acknowledgment - ${po.po_number}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { text-align: center; margin-bottom: 40px; }
        .title { font-size: 24px; font-weight: bold; color: #007bff; }
        .po-info { background: #f8f9fa; padding: 20px; margin: 20px 0; }
        .signature-section { margin-top: 60px; }
        .signature-line { border-bottom: 1px solid #000; width: 300px; margin: 40px 0 10px 0; }
        .checkbox { margin: 10px 0; }
        input[type="checkbox"] { margin-right: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">PURCHASE ORDER ACKNOWLEDGMENT</div>
        <p>PO Number: <strong>${po.po_number}</strong></p>
    </div>

    <div class="po-info">
        <p><strong>From:</strong> ${company.name}</p>
        <p><strong>To:</strong> ${supplier.name}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        <p><strong>Total Amount:</strong> R${Number(po.total_value).toFixed(2)}</p>
    </div>

    <p>We acknowledge receipt of the above purchase order and confirm:</p>

    <div class="checkbox">
        <input type="checkbox"> We accept the terms and conditions as specified
    </div>
    <div class="checkbox">
        <input type="checkbox"> We can deliver by the required date
    </div>
    <div class="checkbox">
        <input type="checkbox"> All pricing is confirmed as stated
    </div>

    <div class="signature-section">
        <p><strong>Supplier Acknowledgment:</strong></p>
        <div class="signature-line"></div>
        <p>Authorized Signature</p>
        
        <div class="signature-line"></div>
        <p>Print Name & Title</p>
        
        <div class="signature-line"></div>
        <p>Date</p>
    </div>

    <p style="margin-top: 40px; font-size: 12px; color: #666;">
        Please sign and return this acknowledgment within 2 business days.
    </p>
</body>
</html>`;
  }
}