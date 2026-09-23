import db from "../config/db.js";
import fs from "fs";
import path from "path";

/*
====================================================
UPLOAD COMMON COMPANY DOCUMENT
====================================================
*/

export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Please select a document",
      });
    }

    const { documentName, documentType } = req.body;

    if (!documentName || !documentName.trim()) {
      return res.status(400).json({
        message: "Document name is required",
      });
    }

    const uploadedBy =
      req.user?.email ||
      req.user?.username ||
      req.user?.name ||
      "Admin";

    const filePath = `/uploads/documents/${req.file.filename}`;

    const sql = `
      INSERT INTO documents
      (
        document_name,
        document_type,
        original_file_name,
        file_path,
        uploaded_by
      )
      VALUES (?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(sql, [
      documentName.trim(),
      documentType || null,
      req.file.originalname,
      filePath,
      uploadedBy,
    ]);

    res.status(201).json({
      message: "Document uploaded successfully",
      document: {
        id: result.insertId,
        documentName: documentName.trim(),
        documentType: documentType || null,
        originalFileName: req.file.originalname,
        filePath,
        uploadedBy,
      },
    });
  } catch (error) {
    console.error("Upload document error:", error);

    res.status(500).json({
      message: "Failed to upload document",
      error: error.message,
    });
  }
};

/*
====================================================
GET ALL COMMON DOCUMENTS
====================================================
*/

export const getDocuments = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        id,
        document_name AS documentName,
        document_type AS documentType,
        original_file_name AS originalFileName,
        file_path AS filePath,
        uploaded_by AS uploadedBy,
        created_at AS createdAt
      FROM documents
      ORDER BY created_at DESC
    `);

    res.status(200).json(rows);
  } catch (error) {
    console.error("Get documents error:", error);

    res.status(500).json({
      message: "Failed to fetch documents",
      error: error.message,
    });
  }
};

/*
====================================================
VIEW / DOWNLOAD DOCUMENT (NEW FIX)
====================================================
*/

export const viewDocument = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: "Document ID is required",
      });
    }

    const [rows] = await db.query(
      `
      SELECT
        id,
        original_file_name,
        file_path
      FROM documents
      WHERE id = ?
      `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    const document = rows[0];

    // Convert "/uploads/documents/file.pdf"
    // to "uploads/documents/file.pdf"
    const cleanPath = document.file_path.replace(/^[/\\]+/, "");

    const absolutePath = path.join(process.cwd(), cleanPath);

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({
        message: "Document file not found on server",
      });
    }

    const extension = path
      .extname(document.original_file_name)
      .toLowerCase();

    const mimeTypes = {
      ".pdf": "application/pdf",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".doc": "application/msword",
      ".docx":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".xls": "application/vnd.ms-excel",
      ".xlsx":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };

    const contentType =
      mimeTypes[extension] || "application/octet-stream";

    res.setHeader("Content-Type", contentType);

    // Display in browser (PDF/Image) instead of downloading automatically
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(
        document.original_file_name
      )}"`
    );

    res.sendFile(absolutePath, (err) => {
      if (err) {
        console.error("Send file error:", err);

        if (!res.headersSent) {
          res.status(500).json({
            message: "Failed to open document",
          });
        }
      }
    });
  } catch (error) {
    console.error("View document error:", error);

    res.status(500).json({
      message: "Failed to open document",
      error: error.message,
    });
  }
};

/*
====================================================
DELETE DOCUMENT
====================================================
*/

export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: "Document ID is required",
      });
    }

    const [rows] = await db.query(
      `
      SELECT file_path
      FROM documents
      WHERE id = ?
      `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    const relativePath = rows[0].file_path;

    const cleanPath = relativePath.replace(/^[/\\]+/, "");

    const absolutePath = path.join(process.cwd(), cleanPath);

    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }

    await db.query(
      "DELETE FROM documents WHERE id = ?",
      [id]
    );

    res.status(200).json({
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("Delete document error:", error);

    res.status(500).json({
      message: "Failed to delete document",
      error: error.message,
    });
  }
};