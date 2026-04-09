import type { RequestHandler } from "express";
import { detectCurrencyFromDataUrl, detectObjectsFromDataUrl } from "../services/currencyBridge";

export const handleCurrencyDetection: RequestHandler = async (req, res) => {
  try {
    const imageData = req.body?.imageData;

    if (typeof imageData !== "string" || !imageData.startsWith("data:image/")) {
      return res.status(400).json({
        error: "Send a valid image as a data URL in the imageData field.",
      });
    }

    const result = await detectCurrencyFromDataUrl(imageData);
    return res.status(200).json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Currency detection failed.";

    return res.status(500).json({ error: message });
  }
};

export const handleObjectDetection: RequestHandler = async (req, res) => {
  try {
    const imageData = req.body?.imageData;

    if (typeof imageData !== "string" || !imageData.startsWith("data:image/")) {
      return res.status(400).json({
        error: "Send a valid image as a data URL in the imageData field.",
      });
    }

    const result = await detectObjectsFromDataUrl(imageData);
    return res.status(200).json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Object detection failed.";

    return res.status(500).json({ error: message });
  }
};
