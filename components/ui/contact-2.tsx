import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Contact2Props {
  title?: string;
  description?: string;
  email?: string;
}

export const Contact2 = ({
  title = "Get in Touch",
  description = "Have questions about professor outreach or internships? We're here to help you land your next position.",
  email = "ansh.rao.152@gmail.com",
}: Contact2Props) => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const firstName = formData.get("firstname");
    const lastName = formData.get("lastname");
    const userEmail = formData.get("email");
    const subject = formData.get("subject");
    const message = formData.get("message");

    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject as string || "Contact Form Submission")}&body=${encodeURIComponent(
      `Name: ${firstName} ${lastName}\nEmail: ${userEmail}\n\nMessage:\n${message}`
    )}`;

    window.location.href = mailtoUrl;
    setLoading(false);
  };

  return (
    <section id="contact" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-xl mx-auto flex flex-col items-center gap-8">
          <div className="text-center">
            <h2 className="mb-2 text-4xl font-bold tracking-tight text-[#304674]">
              {title}
            </h2>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">{description}</p>
          </div>

          <form 
            onSubmit={handleSubmit}
            className="w-full flex flex-col gap-4 rounded-xl border border-[#e2e8f0] p-8 bg-[#f8f9fb] shadow-sm"
          >
            <div className="flex gap-4">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="firstname" className="text-xs font-bold text-[#304674]">First Name</Label>
                <Input type="text" id="firstname" name="firstname" placeholder="First Name" required className="bg-white h-9 text-sm" />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="lastname" className="text-xs font-bold text-[#304674]">Last Name</Label>
                <Input type="text" id="lastname" name="lastname" placeholder="Last Name" required className="bg-white h-9 text-sm" />
              </div>
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="email" className="text-xs font-bold text-[#304674]">Email</Label>
              <Input type="email" id="email" name="email" placeholder="Email" required className="bg-white h-9 text-sm" />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="subject" className="text-xs font-bold text-[#304674]">Subject</Label>
              <Input type="text" id="subject" name="subject" placeholder="Subject" required className="bg-white h-9 text-sm" />
            </div>
            <div className="grid w-full gap-1.5">
              <Label htmlFor="message" className="text-xs font-bold text-[#304674]">Message</Label>
              <Textarea placeholder="Type your message here." id="message" name="message" required className="bg-white min-h-[100px] text-sm" />
            </div>
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#304674] hover:bg-[#1a2e52] text-white font-bold h-10 transition-all active:scale-95"
            >
              {loading ? "Opening Mail..." : "Send Message"}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
};
