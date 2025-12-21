const PDFDocument = require("pdfkit");
const { uploadToAzure } = require("./azureStorage");

/**
 * Generate a damage report PDF and upload it to Azure
 * @param {Object} reportData - Report data including case, items, summary, photos
 * @param {Object} caseData - Full case details with tenant, inspector, property, damages
 * @param {string} reportId - The report ID
 * @returns {Promise<string>} - Azure URL of the uploaded PDF
 */
const generateReportPDF = async (reportData, caseData, reportId) => {
  console.log(`🔄 generateReportPDF called for reportId: ${reportId}, caseId: ${caseData?.caseId}`);
  
  return new Promise((resolve, reject) => {
    try {
      console.log(`🔄 Creating PDFDocument...`);
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      // Collect PDF chunks
      const chunks = [];
      doc.on("data", (chunk) => {
        chunks.push(chunk);
      });
      
      doc.on("end", async () => {
        try {
          console.log(`🔄 PDF document ended, combining ${chunks.length} chunks...`);
          // Combine all chunks into a buffer
          const pdfBuffer = Buffer.concat(chunks);
          console.log(`✅ PDF buffer created, size: ${pdfBuffer.length} bytes`);

          // Generate filename
          const reportNumber = `RPT-${caseData.caseId || "N/A"}-${new Date().toISOString().split("T")[0].replace(/-/g, "")}`;
          const fileName = `${reportNumber}.pdf`;
          console.log(`🔄 Uploading PDF to Azure with filename: ${fileName}`);

          // Upload to Azure
          const pdfUrl = await uploadToAzure(
            pdfBuffer,
            fileName,
            "application/pdf",
            "Reports"
          );

          if (!pdfUrl) {
            throw new Error("uploadToAzure returned null or undefined URL");
          }

          console.log(`✅ PDF generated and uploaded to Azure: ${pdfUrl}`);
          resolve(pdfUrl);
        } catch (uploadError) {
          console.error("❌ Error uploading PDF to Azure:", uploadError);
          console.error("❌ Upload error details:", {
            message: uploadError.message,
            stack: uploadError.stack,
            reportId: reportId,
          });
          reject(uploadError);
        }
      });

      doc.on("error", (error) => {
        console.error("❌ Error generating PDF:", error);
        reject(error);
      });

      // Helper function to format currency (NOK) - handles NaN and null
      const formatCurrency = (amount) => {
        // Convert to number and handle NaN, null, undefined
        const numAmount = Number(amount);
        const safeAmount = (isNaN(numAmount) || numAmount === null || numAmount === undefined) ? 0 : numAmount;
        return new Intl.NumberFormat("nb-NO", {
          style: "currency",
          currency: "NOK",
          minimumFractionDigits: 2,
        }).format(safeAmount);
      };

      // Helper function to format date
      const formatDate = (date) => {
        if (!date) return "N/A";
        const d = new Date(date);
        return d.toLocaleDateString("nb-NO", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      };

      // Generate report number and date
      const reportNumber = `RPT-${caseData.caseId || "N/A"}-${new Date().toISOString().split("T")[0].replace(/-/g, "")}`;
      const reportDate = formatDate(new Date());
      const firstDamage = caseData?.damages?.[0];
      const damageDate = formatDate(firstDamage?.damageDate);

      // Title
      doc.fontSize(20).font("Helvetica-Bold").text("DAMAGE REPORT", { align: "center" });
      doc.moveDown(2);

      // Assignment Information
      doc.fontSize(14).font("Helvetica-Bold").text("Assignment Information", { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).font("Helvetica");

      const assignmentData = [
        ["Report Number", reportNumber],
        ["Date of Report", reportDate],
        ["Inspection Company", "Utleieskade Inspection Services"],
        ["Inspector", caseData?.inspector 
          ? `${caseData.inspector.userFirstName || ""} ${caseData.inspector.userLastName || ""}`
          : "N/A"],
        ["Ordered by", caseData?.tenant 
          ? `${caseData.tenant.userFirstName || ""} ${caseData.tenant.userLastName || ""}`
          : "N/A"],
        ["Property/Address", caseData?.property?.propertyAddress || caseData?.propertyAddress || "N/A"],
        ["Contact Information", caseData?.tenant 
          ? `Email: ${caseData.tenant.userEmail || "N/A"} | Phone: ${caseData.tenant.userPhone || "N/A"}`
          : "N/A"],
      ];

      // Create a simple table layout for assignment info
      // Ensure doc.y is valid before using it
      let startY = (isNaN(doc.y) || doc.y === undefined || doc.y === null) ? 50 : doc.y;
      assignmentData.forEach(([label, value]) => {
        // Validate startY is a number
        if (isNaN(startY)) {
          console.error("❌ Invalid startY in assignmentData loop, skipping");
          return;
        }
        doc.text(`${label}:`, 50, startY, { width: 200, continued: true });
        doc.text(value || "N/A", 250, startY, { width: 250 });
        startY += 20;
      });

      doc.moveDown(2);

      // Damage Information
      doc.fontSize(14).font("Helvetica-Bold").text("Damage Information", { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).font("Helvetica");

      const damageData = [
        ["Date of Damage", damageDate],
        ["Possibility of Unknown Date of Damage", "To be determined"],
        ["Type of Damage", firstDamage?.damageType || caseData?.caseDescription || "N/A"],
        ["Cause of Damage", firstDamage?.damageDescription || "To be assessed"],
        ["Damage Location", firstDamage?.damageLocation || caseData?.property?.propertyAddress || "N/A"],
      ];

      // Ensure doc.y is valid before using it
      startY = (isNaN(doc.y) || doc.y === undefined || doc.y === null) ? 50 : doc.y;
      damageData.forEach(([label, value]) => {
        // Validate startY is a number
        if (isNaN(startY)) {
          console.error("❌ Invalid startY in damageData loop, skipping");
          return;
        }
        doc.text(`${label}:`, 50, startY, { width: 200, continued: true });
        doc.text(value || "N/A", 250, startY, { width: 250 });
        startY += 20;
      });

      doc.moveDown(2);

      // Damage Description
      doc.fontSize(14).font("Helvetica-Bold").text("Damage Description", { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).font("Helvetica");
      doc.text(
        "Based on submitted information and photos, the following description of the damage forms the basis for further assessments:",
        { align: "left" }
      );
      doc.moveDown(0.5);
      doc.text(reportData.reportDescription || "No description provided", {
        align: "left",
        indent: 20,
      });

      doc.moveDown(2);

      // Damage Repair
      doc.fontSize(14).font("Helvetica-Bold").text("Damage Repair", { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).font("Helvetica");
      doc.text(
        "To repair the damage, the valuation engineer finds it necessary to carry out the following repair work:",
        { align: "left" }
      );
      doc.moveDown(0.5);
      doc.text(reportData.reportDescription || "Repair work details to be specified", {
        align: "left",
        indent: 20,
      });

      doc.moveDown(2);

      // Repair Estimate
      doc.fontSize(14).font("Helvetica-Bold").text("Repair Estimate", { underline: true });
      doc.moveDown(0.5);

      if (reportData.items && reportData.items.length > 0) {
        // Table dimensions - A4 page width: 595 points, with 50pt margins each side = 495pt available
        const tableLeft = 50;
        const tableRight = 545;
        const tableWidth = tableRight - tableLeft;
        // Ensure doc.y is valid before using it
        const tableTop = (isNaN(doc.y) || doc.y === undefined || doc.y === null) ? 50 : doc.y;
        const itemHeight = 25;
        let currentY = tableTop;
        
        // Validate currentY is a number
        if (isNaN(currentY)) {
          console.error("❌ Invalid currentY, resetting to 50");
          currentY = 50;
        }

        // Column widths (sums to ~495 points)
        const colWidths = {
          post: 30,
          desc: 180,
          qty: 30,
          unit: 30,
          unitPrice: 50,
          sumMat: 50,
          hours: 30,
          hourlyRate: 50,
          sumWork: 50,
          sumPost: 60,
        };

        // Calculate column positions
        let xPos = tableLeft;
        const colPositions = {
          post: xPos,
          desc: (xPos += colWidths.post),
          qty: (xPos += colWidths.desc),
          unit: (xPos += colWidths.qty),
          unitPrice: (xPos += colWidths.unit),
          sumMat: (xPos += colWidths.unitPrice),
          hours: (xPos += colWidths.sumMat),
          hourlyRate: (xPos += colWidths.hours),
          sumWork: (xPos += colWidths.hourlyRate),
          sumPost: (xPos += colWidths.sumWork),
        };

        // Header row
        doc.fontSize(7).font("Helvetica-Bold");
        doc.text("#", colPositions.post, currentY, { width: colWidths.post - 2 });
        doc.text("Description", colPositions.desc, currentY, { width: colWidths.desc - 2 });
        doc.text("Qty", colPositions.qty, currentY, { width: colWidths.qty - 2 });
        doc.text("Unit", colPositions.unit, currentY, { width: colWidths.unit - 2 });
        doc.text("U.Price", colPositions.unitPrice, currentY, { width: colWidths.unitPrice - 2 });
        doc.text("Sum Mat", colPositions.sumMat, currentY, { width: colWidths.sumMat - 2 });
        doc.text("Hrs", colPositions.hours, currentY, { width: colWidths.hours - 2 });
        doc.text("H.Rate", colPositions.hourlyRate, currentY, { width: colWidths.hourlyRate - 2 });
        doc.text("Sum Wk", colPositions.sumWork, currentY, { width: colWidths.sumWork - 2 });
        doc.text("Sum", colPositions.sumPost, currentY, { width: colWidths.sumPost - 2 });

        // Draw header line
        doc.moveTo(tableLeft, currentY + 12).lineTo(tableRight, currentY + 12).stroke();
        currentY += 18;

        // Items rows
        doc.fontSize(7).font("Helvetica");
        reportData.items.forEach((item, index) => {
          // Check if we need a new page (leave room for summary at bottom)
          if (currentY > 680) {
            doc.addPage();
            currentY = 50;
          }

          // Ensure all item values are numbers, not NaN
          const safeItem = {
            item: item.item || "",
            quantity: Number(item.quantity) || 0,
            unitPrice: Number(item.unitPrice) || 0,
            hours: Number(item.hours) || 0,
            hourlyRate: Number(item.hourlyRate) || 0,
            sumMaterial: Number(item.sumMaterial) || 0,
            sumWork: Number(item.sumWork) || 0,
            sumPost: Number(item.sumPost) || 0,
          };

          const post = index + 1;
          doc.text(String(post), colPositions.post, currentY, { width: colWidths.post - 2 });
          doc.text(safeItem.item.substring(0, 25), colPositions.desc, currentY, { width: colWidths.desc - 2 }); // Truncate long descriptions
          doc.text(String(safeItem.quantity), colPositions.qty, currentY, { width: colWidths.qty - 2, align: "right" });
          doc.text("pcs", colPositions.unit, currentY, { width: colWidths.unit - 2 });
          doc.text(formatCurrency(safeItem.unitPrice), colPositions.unitPrice, currentY, { width: colWidths.unitPrice - 2, align: "right" });
          doc.text(formatCurrency(safeItem.sumMaterial), colPositions.sumMat, currentY, { width: colWidths.sumMat - 2, align: "right" });
          doc.text(String(safeItem.hours), colPositions.hours, currentY, { width: colWidths.hours - 2, align: "right" });
          doc.text(formatCurrency(safeItem.hourlyRate), colPositions.hourlyRate, currentY, { width: colWidths.hourlyRate - 2, align: "right" });
          doc.text(formatCurrency(safeItem.sumWork), colPositions.sumWork, currentY, { width: colWidths.sumWork - 2, align: "right" });
          doc.text(formatCurrency(safeItem.sumPost), colPositions.sumPost, currentY, { width: colWidths.sumPost - 2, align: "right" });

          currentY += itemHeight;
        });

        // Draw bottom line
        doc.moveTo(tableLeft, currentY).lineTo(tableRight, currentY).stroke();
        // Set doc.y explicitly after table to ensure it's valid
        const finalTableY = currentY + 25; // Space after table
        doc.y = isNaN(finalTableY) ? 50 : finalTableY;
        // Use moveDown to ensure PDFKit's internal state is updated
        doc.moveDown(2);
      } else {
        doc.text("No items added", { align: "left" });
        doc.moveDown(1);
      }

      // Ensure doc.y is valid before continuing to Results section
      if (isNaN(doc.y) || doc.y === undefined || doc.y === null || doc.y < 0) {
        console.warn("⚠️ doc.y is invalid before Results section, resetting");
        doc.y = 50; // Safe default
      }

      // Results Summary
      if (reportData.summary) {
        // Ensure all summary values are numbers, not NaN
        const safeSummary = {
          totalHours: Number(reportData.summary.totalHours) || 0,
          totalSumMaterials: Number(reportData.summary.totalSumMaterials) || 0,
          totalSumLabor: Number(reportData.summary.totalSumLabor) || 0,
          sumExclVAT: Number(reportData.summary.sumExclVAT) || 0,
          vat: Number(reportData.summary.vat) || 0,
          sumInclVAT: Number(reportData.summary.sumInclVAT) || 0,
          total: Number(reportData.summary.total) || 0,
        };

        // Draw Results title with underline - doc.y should be valid now
        doc.fontSize(12).font("Helvetica-Bold").text("Results:", { underline: true });
        doc.moveDown(0.5);
        doc.moveDown(0.5);
        doc.fontSize(10).font("Helvetica");

        // Use relative positioning to avoid NaN coordinate issues
        doc.text(`Hours: ${safeSummary.totalHours}`, { indent: 20 });
        doc.text(`Sum material: ${formatCurrency(safeSummary.totalSumMaterials)}`, { indent: 20 });
        doc.text(`Sum labor: ${formatCurrency(safeSummary.totalSumLabor)}`, { indent: 20 });
        doc.text(`Sum excl. VAT: ${formatCurrency(safeSummary.sumExclVAT)}`, { indent: 20 });
        doc.text(`VAT: ${formatCurrency(safeSummary.vat)}`, { indent: 20 });
        doc.text(`Sum incl. VAT: ${formatCurrency(safeSummary.sumInclVAT)}`, { indent: 20 });

        doc.moveDown(1.5);

        // Conclusion
        doc.fontSize(12).font("Helvetica-Bold").text("Conclusion", { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10).font("Helvetica");

        doc.text(
          `Sum from calculation program: NOK ${formatCurrency(safeSummary.sumInclVAT)}`
        );
        doc.text("+ Loss of rental income: NOK " + formatCurrency(0));
        doc.text("- Standard improvement deduction: NOK " + formatCurrency(0));
        doc.moveDown(0.5);
        doc.font("Helvetica-Bold").fontSize(12);
        doc.text(
          `= Total value of the damage, incl. VAT: NOK ${formatCurrency(safeSummary.total)}`
        );
      }

      doc.moveDown(2);

      // Signature section
      doc.fontSize(14).font("Helvetica-Bold").text("Signature", { underline: true });
      doc.moveDown(1);
      doc.fontSize(10).font("Helvetica");
      doc.text("Inspector Signature", 50, doc.y);
      doc.moveDown(2);
      doc.moveTo(50, doc.y).lineTo(250, doc.y).stroke();
      doc.moveDown(2);

      // Assumptions
      doc.fontSize(14).font("Helvetica-Bold").text("Assumptions", { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(9).font("Helvetica");

      const assumptions = [
        "This damage report is based on submitted and available information, possibly supplemented with further investigations, and according to the valuation engineer's professional expertise, judgment, and experience. The report only addresses the building parts, elements, and requirements presented by the submitter; it is therefore not an exhaustive report on the property's condition or quality.",
        "If the assumptions underlying this damage report are incorrect, the issuer must be informed so that the report can be amended.",
        "The damage report does not address any legal and/or financial matters between the parties involved in the case.",
        "The report is valid for six months from the date of signature.",
      ];

      assumptions.forEach((text) => {
        doc.text(text, { align: "left", indent: 20 });
        doc.moveDown(0.5);
      });

      // Footer with generation date
      const pageHeight = doc.page.height;
      const pageWidth = doc.page.width;
      doc.fontSize(8).font("Helvetica");
      doc.text(
        `Generated: ${new Date().toLocaleString("nb-NO")}`,
        pageWidth - 200,
        pageHeight - 30,
        { align: "right" }
      );

      // Finalize PDF
      console.log(`🔄 Finalizing PDF document...`);
      doc.end();
      console.log(`✅ PDF document finalized`);
    } catch (error) {
      console.error("❌ Error in PDF generation:", error);
      console.error("❌ PDF generation error details:", {
        message: error.message,
        stack: error.stack,
        reportId: reportId,
        caseId: caseData?.caseId,
      });
      reject(error);
    }
  });
};

module.exports = { generateReportPDF };

