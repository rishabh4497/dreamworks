import { initializeApp, getApps } from "firebase-admin/app";

if (getApps().length === 0) initializeApp();

export { geminiProxy } from "./gemini-proxy.js";
export {
  claimAdminIfAllowlisted,
  submitAppForReview,
  reviewAppSubmission,
  publishApprovedApp,
  setUserRole,
  reviewPublisherProfile,
  reviewStudioProfile,
  deleteAppAdmin,
} from "./admin/index.js";
