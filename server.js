const appSetup = require("./src/app");

const dotenv = require("dotenv");
dotenv.config();

const PORT = process.env.PORT || 3000;

appSetup.app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
