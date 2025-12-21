const {
  sequelize,
  NotificationSettings,
  PrivacyPolicySettings,
  UserExpertise,
  User,
  Case,
  CaseTimeline,
  Damage,
  DamagePhoto,
  Payment,
  Report,
  Availability,
  BankDetails,
  Expertise,
  InspectorPayment,
  Property,
  TrackingTime,
  AssessmentItem,
  AssessmentSummary,
  Conversation,
  Message,
} = require("../models");
const bcrypt = require("bcryptjs");
const { faker } = require("@faker-js/faker");
const { v4: uuidv4 } = require("uuid");
const { generateUniqueId } = require("../utils/uniqueIdGenerator");

const seedDatabase = async () => {
  try {
    console.log("🌱 Seeding database...");

    await sequelize.sync({ force: true });

    const userTypes = ["admin", "tenant", "landlord", "inspector"];
    const users = [
      {
        userId: generateUniqueId("ADMIN"),
        userFirstName: "John",
        userLastName: "Doe",
        userEmail: "mail@mail.com",
        userGender: "male",
        userPhone: faker.phone.number({ style: "international" }),
        userProfilePic: faker.image.avatar(),
        userCity: faker.location.city(),
        userAddress: faker.location.streetAddress(),
        userPostcode: faker.location.zipCode(),
        userCountry: faker.location.country(),
        userType: "admin",
        isVerified: true,
        userPassword: await bcrypt.hash("securepassword", 10),
      },
      {
        userId: generateUniqueId("USER"),
        userFirstName: "Jonathan",
        userLastName: "Doeman",
        userEmail: "johndoe@mail.com",
        userGender: "male",
        userPhone: faker.phone.number({ style: "international" }),
        userProfilePic: faker.image.avatar(),
        userCity: faker.location.city(),
        userAddress: faker.location.streetAddress(),
        userPostcode: faker.location.zipCode(),
        userCountry: faker.location.country(),
        userType: "tenant",
        isVerified: true,
        userPassword: await bcrypt.hash("password123", 10),
      },
      {
        userId: generateUniqueId("USER"),
        userFirstName: "Jane",
        userLastName: "Smith",
        userEmail: "janesmith@mail.com",
        userGender: "female",
        userPhone: faker.phone.number({ style: "international" }),
        userProfilePic: faker.image.avatar(),
        userCity: faker.location.city(),
        userAddress: faker.location.streetAddress(),
        userPostcode: faker.location.zipCode(),
        userCountry: faker.location.country(),
        userType: "landlord",
        isVerified: true,
        userPassword: await bcrypt.hash("password123", 10),
      },
      {
        userId: generateUniqueId("INSP"),
        userFirstName: "Jude",
        userLastName: "Scott",
        userEmail: "judescott@mail.com",
        userGender: "male",
        userPhone: faker.phone.number({ style: "international" }),
        userProfilePic: faker.image.avatar(),
        userCity: faker.location.city(),
        userAddress: faker.location.streetAddress(),
        userPostcode: faker.location.zipCode(),
        userCountry: faker.location.country(),
        userType: "inspector",
        userPassword: await bcrypt.hash("password123", 10),
        userStatus: "active",
        isVerified: true,
      },
    ];

    for (let i = 0; i < 20; i++) {
      const userType = faker.helpers.arrayElement(userTypes);
      const prefix =
        userType === "admin"
          ? "ADMIN"
          : userType === "inspector"
          ? "INSP"
          : "USER";
      users.push({
        userId: generateUniqueId(prefix),
        userFirstName: faker.person.firstName(),
        userLastName: faker.person.lastName(),
        userEmail: faker.internet.email(),
        userGender: faker.helpers.arrayElement(["male", "female", "other"]),
        userPhone: faker.phone.number({ style: "international" }),
        userProfilePic: faker.image.avatar(),
        userCity: faker.location.city(),
        userAddress: faker.location.streetAddress(),
        userPostcode: faker.location.zipCode(),
        userCountry: faker.location.country(),
        userType,
        isVerified: true,
        userPassword: await bcrypt.hash("password123", 10),
        userStatus: "active",
      });
    }
    await User.bulkCreate(users);

    const settingsPromises = users.map((user) => {
      return Promise.all([
        NotificationSettings.create({
          userId: user.userId,
          deadlineNotifications: faker.datatype.boolean(),
          newCaseAlerts: faker.datatype.boolean(),
          tenantUpdates: faker.datatype.boolean(),
          messageNotifications: faker.datatype.boolean(),
        }),
        PrivacyPolicySettings.create({
          userId: user.userId,
          essentialCookies: faker.datatype.boolean(),
          thirdPartySharing: faker.datatype.boolean(),
        }),
      ]);
    });

    await Promise.all(settingsPromises);

    const expertiseAreas = [
      "Plumbing",
      "Electrical",
      "HVAC",
      "Carpentry",
      "Painting",
      "Flooring",
      "Roofing",
      "Landscaping",
    ];

    const expertiseRecords = expertiseAreas.map((area, index) => ({
      expertiseCode: 100 + index,
      expertiseArea: area,
      expertiseDescription: `${area} expertise`,
    }));

    await Expertise.bulkCreate(expertiseRecords);

    const inspectors = users.filter((u) => u.userType === "inspector");
    for (const inspector of inspectors) {
      const count = faker.number.int({ min: 1, max: 3 });
      const selected = faker.helpers.shuffle(expertiseRecords).slice(0, count);

      const expertisePairs = selected.map((e) => ({
        userId: inspector.userId,
        expertiseCode: e.expertiseCode,
      }));
      await UserExpertise.bulkCreate(expertisePairs);
    }

    let properties = [
      {
        propertyId: "8d55184c-2039-4d58-9f6f-3b2452589aab",
        propertyType: "Apartment",
        propertyCity: faker.location.city(),
        propertyAddress: faker.location.streetAddress(),
        propertyCountry: faker.location.country(),
      },
      {
        propertyId: "cecba28f-fc8d-45e7-b46b-5400c58b088f",
        propertyType: "Apartment",
        propertyCity: faker.location.city(),
        propertyAddress: faker.location.streetAddress(),
        propertyCountry: faker.location.country(),
      },
    ];
    for (let i = 0; i < 10; i++) {
      properties.push({
        propertyId: uuidv4(),
        propertyType: "Apartment",
        propertyCity: faker.location.city(),
        propertyAddress: faker.location.streetAddress(),
        propertyCountry: faker.location.country(),
      });
    }
    await Property.bulkCreate(properties);

    const cases = [];
    const timelines = [];
    const damages = [];
    const damagePhotos = [];
    const payments = [];
    const reports = [];
    const assessmentItemsAll = [];
    const assessmentSummaries = [];

    for (let i = 0; i < 10; i++) {
      const caseId = generateUniqueId("CASE");
      const tenant = users.find((u) => u.userType === "tenant");
      const inspector = faker.helpers.arrayElement(inspectors);
      const property = faker.helpers.arrayElement(properties);

      cases.push({
        caseId,
        CaseCompletedDate: null,
        caseDeadline: faker.date.soon(),
        userId: tenant.userId,
        propertyId: property.propertyId,
        inspectorId: inspector.userId,
        caseStatus: "open",
        CaseUrgencyLevel: faker.helpers.arrayElement(["low", "medium", "high"]),
        caseDescription: faker.lorem.sentence(),
      });

      timelines.push(
        {
          timelineId: uuidv4(),
          caseId,
          eventType: "caseCreated",
          eventDescription: "Case created",
        },
        {
          timelineId: uuidv4(),
          caseId,
          eventType: "inspectorAssigned",
          eventDescription: "Inspector assigned",
        },
        {
          timelineId: uuidv4(),
          caseId,
          eventType: "inspectorAccepted",
          eventDescription: "Inspector accepted",
        }
      );

      const damageId = uuidv4();
      damages.push({
        damageId,
        damageLocation: faker.location.street(),
        damageType: faker.commerce.productMaterial(),
        damageDescription: faker.commerce.productDescription(),
        propertyId: property.propertyId,
        caseId,
        damageDate: new Date(),
      });

      damagePhotos.push(
        {
          photoId: uuidv4(),
          damageId,
          photoType: "Overview",
          photoUrl: faker.image.urlPicsumPhotos(),
        },
        {
          photoId: uuidv4(),
          damageId,
          photoType: "Close-up",
          photoUrl: faker.image.urlPicsumPhotos(),
        }
      );

      const paymentId = generateUniqueId("PAYE");
      payments.push({
        paymentId,
        caseId,
        paymentAmount: parseFloat(faker.finance.amount({ min: 100, max: 500 })),
        paymentDate: new Date(),
        paymentStatus: "pending",
        paymentDescription: "Inspection Fee",
      });

      const reportId = uuidv4();
      reports.push({
        reportId,
        reportDescription: faker.lorem.paragraph(),
        inspectorId: inspector.userId,
        caseId,
      });

      const items = [];
      for (let j = 0; j < 4; j++) {
        const quantity = faker.number.int({ min: 1, max: 5 });
        const unitPrice = parseFloat(
          faker.commerce.price({ min: 10, max: 200 })
        );
        const hours = faker.number.int({ min: 1, max: 8 });
        const hourlyRate = parseFloat(
          faker.commerce.price({ min: 15, max: 50 })
        );
        const sumMaterial = quantity * unitPrice;
        const sumWork = hours * hourlyRate;
        const sumPost = sumMaterial + sumWork;

        items.push({
          reportId,
          item: faker.commerce.productName(),
          quantity,
          unitPrice,
          hours,
          hourlyRate,
          sumMaterial,
          sumWork,
          sumPost,
        });
      }
      assessmentItemsAll.push(...items);
    }

    await Case.bulkCreate(cases);
    await CaseTimeline.bulkCreate(timelines);
    await Damage.bulkCreate(damages);
    await DamagePhoto.bulkCreate(damagePhotos);
    await Payment.bulkCreate(payments);
    await Report.bulkCreate(reports);
    await AssessmentItem.bulkCreate(assessmentItemsAll);

    const groupedItems = assessmentItemsAll.reduce((acc, item) => {
      if (!acc[item.reportId]) {
        acc[item.reportId] = [];
      }
      acc[item.reportId].push(item);
      return acc;
    }, {});

    for (const reportId in groupedItems) {
      const items = groupedItems[reportId];
      const totalHours = items.reduce((acc, item) => acc + item.hours, 0);
      const totalSumMaterials = items.reduce(
        (acc, item) => acc + item.sumMaterial,
        0
      );
      const totalSumLabor = items.reduce((acc, item) => acc + item.sumWork, 0);
      const sumExclVAT = totalSumMaterials + totalSumLabor;
      const vat = sumExclVAT * 0.25;
      const sumInclVAT = sumExclVAT + vat;
      const total = sumInclVAT;

      assessmentSummaries.push({
        reportId,
        totalHours,
        totalSumMaterials,
        totalSumLabor,
        sumExclVAT,
        vat,
        sumInclVAT,
        total,
      });
    }

    await AssessmentSummary.bulkCreate(assessmentSummaries);

    await Availability.bulkCreate([
      {
        availabilityId: uuidv4(),
        inspectorId: users.find((u) => u.userType === "inspector").userId,
        availabilityDate: new Date(),
        availabilityTime: "09:00:00",
      },
    ]);

    await BankDetails.bulkCreate([
      {
        bankDetailsId: uuidv4(),
        accountNumber: faker.finance.accountNumber(),
        sortCode: faker.finance.accountNumber(6),
        bankName: "Barclays Bank",
        userFirstName: users.find((u) => u.userType === "inspector")
          .userFirstName,
        userLastName: users.find((u) => u.userType === "inspector")
          .userLastName,
        userId: users.find((u) => u.userType === "inspector").userId,
      },
    ]);

    await InspectorPayment.bulkCreate([
      {
        paymentId: generateUniqueId("PAYE"),
        paymentDate: new Date(),
        paymentAmount: 500.00,
        inspectorId: users.find((u) => u.userType === "inspector").userId,
      },
    ]);

    await TrackingTime.bulkCreate([
      {
        trackingId: uuidv4(),
        trackingTimeStart: "10:00:00",
        trackingTimeEnd: "18:00:00",
        inspectorId: users.find((u) => u.userType === "inspector").userId,
      },
    ]);

    const conversations = [];
    const messages = [];

    for (let i = 0; i < users.length; i++) {
      for (let j = i + 1; j < users.length && j < i + 3; j++) {
        const userOne = users[i];
        const userTwo = users[j];
        const conversationId = uuidv4();

        conversations.push({
          conversationId,
          userOne: userOne.userId,
          userTwo: userTwo.userId,
          lastMessage: "Hey there!",
          lastMessageTimestamp: new Date(),
        });
        messages.push({
          messageId: uuidv4(),
          conversationId,
          senderId: userOne.userId,
          receiverId: userTwo.userId,
          messageText: "Hey there!",
          isRead: true,
          sentAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        for (let k = 0; k < faker.number.int({ min: 1, max: 4 }); k++) {
          const sender = faker.helpers.arrayElement([userOne, userTwo]);
          const receiver = sender === userOne ? userTwo : userOne;
          messages.push({
            messageId: uuidv4(),
            conversationId,
            senderId: sender.userId,
            receiverId: receiver.userId,
            messageText: faker.lorem.sentence(),
            isRead: faker.datatype.boolean(),
            sentAt: faker.date.recent(),
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }
    }

    await Conversation.bulkCreate(conversations);
    await Message.bulkCreate(messages);

    console.log("✅ Seeding complete!");
  } catch (err) {
    console.error("❌ Error seeding database:", err);
  } finally {
    await sequelize.close();
  }
};

seedDatabase();
