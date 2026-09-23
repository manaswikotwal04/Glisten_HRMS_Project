import express from "express";

import {
  uploadDocument,
  getDocuments,
  viewDocument,
  deleteDocument,
} from "../controllers/document.controller.js";

import {
  auth,
  adminAuth,
} from "../middleware/auth.middleware.js";

import {
  documentUpload,
} from "../middleware/document.middleware.js";

const router = express.Router();

/*
====================================================
ADMIN - GET ALL COMMON DOCUMENTS
====================================================
*/
router.get(
  "/admin",
  adminAuth,
  getDocuments
);

/*
====================================================
ADMIN - UPLOAD COMMON DOCUMENT
====================================================
*/
router.post(
  "/upload",
  adminAuth,
  documentUpload.single("document"),
  uploadDocument
);

/*
====================================================
EMPLOYEE + ADMIN - VIEW / DOWNLOAD DOCUMENT
====================================================
IMPORTANT:
Use `auth` here, NOT `adminAuth`.

Employees need permission to access:
GET /api/documents/view/:id
====================================================
*/
router.get(
  "/view/:id",
  auth,
  viewDocument
);

/*
====================================================
EMPLOYEE - GET COMMON DOCUMENTS
====================================================
*/
router.get(
  "/",
  auth,
  getDocuments
);

/*
====================================================
ADMIN - DELETE DOCUMENT
====================================================
*/
router.delete(
  "/:id",
  adminAuth,
  deleteDocument
);

export default router;