import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { firstName, lastName, email, subject, message } = await req.json();

    if (!firstName || !email || !message) {
      return NextResponse.json(
        { error: "Please fill in all required fields." },
        { status: 400 }
      );
    }

    const { data, error } = await resend.emails.send({
      from: "InternLink Contact <onboarding@resend.dev>",
      to: "ansh.rao.152@gmail.com",
      replyTo: email,
      subject: `[Contact Form] ${subject || "No Subject"}`,
      text: `Name: ${firstName} ${lastName}\nEmail: ${email}\n\nMessage:\n${message}`,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("Contact API error:", err);
    return NextResponse.json(
      { error: "Failed to send message. Please try again later." },
      { status: 500 }
    );
  }
}
