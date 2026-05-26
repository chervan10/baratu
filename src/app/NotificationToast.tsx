"use client";

import { useEffect } from "react";
import toast from "react-hot-toast";

export default function NotificationToast({ success }: { success?: string }) {
  useEffect(() => {
    if (!success || success === "profile_created") return;
    toast.success(success);
  }, [success]);

  return null;
}