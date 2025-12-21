const PDFDocument = require("pdfkit");

/**
 * Generate an earnings report PDF
 * @param {Object} reportData - Earnings report data including payments, totals, inspector info
 * @param {number} month - Month number (1-12)
 * @param {number} year - Year
 * @returns {Promise<Buffer>} - PDF buffer
 */
const generateEarningsReportPDF = (reportData, month, year) => {
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

      const safeMoveDown = (lines = 1) => {
        if (isNaN(doc.y) || doc.y === undefined || doc.y === null || doc.y < 0) {
          doc.y = 50;
        }
        doc.moveDown(lines);
        if (isNaN(doc.y) || doc.y === undefined || doc.y === null || doc.y < 0) {
          doc.y = 50;
        }
      };

      // Month names
      const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      const monthName = monthNames[month - 1] || "Unknown";

      // Title
      doc.fontSize(20).font("Helvetica-Bold").text("EARNINGS REPORT", { align: "center" });
      safeMoveDown(1);
      doc.fontSize(14).font("Helvetica").text(`${monthName} ${year}`, { align: "center" });
      safeMoveDown(2);

      // Inspector Information
      if (reportData.inspector) {
        doc.fontSize(14).font("Helvetica-Bold").text("Inspector Information", { underline: true });
        safeMoveDown(0.5);
        doc.fontSize(10).font("Helvetica");

        let startY = doc.y;
        const inspectorInfo = [
          ["Name", `${reportData.inspector.userFirstName || ""} ${reportData.inspector.userLastName || ""}`.trim() || "N/A"],
          ["Email", reportData.inspector.userEmail || "N/A"],
        ];

        inspectorInfo.forEach(([label, value]) => {
          if (isNaN(startY) || startY === undefined || startY === null) {
            startY = 50;
          }
          doc.text(`${label}:`, 50, startY, { width: 200, continued: true });
          doc.text(value || "N/A", 250, startY, { width: 250 });
          startY += 20;
        });

        safeMoveDown(2);
      }

      // Summary Section
      doc.fontSize(14).font("Helvetica-Bold").text("Summary", { underline: true });
      safeMoveDown(0.5);
      doc.fontSize(10).font("Helvetica");

      let summaryY = doc.y;
      const summary = [
        ["Total Earnings", formatCurrency(reportData.totalEarnings || 0)],
        ["Pending Earnings", formatCurrency(reportData.pendingEarnings || 0)],
        ["Processed Earnings", formatCurrency(reportData.processedEarnings || 0)],
      ];

      summary.forEach(([label, value]) => {
        if (isNaN(summaryY) || summaryY === undefined || summaryY === null) {
          summaryY = 50;
        }
        doc.text(`${label}:`, 50, summaryY, { width: 200, continued: true });
        doc.font("Helvetica-Bold").text(value, 250, summaryY, { width: 250 });
        doc.font("Helvetica");
        summaryY += 20;
      });

      safeMoveDown(2);

      // Earnings Details Table
      doc.fontSize(14).font("Helvetica-Bold").text("Earnings Details", { underline: true });
      safeMoveDown(0.5);

      if (reportData.payments && reportData.payments.length > 0) {
        // Table setup
        const tableLeft = 50;
        const tableRight = 545;
        const colWidths = {
          date: 80,
          caseId: 80,
          description: 150,
          amount: 80,
          status: 80,
        };

        let tableY = doc.y;
        if (isNaN(tableY) || tableY === undefined || tableY === null || tableY < 0) {
          tableY = 50;
        }

        // Header row
        doc.fontSize(8).font("Helvetica-Bold");
        doc.text("Date", tableLeft, tableY, { width: colWidths.date - 2 });
        doc.text("Case ID", tableLeft + colWidths.date, tableY, { width: colWidths.caseId - 2 });
        doc.text("Description", tableLeft + colWidths.date + colWidths.caseId, tableY, { width: colWidths.description - 2 });
        doc.text("Amount", tableLeft + colWidths.date + colWidths.caseId + colWidths.description, tableY, { width: colWidths.amount - 2 });
        doc.text("Status", tableLeft + colWidths.date + colWidths.caseId + colWidths.description + colWidths.amount, tableY, { width: colWidths.status - 2 });

        // Draw header line
        doc.moveTo(tableLeft, tableY + 12).lineTo(tableRight, tableY + 12).stroke();
        tableY += 18;

        // Data rows
        doc.fontSize(7).font("Helvetica");
        reportData.payments.forEach((payment) => {
          // Check if new page needed
          if (tableY > 680) {
            doc.addPage();
            tableY = 50;
          }

          const paymentData = payment.toJSON ? payment.toJSON() : payment;
          const date = formatDate(paymentData.paymentDate);
          const caseId = paymentData.caseId || "N/A";
          const description = (paymentData.case?.caseDescription || "N/A").substring(0, 30);
          const amount = formatCurrency(paymentData.paymentAmount || 0);
          const status = (paymentData.paymentStatus || "N/A").charAt(0).toUpperCase() + (paymentData.paymentStatus || "N/A").slice(1);

          doc.text(date, tableLeft, tableY, { width: colWidths.date - 2 });
          doc.text(caseId, tableLeft + colWidths.date, tableY, { width: colWidths.caseId - 2 });
          doc.text(description, tableLeft + colWidths.date + colWidths.caseId, tableY, { width: colWidths.description - 2 });
          doc.text(amount, tableLeft + colWidths.date + colWidths.caseId + colWidths.description, tableY, { width: colWidths.amount - 2, align: "right" });
          doc.text(status, tableLeft + colWidths.date + colWidths.caseId + colWidths.description + colWidths.amount, tableY, { width: colWidths.status - 2 });

          tableY += 20;
        });

        // Draw bottom line
        doc.moveTo(tableLeft, tableY).lineTo(tableRight, tableY).stroke();
        doc.y = tableY + 10;
      } else {
        doc.fontSize(10).font("Helvetica").text("No earnings recorded for this period.", { indent: 20 });
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

module.exports = { generateEarningsReportPDF };

