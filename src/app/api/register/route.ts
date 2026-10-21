import { Resend } from "resend";
import { NextResponse } from "next/server";
import { buildRegisterEmailHtml, buildRegisterEmailText } from "@/lib/register-email";
import { getEmailRequestMeta, isValidEmail } from "@/lib/email-utils";
import { getContactEmailConfig } from "@/lib/market";
import { TRAINING_TRACKS } from "@/lib/stackforgenext/register-content";

type RegisterBody = {
  fullName?: string;
  email?: string;
  phone?: string;
  address?: string;
  country?: string;
  availability?: string;
  sex?: string;
  tracks?: string[];
  isStudent?: string;
  institution?: string;
  course?: string;
  level?: string;
  motivation?: string;
  joinCommunity?: boolean;
};

export async function POST(request: Request) {
  let body: RegisterBody;

  try {
    body = (await request.json()) as RegisterBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const fullName = body.fullName?.trim() ?? "";
  const email = body.email?.trim() ?? "";
  const phone = body.phone?.trim() ?? "";
  const address = body.address?.trim() ?? "";
  const country = body.country?.trim() ?? "";
  const availability = body.availability?.trim() ?? "";
  const sex = body.sex?.trim() ?? "";
  const allowedTracks = new Set<string>(TRAINING_TRACKS);
  const tracks = Array.isArray(body.tracks)
    ? [...new Set(body.tracks.map((item) => item.trim()).filter((item) => allowedTracks.has(item)))]
    : [];
  const isStudent = body.isStudent?.trim() ?? "";
  const institution = body.institution?.trim() ?? "";
  const course = body.course?.trim() ?? "";
  const level = body.level?.trim() ?? "";
  const motivation = body.motivation?.trim() ?? "";
  const joinCommunity = Boolean(body.joinCommunity);

  if (!fullName || !email || !phone || !address || !availability || !sex || tracks.length === 0 || !isStudent || !motivation) {
    return NextResponse.json({ error: "All required fields must be filled in." }, { status: 400 });
  }

  const studentYes = /^(yes|yego|oui)$/i.test(isStudent);
  if (studentYes && (!institution || !course || !level)) {
    return NextResponse.json(
      { error: "Please provide institution, course, and level if you are a student." },
      { status: 400 },
    );
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
  }

  const { market, siteHost, submittedAt, ip, userAgent, visitorCountry } =
    getEmailRequestMeta(request);
  const { apiKey, from, to } = getContactEmailConfig(market);

  if (!apiKey) {
    return NextResponse.json(
      { error: "Email service is not configured. Please try again later." },
      { status: 500 },
    );
  }

  if (!to) {
    return NextResponse.json(
      { error: "Email service is not configured. Please try again later." },
      { status: 500 },
    );
  }

  const emailPayload = {
    fullName,
    email,
    phone,
    address,
    country: country || undefined,
    availability,
    sex,
    tracks,
    isStudent,
    institution: studentYes ? institution : undefined,
    course: studentYes ? course : undefined,
    level: studentYes ? level : undefined,
    motivation,
    joinCommunity,
    market,
    siteHost,
    submittedAt,
    ip,
    userAgent,
    visitorCountry,
  };

  const resend = new Resend(apiKey);

  try {
    const { error } = await resend.emails.send({
      from,
      to: [to],
      replyTo: email,
      subject: `StackForgeNext — Cohort registration · ${fullName} · ${tracks.join(", ")}`,
      html: buildRegisterEmailHtml(emailPayload),
      text: buildRegisterEmailText(emailPayload),
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: "Failed to send message. Please try again." },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Register API error:", err);
    return NextResponse.json(
      { error: "Failed to send message. Please try again." },
      { status: 502 },
    );
  }
}
