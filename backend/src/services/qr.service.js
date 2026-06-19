import QRCode from 'qrcode';
import { randomUUID } from 'crypto';

export class QRService {
  static generateUniqueCode() {
    return randomUUID();
  }

  static async generateQRImage(data) {
    try {
      const qrImage = await QRCode.toDataURL(data, {
        width: 300,
        margin: 2,
        color: {
          dark: '#0F172A',
          light: '#FFFFFF'
        }
      });
      return qrImage;
    } catch (err) {
      throw new Error('Error generando código QR: ' + err.message);
    }
  }

  static async generateQRBuffer(data) {
    try {
      const buffer = await QRCode.toBuffer(data, {
        width: 300,
        margin: 2,
        color: {
          dark: '#0F172A',
          light: '#FFFFFF'
        }
      });
      return buffer;
    } catch (err) {
      throw new Error('Error generando código QR: ' + err.message);
    }
  }
}
