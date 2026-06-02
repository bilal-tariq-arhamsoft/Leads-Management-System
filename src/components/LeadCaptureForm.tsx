"use client";

import { LeadSource, LeadStatus } from "@prisma/client";
import { useCallback, useState } from "react";
import { formatEnumLabel } from "@/lib/lead-filters";

const SOURCE_OPTIONS = Object.values(LeadSource);
const STATUS_OPTIONS = Object.values(LeadStatus);

const inputClassName =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500";

const selectClassName =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500";

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  source: LeadSource | "";
  status: LeadStatus;
  message: string;
};

const initialForm: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  company: "",
  position: "",
  source: "",
  status: LeadStatus.NEW,
  message: "",
};

type FieldErrors = Partial<Record<keyof FormState | "form", string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateStep1(form: FormState): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.firstName.trim()) errors.firstName = "First name is required";
  if (!form.email.trim()) {
    errors.email = "Email is required";
  } else if (!EMAIL_RE.test(form.email.trim())) {
    errors.email = "Enter a valid email address";
  }
  return errors;
}

function validateStep2(form: FormState): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.source) errors.source = "Drag a source into the box or click one to select";
  return errors;
}

export default function LeadCaptureForm() {
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const update = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => {
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
    },
    [],
  );

  const selectSource = useCallback((source: LeadSource) => {
    setForm((prev) => ({ ...prev, source }));
    setErrors((prev) => {
      if (!prev.source) return prev;
      const next = { ...prev };
      delete next.source;
      return next;
    });
  }, []);

  const goNext = () => {
    const stepErrors = validateStep1(form);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    setStep(2);
  };

  const goBack = () => {
    setErrors({});
    setStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const step1Errors = validateStep1(form);
    const step2Errors = validateStep2(form);
    const allErrors = { ...step1Errors, ...step2Errors };
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      if (Object.keys(step1Errors).length > 0) setStep(1);
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      const res = await fetch("/api/lead-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim() || undefined,
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          company: form.company.trim() || undefined,
          position: form.position.trim() || undefined,
          source: form.source,
          status: form.status,
          message: form.message.trim() || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (data.errors && typeof data.errors === "object") {
          setErrors(data.errors as FieldErrors);
          if (data.errors.firstName || data.errors.email) setStep(1);
        } else {
          setErrors({
            form:
              typeof data.error === "string"
                ? data.error
                : "Something went wrong. Please try again.",
          });
        }
        return;
      }

      setSubmitted(true);
      setForm(initialForm);
      setStep(1);
    } catch {
      setErrors({ form: "Network error. Please check your connection and try again." });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center shadow-sm">
        <h2 className="text-xl font-semibold text-neutral-900">Thank you</h2>
        <p className="mt-2 text-sm text-neutral-600">
          Your information has been submitted successfully.
        </p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="mt-6 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2"
        >
          Submit another lead
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-neutral-600">
          Step {step} of 2
        </p>
        <div className="flex gap-2">
          <span
            className={`h-2 w-10 rounded-full ${step >= 1 ? "bg-neutral-900" : "bg-neutral-200"}`}
            aria-hidden
          />
          <span
            className={`h-2 w-10 rounded-full ${step >= 2 ? "bg-neutral-900" : "bg-neutral-200"}`}
            aria-hidden
          />
        </div>
      </div>

      {errors.form && (
        <p className="text-sm text-red-600" role="alert">
          {errors.form}
        </p>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-neutral-900">
            Contact information
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="firstName" className="mb-1 block text-sm font-medium text-neutral-700">
                First name <span className="text-red-600">*</span>
              </label>
              <input
                id="firstName"
                type="text"
                value={form.firstName}
                onChange={(e) => update("firstName", e.target.value)}
                className={inputClassName}
                autoComplete="given-name"
              />
              {errors.firstName && (
                <p className="mt-1 text-xs text-red-600">{errors.firstName}</p>
              )}
            </div>

            <div>
              <label htmlFor="lastName" className="mb-1 block text-sm font-medium text-neutral-700">
                Last name
              </label>
              <input
                id="lastName"
                type="text"
                value={form.lastName}
                onChange={(e) => update("lastName", e.target.value)}
                className={inputClassName}
                autoComplete="family-name"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-neutral-700">
              Email <span className="text-red-600">*</span>
            </label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className={inputClassName}
              autoComplete="email"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="mb-1 block text-sm font-medium text-neutral-700">
              Contact number
            </label>
            <input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              className={inputClassName}
              autoComplete="tel"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={goNext}
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-neutral-900">
            Company &amp; lead details
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="company" className="mb-1 block text-sm font-medium text-neutral-700">
                Company
              </label>
              <input
                id="company"
                type="text"
                value={form.company}
                onChange={(e) => update("company", e.target.value)}
                className={inputClassName}
                autoComplete="organization"
              />
            </div>

            <div>
              <label htmlFor="position" className="mb-1 block text-sm font-medium text-neutral-700">
                Position
              </label>
              <input
                id="position"
                type="text"
                value={form.position}
                onChange={(e) => update("position", e.target.value)}
                className={inputClassName}
                autoComplete="organization-title"
              />
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-neutral-700">
              Source <span className="text-red-600">*</span>
            </p>
            <p className="mb-3 text-xs text-neutral-500">
              Drag an option into the box below, or click to select.
            </p>

            <div className="mb-3 flex flex-wrap gap-2">
              {SOURCE_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/lead-source", option);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onClick={() => selectSource(option)}
                  className={`cursor-grab rounded-md border px-3 py-2 text-sm font-medium transition-colors active:cursor-grabbing ${
                    form.source === option
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-300 bg-white text-neutral-800 hover:border-neutral-500"
                  }`}
                >
                  {formatEnumLabel(option)}
                </button>
              ))}
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const dropped = e.dataTransfer.getData("text/lead-source") as LeadSource;
                if (SOURCE_OPTIONS.includes(dropped)) selectSource(dropped);
              }}
              className={`flex min-h-[72px] items-center justify-center rounded-md border-2 border-dashed px-4 py-4 text-sm transition-colors ${
                dragOver
                  ? "border-neutral-900 bg-neutral-50"
                  : form.source
                    ? "border-neutral-400 bg-neutral-50"
                    : "border-neutral-300 bg-white text-neutral-500"
              }`}
              aria-label="Drop zone for lead source"
            >
              {form.source ? (
                <span className="font-medium text-neutral-900">
                  Selected: {formatEnumLabel(form.source)}
                </span>
              ) : (
                "Drop source here"
              )}
            </div>
            {errors.source && (
              <p className="mt-1 text-xs text-red-600">{errors.source}</p>
            )}
          </div>

          <div>
            <label htmlFor="status" className="mb-1 block text-sm font-medium text-neutral-700">
              Status
            </label>
            <select
              id="status"
              value={form.status}
              onChange={(e) => update("status", e.target.value as LeadStatus)}
              className={selectClassName}
            >
              {STATUS_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {formatEnumLabel(value)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="message" className="mb-1 block text-sm font-medium text-neutral-700">
              Message
            </label>
            <textarea
              id="message"
              rows={4}
              value={form.message}
              onChange={(e) => update("message", e.target.value)}
              className={inputClassName}
              placeholder="Tell us more about your inquiry…"
            />
          </div>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={goBack}
              disabled={submitting}
              className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 disabled:opacity-50"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {submitting ? "Submitting…" : "Submit"}
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
