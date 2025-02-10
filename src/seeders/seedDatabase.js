const { sequelize } = require("../models");
const bcrypt = require("bcryptjs");

const {
  User,
  Case,
  Damage,
  Payment,
  Assessment,
  Availability,
  BankDetails,
  Expertise,
  InspectorPayment,
  Property,
  TrackingTime,
} = require("../models");
const { v4: uuidv4 } = require("uuid");

const seedDatabase = async () => {
  try {
    console.log("🌱 Seeding database...");

    await sequelize.sync({ force: true });

    await User.bulkCreate([
      {
        userId: "a4d32525-e0a7-4c95-82e3-990c38c338fd",
        userFirstName: "John",
        userLastName: "Doe",
        userEmail: "johndoe@mail.com",
        userPhone: "+441234567890",
        userCity: "London",
        userAddress: "123 Main Street",
        userPostcode: "S12 2IS",
        userCountry: "UK",
        userType: "tenant",
        userPassword: await bcrypt.hash("password123", 10),
      },
      {
        userId: uuidv4(),
        userFirstName: "Jane",
        userLastName: "Smith",
        userEmail: "janesmith@mail.com",
        userPhone: "+441234567899",
        userCity: "Birmingham",
        userAddress: "456 High Street",
        userPostcode: "B10 5TW",
        userCountry: "UK",
        userType: "landlord",
        userPassword: await bcrypt.hash("password123", 10),
      },
      {
        userId: "d232e81f-6622-4a20-817f-1ffbfbba295a",
        userFirstName: "Jude",
        userLastName: "Scott",
        userEmail: "judescott@mail.com",
        userPhone: "+441234567898",
        userCity: "Manchester",
        userPostcode: "M2 2JW",
        userAddress: "6 Newgate Road",
        userCountry: "UK",
        userType: "inspector",
        userPassword: await bcrypt.hash("password123", 10),
        inspectorStatus: "active",
        inspectorExpertiseCode: 101,
      },
    ]);

    await Expertise.bulkCreate([
      {
        expertiseCode: 101,
        expertiseArea: "Plumbing",
        expertiseDescription: "Handles plumbing issues",
      },
      {
        expertiseCode: 102,
        expertiseArea: "Electrical",
        expertiseDescription: "Handles electrical repairs",
      },
    ]);

    await Property.bulkCreate([
      {
        propertyId: uuidv4(),
        propertyType: "Apartment",
        propertyCity: "London",
        propertyAddress: "12 Baker Street",
        propertyCountry: "UK",
      },
      {
        propertyId: "cecba28f-fc8d-45e7-b46b-5400c58b088f",
        propertyType: "Apartment",
        propertyCity: "London",
        propertyAddress: "120 Martin Luther Street",
        propertyCountry: "UK",
      },
    ]);

    await Case.bulkCreate([
      {
        caseId: "e6c5a26d-3b55-4ea3-a342-20417806feb4",
        CaseCompletedDate: null,
        userId: "a4d32525-e0a7-4c95-82e3-990c38c338fd",
        inspectorId: "d232e81f-6622-4a20-817f-1ffbfbba295a",
        caseStatus: "open",
        CaseUrgencyLevel: "high",
        caseDescription: "Water leakage in the bathroom.",
      },
    ]);

    await Damage.bulkCreate([
      {
        damageId: uuidv4(),
        damageArea: "Bathroom",
        damagePhotos: JSON.stringify(["photo1.jpg", "photo2.jpg"]),
        damageDescription: "Severe water leakage near the sink.",
        propertyId: "cecba28f-fc8d-45e7-b46b-5400c58b088f",
        caseId: "e6c5a26d-3b55-4ea3-a342-20417806feb4",
      },
    ]);

    await Payment.bulkCreate([
      {
        paymentId: uuidv4(),
        caseId: "e6c5a26d-3b55-4ea3-a342-20417806feb4",
        paymentAmount: "150.00",
        paymentDate: new Date(),
        paymentStatus: "pending",
        paymentDescription: "Inspection Fee",
      },
    ]);

    await Assessment.bulkCreate([
      {
        assessmentId: uuidv4(),
        assessmentDate: new Date(),
        inspectorId: "d232e81f-6622-4a20-817f-1ffbfbba295a",
        caseId: "e6c5a26d-3b55-4ea3-a342-20417806feb4",
        assessmentLevel: "medium",
      },
    ]);

    await Availability.bulkCreate([
      {
        availabilityId: uuidv4(),
        inspectorId: "d232e81f-6622-4a20-817f-1ffbfbba295a",
        availabilityDate: new Date(),
        availabilityTime: "09:00:00",
      },
    ]);

    await BankDetails.bulkCreate([
      {
        bankDetailsId: uuidv4(),
        accountNumber: 12345678,
        sortCode: 123456,
        bankName: "Barclays Bank",
        inspectorId: "d232e81f-6622-4a20-817f-1ffbfbba295a",
      },
    ]);

    await InspectorPayment.bulkCreate([
      {
        paymentId: uuidv4(),
        paymentDate: new Date(),
        paymentAmount: "500.00",
        inspectorId: "d232e81f-6622-4a20-817f-1ffbfbba295a",
      },
    ]);

    await TrackingTime.bulkCreate([
      {
        trackingId: uuidv4(),
        trackingTimeStart: "10:00:00",
        trackingTimeEnd: "18:00:00",
        inspectorId: "d232e81f-6622-4a20-817f-1ffbfbba295a",
      },
    ]);

    console.log("✅ Seeding complete!");
  } catch (err) {
    console.error("❌ Error seeding database:", err);
  } finally {
    await sequelize.close();
  }
};

seedDatabase();
