import "dotenv/config";
import startServer from "./web/app";

(async () => {
  try {
    startServer();
  } catch (error) {
    console.error("An error occured while running server:", error);
  }
})();