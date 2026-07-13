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

export const generateIAPDFReport = async ({ partido, reporteIA }) => {
  try {
    if (!reporteIA?.analisis_ia) {
      alert("El análisis de la IA aún no está disponible.");
      return;
    }

    const doc = new jsPDF('p', 'pt', 'a4');
    const primaryColor = [27, 67, 33]; // valle-green-dark
    const data = reporteIA.analisis_ia;

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
    doc.text('Reporte Táctico Generado por IA', 40, 115);

    // Date
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const today = new Date();
    doc.text(`Fecha de emisión: ${today.toLocaleDateString('es-VE')} a las ${today.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}`, 40, 130);
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'bold');
    doc.text(`Encuentro: ${partido.equipo_local} vs ${partido.equipo_visitante}`, 40, 145);

    let y = 180;
    doc.setTextColor(40, 40, 40);

    const checkPageBreak = (addedHeight) => {
      if (y + addedHeight > doc.internal.pageSize.height - 40) {
        doc.addPage();
        y = 60;
      }
    };

    if (data.resumen) {
      checkPageBreak(40);
      doc.setFontSize(13);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.text("Resumen del Partido", 40, y);
      y += 20;
      
      doc.setFontSize(11);
      doc.setTextColor(60, 60, 60);
      doc.setFont('helvetica', 'normal');
      const textLines = doc.splitTextToSize(data.resumen, 515);
      checkPageBreak(textLines.length * 15);
      doc.text(textLines, 40, y);
      y += (textLines.length * 15) + 30;
    }
    
    if (data.puntos_a_mejorar && data.puntos_a_mejorar.length > 0) {
      checkPageBreak(40);
      doc.setFontSize(13);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.text("Puntos Clave y Aspectos a Mejorar", 40, y);
      y += 20;
      
      doc.setFontSize(11);
      doc.setTextColor(60, 60, 60);
      doc.setFont('helvetica', 'normal');
      data.puntos_a_mejorar.forEach(punto => {
        const lines = doc.splitTextToSize(`• ${punto}`, 505);
        checkPageBreak(lines.length * 15);
        doc.text(lines, 45, y);
        y += (lines.length * 15) + 10;
      });
      y += 20;
    }
    
    if (data.analisis_individual) {
      checkPageBreak(40);
      doc.setFontSize(13);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.text("Análisis Táctico e Individual", 40, y);
      y += 20;
      
      doc.setFontSize(11);
      doc.setTextColor(60, 60, 60);
      doc.setFont('helvetica', 'normal');
      const textLines = doc.splitTextToSize(data.analisis_individual, 515);
      checkPageBreak(textLines.length * 15);
      doc.text(textLines, 40, y);
    }
    
    // Footer on all pages
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Página ${i} de ${pageCount} - El Valle F.S.`,
        40,
        doc.internal.pageSize.height - 20
      );
    }

    doc.save(`analisis_ia_${partido.equipo_local.replace(/\s+/g, '_')}_vs_${partido.equipo_visitante.replace(/\s+/g, '_')}.pdf`);
  } catch (error) {
    console.error("Error generando PDF de IA:", error);
    alert("Hubo un error al generar el PDF del análisis de IA.");
  }
};

