const PDFDocument = require("pdfkit");

/**
 * Generate a payout receipt PDF
 * @param {Object} payoutData - Payout data including payment, inspector, case details
 * @returns {Promise<Buffer>} - PDF buffer
 */
const generatePayoutPDF = (payoutData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      
      doc.on("end", () => {
        try {
          if (!chunks || chunks.length === 0) {
            throw new Error("PDF generation produced no data chunks");
          }
          const pdfBuffer = Buffer.concat(chunks);
          if (!pdfBuffer || pdfBuffer.length === 0) {
            throw new Error("PDF buffer is empty after combining chunks");
          }
          resolve(pdfBuffer);
        } catch (error) {
          reject(error);
        }
      });

      doc.on("error", (error) => reject(error));

      // Helper functions
      const formatCurrency = (amount) => {
        const numAmount = Number(amount);
        const safeAmount = isNaN(numAmount) || numAmount === null || numAmount === undefined ? 0 : numAmount;
        return new Intl.NumberFormat("nb-NO", {
          style: "currency",
          currency: "NOK",
          minimumFractionDigits: 2,
        }).format(safeAmount);
      };

      const formatDate = (date) => {
        if (!date) return "N/A";
        const d = new Date(date);
        return d.toLocaleDateString("nb-NO", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      };

      // Title
      doc.fontSize(20).font("Helvetica-Bold").text("PAYOUT RECEIPT", { align: "center" });
      doc.moveDown(2);

      // Payout Information
      doc.fontSize(14).font("Helvetica-Bold").text("Payout Information", { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).font("Helvetica");

      const payoutInfo = [
        ["Reference Number", payoutData.referenceNumber || payoutData.paymentId || "N/A"],
        ["Date", formatDate(payoutData.date || payoutData.paymentDate)],
        ["Amount", formatCurrency(payoutData.amount || payoutData.paymentAmount)],
        ["Status", (payoutData.status || "N/A").charAt(0).toUpperCase() + (payoutData.status || "N/A").slice(1)],
      ];

      let startY = doc.y;
      payoutInfo.forEach(([label, value]) => {
        if (isNaN(startY) || startY === undefined || startY === null) {
          startY = 50;
        }
        doc.text(`${label}:`, 50, startY, { width: 200, continued: true });
        doc.text(value || "N/A", 250, startY, { width: 250 });
        startY += 20;
      });

      doc.moveDown(2);

      // Inspector Information
      if (payoutData.inspector) {
        doc.fontSize(14).font("Helvetica-Bold").text("Inspector Information", { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10).font("Helvetica");

        const inspectorInfo = [
          ["Name", `${payoutData.inspector.userFirstName || ""} ${payoutData.inspector.userLastName || ""}`.trim() || "N/A"],
          ["Email", payoutData.inspector.userEmail || "N/A"],
          ["Phone", payoutData.inspector.userPhone || "N/A"],
        ];

        startY = doc.y;
        inspectorInfo.forEach(([label, value]) => {
          if (isNaN(startY) || startY === undefined || startY === null) {
            startY = 50;
          }
          doc.text(`${label}:`, 50, startY, { width: 200, continued: true });
          doc.text(value || "N/A", 250, startY, { width: 250 });
          startY += 20;
        });

        doc.moveDown(2);
      }

      // Case Information
      if (payoutData.caseDescription || payoutData.caseId) {
        doc.fontSize(14).font("Helvetica-Bold").text("Case Information", { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10).font("Helvetica");

        const caseInfo = [
          ["Case ID", payoutData.caseId || "N/A"],
          ["Case Description", payoutData.caseDescription || "N/A"],
        ];

        startY = doc.y;
        caseInfo.forEach(([label, value]) => {
          if (isNaN(startY) || startY === undefined || startY === null) {
            startY = 50;
          }
          doc.text(`${label}:`, 50, startY, { width: 200, continued: true });
          doc.text(value || "N/A", 250, startY, { width: 250 });
          startY += 20;
        });

        doc.moveDown(2);
      }

      // Footer
      const pageHeight = doc.page?.height;
      const pageWidth = doc.page?.width;
      
      if (!isNaN(pageHeight) && !isNaN(pageWidth) && pageHeight > 0 && pageWidth > 0) {
        const footerX = Math.max(50, pageWidth - 200);
        const footerY = Math.max(50, pageHeight - 30);
        
        if (!isNaN(footerX) && !isNaN(footerY) && footerX >= 0 && footerY >= 0) {
          try {
            doc.fontSize(8).font("Helvetica");
            doc.text(
              `Generated: ${new Date().toLocaleString("nb-NO")}`,
              footerX,
              footerY,
              { align: "right" }
            );
          } catch (footerError) {
            console.warn("⚠️ Could not add footer to PDF:", footerError.message);
          }
        }
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generatePayoutPDF };

