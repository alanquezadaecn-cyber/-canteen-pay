import React from 'react';
import QRCode from 'qrcode.react';

interface QRDisplayProps {
  value: string;
  name: string;
  employeeNumber: string;
  className?: string;
}

export const QRDisplay: React.FC<QRDisplayProps> = ({
  value,
  name,
  employeeNumber,
  className = ''
}) => {
  const handleDownload = () => {
    const element = document.getElementById('qr-code');
    const canvas = element?.querySelector('canvas') as HTMLCanvasElement;
    if (canvas) {
      const link = document.createElement('a');
      link.download = `qr-${name}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div
        id="qr-code"
        className="bg-white p-4 rounded-xl shadow-lg mb-6"
      >
        <QRCode
          value={value}
          size={300}
          level="H"
          includeMargin={true}
          fgColor="#0F172A"
          bgColor="#FFFFFF"
        />
      </div>
      <div className="text-center mb-8">
        <h3 className="text-xl font-semibold text-slate-900 mb-1">{name}</h3>
        <p className="text-sm text-slate-600">
          Empleado #{employeeNumber}
        </p>
      </div>
      <button
        onClick={handleDownload}
        className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
      >
        Descargar QR
      </button>
    </div>
  );
};
