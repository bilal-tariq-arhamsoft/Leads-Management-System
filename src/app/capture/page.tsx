import LeadCaptureForm from "@/components/LeadCaptureForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Submit a lead | Lead Manager",
  description: "Public lead capture form",
};

export default function CapturePage() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-lg flex-1 flex-col justify-center px-4 py-12 sm:px-6">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold text-neutral-900">Lead form</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Share your details and we will get back to you.
        </p>
      </div>
      <LeadCaptureForm />
    </main>
  );
}
