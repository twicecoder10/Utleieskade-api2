const paymentService = require("../services/paymentService");
const responseHandler = require("../utils/responseHandler");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const caseService = require("../services/caseService");
const { Payment, Property } = require("../models/index");
const { generateUniqueId } = require("../utils/uniqueIdGenerator");

exports.getPayments = async (req, res) => {
  try {
    const { search, status, page, limit, sortBy, sortOrder } = req.query;

    const payments = await paymentService.getPayments({
      search,
      status,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      sortBy: sortBy || "paymentDate",
      sortOrder: sortOrder || "desc",
    });

    responseHandler.setSuccess(
      200,
      "Payments retrieved successfully",
      payments
    );
    return responseHandler.send(res);
  } catch (error) {
    responseHandler.setError(500, error.message);
    return responseHandler.send(res);
  }
};

exports.getPaymentById = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await paymentService.getPaymentById(paymentId);

    if (!payment) {
      responseHandler.setError(404, "Payment not found");
      return responseHandler.send(res);
    }

    responseHandler.setSuccess(
      200,
      "Payment details retrieved successfully",
      payment
    );
    return responseHandler.send(res);
  } catch (error) {
    responseHandler.setError(500, error.message);
    return responseHandler.send(res);
  }
};

exports.approvePayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const result = await paymentService.approvePayment(paymentId);

    if (!result) {
      responseHandler.setError(404, "Payment not found");
      return responseHandler.send(res);
    }

    responseHandler.setSuccess(200, "Payment approved successfully");
    return responseHandler.send(res);
  } catch (error) {
    responseHandler.setError(500, error.message);
    return responseHandler.send(res);
  }
};

exports.rejectPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      responseHandler.setError(400, "Rejection reason is required.");
      return responseHandler.send(res);
    }

    const result = await paymentService.rejectPayment(
      paymentId,
      rejectionReason
    );

    if (!result) {
      responseHandler.setError(404, "Payment not found");
      return responseHandler.send(res);
    }

    responseHandler.setSuccess(200, "Payment rejected successfully");
    return responseHandler.send(res);
  } catch (error) {
    responseHandler.setError(500, error.message);
    return responseHandler.send(res);
  }
};

exports.generatePaymentReport = async (req, res) => {
  try {
    const { paymentId } = req.params;
    await paymentService.generatePaymentReportPDF(paymentId, res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create Stripe Payment Intent for tenant payment
exports.createPaymentIntent = async (req, res) => {
  try {
    const { amount, caseData, metadata } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      responseHandler.setError(401, "User not authenticated");
      return responseHandler.send(res);
    }

    if (!amount || amount <= 0) {
      responseHandler.setError(400, "Invalid payment amount");
      return responseHandler.send(res);
    }

    // Convert amount to cents (Stripe uses smallest currency unit)
    const amountInCents = Math.round(amount * 100);

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "nok", // Norwegian Krone
      metadata: {
        userId: userId,
        ...metadata,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    responseHandler.setSuccess(200, "Payment intent created successfully", {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
    return responseHandler.send(res);
  } catch (error) {
    console.error("Error creating payment intent:", error);
    responseHandler.setError(500, error.message || "Failed to create payment intent");
    return responseHandler.send(res);
  }
};

// Confirm payment and create case
exports.confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId, caseData } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      responseHandler.setError(401, "User not authenticated");
      return responseHandler.send(res);
    }

    if (!paymentIntentId) {
      responseHandler.setError(400, "Payment intent ID is required");
      return responseHandler.send(res);
    }

    // Verify payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      responseHandler.setError(400, `Payment not completed. Status: ${paymentIntent.status}`);
      return responseHandler.send(res);
    }

    // Check if payment was already processed
    const existingPayment = await Payment.findOne({
      where: {
        paymentDescription: paymentIntentId,
      },
    });

    if (existingPayment) {
      responseHandler.setError(400, "Payment has already been processed");
      return responseHandler.send(res);
    }

    // Find or create property
    let property = await Property.findOne({
      where: { propertyAddress: caseData.propertyAddress },
    });

    if (!property) {
      // Extract city from address or use default
      // Try to extract city from address (e.g., "123 Main St, Oslo" -> "Oslo")
      let propertyCity = "Oslo"; // Default city for Norway
      if (caseData.propertyAddress) {
        const addressParts = caseData.propertyAddress.split(",");
        if (addressParts.length > 1) {
          // Last part might be city
          const potentialCity = addressParts[addressParts.length - 1].trim();
          if (potentialCity && potentialCity.length > 0) {
            propertyCity = potentialCity;
          }
        } else {
          // If no comma, try to extract from end of string
          const words = caseData.propertyAddress.trim().split(/\s+/);
          if (words.length > 1) {
            const potentialCity = words[words.length - 1];
            if (potentialCity && potentialCity.length > 0) {
              propertyCity = potentialCity;
            }
          }
        }
      }

      property = await Property.create({
        propertyId: generateUniqueId("PROP"),
        propertyAddress: caseData.propertyAddress,
        propertyType: "residential",
        propertyCity: propertyCity || "Oslo", // Ensure city is always set (required field)
        propertyCountry: "Norway",
      });
    }

    // Create case
    const newCase = await caseService.createCase({
      userId,
      propertyId: property.propertyId,
      buildingNumber: caseData.buildingNumber,
      caseDescription: caseData.caseDescription,
      caseUrgencyLevel: caseData.caseUrgencyLevel || "moderate",
      damages: caseData.damages || [],
    });

    // Create payment record
    const payment = await Payment.create({
      paymentId: generateUniqueId("PAYE"),
      caseId: newCase.caseId,
      paymentAmount: (paymentIntent.amount / 100).toString(), // Convert back from cents
      paymentDate: new Date(),
      paymentStatus: "processed",
      paymentDescription: `Stripe Payment: ${paymentIntentId}`,
    });

    responseHandler.setSuccess(200, "Payment confirmed and case created successfully", {
      caseId: newCase.caseId,
      paymentId: payment.paymentId,
    });
    return responseHandler.send(res);
  } catch (error) {
    console.error("Error confirming payment:", error);
    responseHandler.setError(500, error.message || "Failed to confirm payment");
    return responseHandler.send(res);
  }
};
