import { Badge } from "@/components/ui/badge";
import type { SubmissionStatus } from "@/lib/types";

const LABEL: Record<SubmissionStatus, string> = {
  pending: "Pending",
  in_review: "In review",
  changes_requested: "Changes requested",
  approved: "Approved",
  rejected: "Rejected",
};

function variantFor(status: SubmissionStatus): "default" | "free" | "soon" | "warn" | "new" {
  switch (status) {
    case "approved":
      return "free";
    case "pending":
    case "in_review":
      return "soon";
    case "rejected":
      return "warn";
    case "changes_requested":
      return "new";
  }
}

export function SubmissionStatusBadge({ status }: { status: SubmissionStatus }) {
  return <Badge variant={variantFor(status)}>{LABEL[status]}</Badge>;
}
