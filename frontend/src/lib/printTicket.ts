import { printViaQZ } from './qzPrint';

export interface TicketData {
  type: 'PURCHASE' | 'RECHARGE' | 'REFUND';
  userName: string;
  employeeNumber: string;
  amount: string | number;
  balanceBefore: string | number;
  balanceAfter: string | number;
  date?: string | Date;
  transactionId?: string;
  description?: string;
}

const TYPE_LABEL: Record<TicketData['type'], string> = {
  PURCHASE: 'COMPRA',
  RECHARGE: 'RECARGA DE SALDO',
  REFUND: 'REEMBOLSO',
};

const fmt = (n: string | number) =>
  `$${parseFloat(String(n)).toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const fmtDate = (d?: string | Date) => {
  const dt = d ? new Date(d) : new Date();
  return dt.toLocaleString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

function printTicketHTML(data: TicketData) {
  const isCharge = data.type === 'PURCHASE';
  const amountFormatted = isCharge
    ? `-${fmt(data.amount)}`
    : `+${fmt(data.amount)}`;

  const shortId = data.transactionId
    ? data.transactionId.slice(-8).toUpperCase()
    : Math.random().toString(36).slice(2, 10).toUpperCase();

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<title>Ticket CashFood</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Courier New', Courier, monospace;
    font-size: 12px;
    width: 80mm;
    max-width: 80mm;
    padding: 6mm 4mm;
    color: #000;
    background: #fff;
  }
  .center { text-align: center; }
  .right  { text-align: right; }
  .bold   { font-weight: bold; }
  .lg     { font-size: 15px; }
  .xl     { font-size: 18px; }
  .sep    { border-top: 1px dashed #000; margin: 5px 0; }
  .sep-solid { border-top: 1px solid #000; margin: 5px 0; }
  .row    { display: flex; justify-content: space-between; margin: 2px 0; }
  .label  { color: #444; }
  .amount { font-size: 20px; font-weight: bold; letter-spacing: 1px; }
  .badge  {
    display: inline-block;
    border: 1px solid #000;
    padding: 1px 8px;
    font-size: 11px;
    letter-spacing: 2px;
  }
  .footer { font-size: 10px; color: #555; }
  @media print {
    @page { margin: 0; size: 80mm auto; }
    body { padding: 4mm 3mm; }
  }
</style>
</head>
<body>
  <div class="center" style="margin-bottom:8px">
    <p class="xl bold">MEALPAY</p>
    <p class="footer">Sistema de Comedor Digital</p>
  </div>

  <div class="sep-solid"></div>

  <div class="center" style="margin: 6px 0">
    <span class="badge bold">${TYPE_LABEL[data.type]}</span>
  </div>

  <div class="sep"></div>

  <div class="row"><span class="label">Fecha:</span><span>${fmtDate(data.date)}</span></div>
  <div class="row"><span class="label">Folio:</span><span class="bold">#${shortId}</span></div>

  <div class="sep"></div>

  <div class="row"><span class="label">Usuario:</span><span class="bold">${data.userName}</span></div>
  <div class="row"><span class="label">Empleado:</span><span>#${data.employeeNumber}</span></div>

  <div class="sep-solid"></div>

  <div class="center" style="margin: 8px 0">
    <p class="label" style="font-size:10px;margin-bottom:2px">MONTO</p>
    <p class="amount">${amountFormatted}</p>
  </div>

  <div class="sep-solid"></div>

  <div class="row"><span class="label">Saldo anterior:</span><span>${fmt(data.balanceBefore)}</span></div>
  <div class="row bold"><span>Saldo actual:</span><span class="lg">${fmt(data.balanceAfter)}</span></div>

  ${data.description ? `<div class="sep"></div><p class="footer" style="font-size:10px">${data.description}</p>` : ''}

  <div class="sep-solid"></div>

  <div class="center footer" style="margin-top:6px;line-height:1.6">
    <p>¡Gracias por usar CashFood!</p>
    <p>Conserve este comprobante</p>
  </div>
</body>
</html>`;

  const popup = window.open('', '_blank', 'width=320,height=520,scrollbars=no,menubar=no,toolbar=no');
  if (!popup) {
    alert('Permite ventanas emergentes para imprimir el ticket.');
    return;
  }
  popup.document.write(html);
  popup.document.close();
  popup.focus();
  popup.onload = () => {
    popup.print();
    popup.onafterprint = () => popup.close();
  };
  setTimeout(() => {
    try { popup.print(); } catch (_) {}
  }, 400);
}

/**
 * Punto de entrada principal.
 * 1. Intenta imprimir directo vía QZ Tray (sin diálogo, ESC/POS térmico).
 * 2. Si QZ Tray no está disponible, abre ventana HTML con window.print().
 */
export async function printTicket(data: TicketData): Promise<void> {
  const ok = await printViaQZ(data);
  if (!ok) printTicketHTML(data);
}

// Alias para llamadas síncronas en botones que no pueden ser async
// (hace la llamada async en background sin bloquear UI)
export function printTicketSync(data: TicketData): void {
  printTicket(data).catch(() => printTicketHTML(data));
}
