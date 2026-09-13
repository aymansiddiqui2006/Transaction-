import app from "./App.js";
import connectDB from "./src/database/connect.js";

connectDB().then(
  app.listen(3000, () => {
    console.log(`server is running in port 3000`);
  }),
);
