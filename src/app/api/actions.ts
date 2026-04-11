"use server";

import { supabase } from "@/lib/supabase";

export async function submitAPIRequest(formData: FormData) {
    const fullName = formData.get("full_name") as string;
    const email = formData.get("email") as string;
    const company = formData.get("company") as string;
    const useCase = formData.get("use_case") as string;

    if (!fullName || !email) {
        return { error: "Name and Email are required." };
    }

    try {
        const { error } = await supabase
            .from("api_access_requests")
            .insert([
                { 
                    full_name: fullName, 
                    email: email, 
                    company: company, 
                    use_case: useCase,
                    status: 'pending'
                }
            ]);

        if (error) {
            console.error("Supabase error:", error);
            return { error: "Failed to submit request. Please try again." };
        }

        return { success: true };
    } catch (err) {
        console.error("Submission error:", err);
        return { error: "An unexpected error occurred." };
    }
}
