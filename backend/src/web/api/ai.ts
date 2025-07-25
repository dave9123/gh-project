import express from "express";
import db from "../../modules/db";
import { OpenAI } from "openai";
import { productsTable } from "../../db/schema";
import { eq } from "drizzle-orm";

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.AI_API_KEY,
  baseURL: process.env.AI_API_BASE_URL,
});

router.get("/", (req, res) => {
  try {
    const { message } = req.body;
    const { businessId } = req.query;
    let categories: string[] = [];

    if (!message || !businessId) {
      return res
        .status(400)
        .json({ error: "Message and businessId are required" });
    }

    db.select()
      .from(productsTable)
      .where(eq(productsTable.business, businessId))
      .then((cts: any) => {
        categories = cts.map((category: any) => category.name);
      });

    //TODO: DEFINE ALL THE FUNCTIONS HERE

    const functions = () => {
      return [
        {
          name: "getCategoryInfo",
          description: "Get category information",
          parameters: {
            type: "object",
            properties: {
              userInput: {
                type: "string",
                description: "User input to get category information",
                enum: categories,
              },
            },
            required: ["userInput"],
          },
        },
        {
          name: "getQuote",
          description: "Get a quote",
          parameters: {
            type: "object",
            properties: {
              userInput: {
                type: "string",
                description: "User input to get a quote",
              },
            },
            required: ["userInput"],
          },
        },
      ];
    };
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});
