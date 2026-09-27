import {
  getClientStatement,
  getSupplierStatement,
  getTicketProfitReport,
  getVisaProfitReport,
  getClientAgingReport
} from '../services/report.service.js';
import { renderStatementHtml } from '../services/pdf.service.js';

export async function handleClientStatement(req, res, next) {
  try {
    const { clientId, from, to, format = 'json' } = req.query;
    if (!clientId) {
      return res.status(400).json({ message: 'Client ID is required.' });
    }

    const data = await getClientStatement({ clientId, from, to });

    if (format === 'pdf' || format === 'html') {
      const html = await renderStatementHtml({
        title: 'Client Account Statement',
        partyName: data.client.name,
        partyDetails: `Phone: ${data.client.phone || 'N/A'} | Email: ${data.client.email || 'N/A'}`,
        period: data.period,
        openingBalance: data.openingDue,
        closingBalance: data.closingDue,
        rows: data.rows
      });
      res.setHeader('Content-Type', 'text/html');
      return res.send(html);
    }

    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function handleSupplierStatement(req, res, next) {
  try {
    const { supplierId, from, to, format = 'json' } = req.query;
    if (!supplierId) {
      return res.status(400).json({ message: 'Supplier ID is required.' });
    }

    const data = await getSupplierStatement({ supplierId, from, to });

    if (format === 'pdf' || format === 'html') {
      const isPortal = data.supplier.type === 'PORTAL';
      const html = await renderStatementHtml({
        title: `${data.supplier.type} Supplier Statement`,
        partyName: `${data.supplier.name} (${data.supplier.type})`,
        partyDetails: `Contact: ${data.supplier.contactPerson || 'N/A'} | Phone: ${data.supplier.phone || 'N/A'}`,
        period: data.period,
        openingBalance: data.openingBalance,
        closingBalance: data.closingBalance,
        rows: data.rows
      });
      res.setHeader('Content-Type', 'text/html');
      return res.send(html);
    }

    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function handleTicketProfitReport(req, res, next) {
  try {
    const { from, to, airlineId, clientId, supplierId } = req.query;
    const data = await getTicketProfitReport({ from, to, airlineId, clientId, supplierId });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function handleVisaProfitReport(req, res, next) {
  try {
    const { from, to, sectorId, clientId, supplierId } = req.query;
    const data = await getVisaProfitReport({ from, to, sectorId, clientId, supplierId });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function handleClientAgingReport(req, res, next) {
  try {
    const data = await getClientAgingReport();
    res.json(data);
  } catch (err) {
    next(err);
  }
}
