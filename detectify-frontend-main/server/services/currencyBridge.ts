import { randomUUID } from "node:crypto";
import { existsSync, promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import type { CurrencyDetectionResponse, ObjectDetectionResponse } from "@shared/api";

const DEFAULT_MODEL_DIR = path.resolve(import.meta.dirname, "../../models");

function assertPathExists(filePath: string, description: string) {
  if (!existsSync(filePath)) {
    throw new Error(`${description} not found: ${filePath}`);
  }
}

function getModelDirectory() {
  return process.env.DETECTIFY_MODEL_DIR ?? DEFAULT_MODEL_DIR;
}

function getPythonExecutable() {
  if (process.env.DETECTIFY_MODEL_PYTHON) {
    return process.env.DETECTIFY_MODEL_PYTHON;
  }

  return process.env.PYTHON ?? "python";
}

function getBridgeScriptPath() {
  return path.resolve(import.meta.dirname, "../../python/currency_bridge.py");
}

function getExtensionFromMimeType(mimeType: string) {
  switch (mimeType) {
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/bmp":
      return ".bmp";
    case "image/gif":
      return ".gif";
    default:
      return ".jpg";
  }
}

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);

  if (!match) {
    throw new Error("The uploaded image format is not supported.");
  }

  const [, mimeType, encoded] = match;
  return {
    mimeType,
    buffer: Buffer.from(encoded, "base64"),
  };
}

function runBridge(imagePath: string, modelPath: string, isCurrency: boolean) {
  assertPathExists(getPythonExecutable(), "Python executable");
  assertPathExists(getBridgeScriptPath(), "Python bridge script");
  assertPathExists(modelPath, "YOLO model file");

  return new Promise<CurrencyDetectionResponse | ObjectDetectionResponse>((resolve, reject) => {
    const args = [
      getBridgeScriptPath(),
      "--image",
      imagePath,
      "--model-path",
      modelPath,
    ];
    if (isCurrency) {
      args.push("--currency");
    }
    execFile(
      getPythonExecutable(),
      args,
      {
        timeout: 30_000,
        windowsHide: true,
      },
      (error, stdout, stderr) => {
        if (error) {
          const detail = stderr?.trim() || stdout?.trim() || error.message;
          reject(new Error(detail));
          return;
        }

        try {
          const cleaned = stdout
            .trim()
            .split(/\r?\n/)
            .filter((line) => line.trim().length > 0)
            .pop();
          if (!cleaned) {
            throw new Error("The Python bridge returned no output.");
          }
          resolve(JSON.parse(cleaned) as CurrencyDetectionResponse | ObjectDetectionResponse);
        } catch (parseError) {
          const detail = stderr?.trim() || stdout?.trim() || String(parseError);
          reject(
            new Error(
              detail || "The Python bridge returned invalid JSON.",
            ),
          );
        }
      },
    );
  });
}

export async function detectCurrencyFromDataUrl(dataUrl: string) {
  const { mimeType, buffer } = parseDataUrl(dataUrl);
  const tempFilePath = path.join(
    os.tmpdir(),
    `detectify-currency-${randomUUID()}${getExtensionFromMimeType(mimeType)}`,
  );

  await fs.writeFile(tempFilePath, buffer);

  try {
    const modelPath = path.join(getModelDirectory(), "best.pt");
    assertPathExists(modelPath, "Currency model");
    const result = await runBridge(tempFilePath, modelPath, true);
    return result as CurrencyDetectionResponse;
  } finally {
    await fs.rm(tempFilePath, { force: true });
  }
}

export async function detectObjectsFromDataUrl(dataUrl: string) {
  const { mimeType, buffer } = parseDataUrl(dataUrl);
  const tempFilePath = path.join(
    os.tmpdir(),
    `detectify-objects-${randomUUID()}${getExtensionFromMimeType(mimeType)}`,
  );

  await fs.writeFile(tempFilePath, buffer);

  try {
    const modelPath = path.join(getModelDirectory(), "yolov5s.pt");
    assertPathExists(modelPath, "Object detection model");
    const result = await runBridge(tempFilePath, modelPath, false);
    return result as ObjectDetectionResponse;
  } finally {
    await fs.rm(tempFilePath, { force: true });
  }
}
