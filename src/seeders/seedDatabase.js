const { sequelize } = require("../models");
const bcrypt = require("bcryptjs");

const {
  User,
  Case,
  CaseTimeline,
  Damage,
  DamagePhoto,
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
        userId: uuidv4(),
        userFirstName: "John",
        userLastName: "Doe",
        userEmail: "mail@mail.com",
        userGender: "male",
        userPhone: "+441234567890",
        userCity: "London",
        userAddress: "123 Main Street",
        userPostcode: "S12 2IS",
        userCountry: "UK",
        userType: "admin",
        isVerified: true,
        userPassword: await bcrypt.hash("securepassword", 10),
      },
      {
        userId: "a4d32525-e0a7-4c95-82e3-990c38c338fd",
        userFirstName: "Jonathan",
        userLastName: "Doeman",
        userEmail: "johndoe@mail.com",
        userGender: "male",
        userPhone: "+441234567890",
        userCity: "London",
        userAddress: "123 Main Street",
        userPostcode: "S12 2IS",
        userCountry: "UK",
        userType: "tenant",
        isVerified: true,
        userPassword: await bcrypt.hash("password123", 10),
      },
      {
        userId: uuidv4(),
        userFirstName: "Jane",
        userLastName: "Smith",
        userEmail: "janesmith@mail.com",
        userGender: "female",
        userPhone: "+441234567899",
        userCity: "Birmingham",
        userAddress: "456 High Street",
        userPostcode: "B10 5TW",
        userCountry: "UK",
        userType: "landlord",
        isVerified: true,
        userPassword: await bcrypt.hash("password123", 10),
      },
      {
        userId: "d232e81f-6622-4a20-817f-1ffbfbba295a",
        userFirstName: "Jude",
        userLastName: "Scott",
        userEmail: "judescott@mail.com",
        userGender: "male",
        userPhone: "+441234567898",
        userCity: "Manchester",
        userPostcode: "M2 2JW",
        userAddress: "6 Newgate Road",
        userCountry: "UK",
        userType: "inspector",
        userPassword: await bcrypt.hash("password123", 10),
        userStatus: "active",
        isVerified: true,
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
        propertyId: "8d55184c-2039-4d58-9f6f-3b2452589aab",
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
        propertyId: "8d55184c-2039-4d58-9f6f-3b2452589aab",
        inspectorId: "d232e81f-6622-4a20-817f-1ffbfbba295a",
        caseStatus: "open",
        CaseUrgencyLevel: "high",
        caseDescription: "Water leakage in the bathroom.",
      },
    ]);

    await CaseTimeline.bulkCreate([
      {
        timelineId: uuidv4(),
        caseId: "e6c5a26d-3b55-4ea3-a342-20417806feb4",
        eventType: "caseCreated",
        eventDescription: "Case created",
      },
      {
        timelineId: uuidv4(),
        caseId: "e6c5a26d-3b55-4ea3-a342-20417806feb4",
        eventType: "inspectorAssigned",
        eventDescription: "Inspector assigned",
      },
      {
        timelineId: uuidv4(),
        caseId: "e6c5a26d-3b55-4ea3-a342-20417806feb4",
        eventType: "inspectorAccepted",
        eventDescription: "Inspector accepted",
      },
    ]);

    const damage1Id = uuidv4();

    await Damage.bulkCreate([
      {
        damageId: damage1Id,
        damageLocation: "Bathroom",
        damageType: "Water Leak",
        damageDescription: "Severe water leakage near the sink.",
        propertyId: "cecba28f-fc8d-45e7-b46b-5400c58b088f",
        caseId: "e6c5a26d-3b55-4ea3-a342-20417806feb4",
        damageDate: new Date(),
      },
    ]);

    await DamagePhoto.bulkCreate([
      {
        photoId: uuidv4(),
        damageId: damage1Id,
        photoType: "Overview",
        photoUrl: "https://example.com/bathroom_overview.jpg",
      },
      {
        photoId: uuidv4(),
        damageId: damage1Id,
        photoType: "Close-up",
        photoUrl: "https://example.com/bathroom_closeup.jpg",
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
        userId: "d232e81f-6622-4a20-817f-1ffbfbba295a",
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
