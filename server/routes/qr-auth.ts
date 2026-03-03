import { Router, Request, Response } from "express";
import QRCode from "qrcode";

export function setupQRAuthRoutes(app: Router) {
  /**
   * Generate QR code containing session token for mobile login
   * GET /api/auth/generate-qr?token=xxx
   */
  app.get("/api/auth/generate-qr", async (req: Request, res: Response) => {
    try {
      const token = req.query.token as string;

      if (!token) {
        res.status(400).json({ error: "Token is required" });
        return;
      }

      // Generate QR code as data URL
      const qrCodeDataUrl = await QRCode.toDataURL(token, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });

      res.json({ qrCode: qrCodeDataUrl });
    } catch (error) {
      console.error("[QR Auth] Failed to generate QR code:", error);
      res.status(500).json({ error: "Failed to generate QR code" });
    }
  });
}
