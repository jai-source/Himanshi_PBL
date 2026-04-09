/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

export interface CurrencyDetectionResponse {
  note: string;
  confidence: number;
  status: string;
  matchedTemplate: string | null;
  goodMatches: number;
  detections?: Detection[];
}

export interface Detection {
  label: string;
  confidence: number;
  box: [number, number, number, number]; // [x1, y1, x2, y2]
}

export interface ObjectDetectionResponse {
  detections: Detection[];
}
