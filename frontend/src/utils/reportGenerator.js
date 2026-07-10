import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const getBase64ImageFromUrl = async (imageUrl) => {
  try {
    const res = await fetch(imageUrl);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error('Error fetching image for PDF:', err);
    return null;
  }
};

export const generatePDFReport = async ({ title, filename, columns, data, extraInfo = '' }) => {
  try {
    const doc = new jsPDF('p', 'pt', 'a4');
    const primaryColor = [27, 67, 33]; // valle-green-dark

    const logoBase64 = await getBase64ImageFromUrl('/logo.png');

    // Header
    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', 40, 30, 45, 45);
    }
    
    doc.setFontSize(22);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('El Valle F.S.', logoBase64 ? 95 : 40, 50);

    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text('Sistema de Gestión Deportiva', logoBase64 ? 95 : 40, 65);

    // Separator Line
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(1.5);
    doc.line(40, 85, doc.internal.pageSize.width - 40, 85);

    // Title
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 40, 110);

    // Date
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const today = new Date();
    doc.text(`Fecha de emisión: ${today.toLocaleDateString('es-VE')} a las ${today.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}`, 40, 125);
    
    let startY = 140;
    if (extraInfo) {
      doc.text(extraInfo, 40, startY);
      startY += 15;
    }

    // Table
    autoTable(doc, {
      startY: startY,
      head: [columns],
      body: data,
      theme: 'grid',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center'
      },
      styles: {
        fontSize: 9,
        cellPadding: 6,
        textColor: [50, 50, 50],
        lineColor: [220, 220, 220],
        lineWidth: 0.5,
      },
      alternateRowStyles: {
        fillColor: [252, 252, 252]
      },
      didDrawPage: function (data) {
        // Footer
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Página ${doc.internal.getNumberOfPages()} - El Valle F.S.`,
          data.settings.margin.left,
          pageHeight - 20
        );
      }
    });

    doc.save(`${filename}.pdf`);
  } catch (error) {
    console.error("Error generando PDF:", error);
    alert("Hubo un error al generar el PDF. Por favor, revisa la consola.");
  }
};
