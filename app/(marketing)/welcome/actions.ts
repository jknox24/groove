"use server";

import { createClient } from "@/lib/supabase/server";
import { sendWelcomeEmail } from "@/lib/email/resend";

export async function joinWaitlist(formData: FormData) {
  const email = formData.get("email") as string;

  if (!email || !email.includes("@")) {
    return { error: "Please enter a valid email" };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("waitlist").insert({ email });

  if (error) {
    if (error.code === "23505") {
      // Unique constraint violation
      return { error: "You're already on the waitlist!" };
    }
    return { error: "Something went wrong. Please try again." };
  }

  // Send welcome email (don't block on failure)
  try {
    await sendWelcomeEmail(email);
  } catch (e) {
    console.error("Failed to send welcome email:", e);
  }

  return { success: true };
}
