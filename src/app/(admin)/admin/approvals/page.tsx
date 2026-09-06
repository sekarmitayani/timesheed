"use client";

import { ApprovalsView } from "@/components/shared/approvals/ApprovalsView";

export default function AdminApprovalsPage() {
    return <ApprovalsView rolePrefix="admin" title="Global Approvals Inbox" />;
}
