import { initializeApp, getApps } from "firebase-admin/app";

if (getApps().length === 0) initializeApp();

export { geminiProxy } from "./gemini-proxy.js";
export {
  claimAdminIfAllowlisted,
  listAdminCandidates,
  submitAppForReview,
  reviewAppSubmission,
  publishApprovedApp,
  setUserRole,
  reviewPublisherProfile,
  reviewStudioProfile,
  deleteAppAdmin,
  // Access control redo
  claimOwnerIfEligible,
  setUserPermissions,
  migrateAdminsToPermissions,
  refreshUserClaims,
  lookupUserByEmail,
  submitCreatorApplication,
  approveCreatorApplication,
  rejectCreatorApplication,
  inviteCreator,
  claimCreatorInvite,
  inviteAdmin,
  claimAdminInvite,
} from "./admin/index.js";
export { scanBuild, sdkHandshake } from "./sdk/index.js";
