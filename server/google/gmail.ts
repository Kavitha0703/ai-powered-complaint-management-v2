// Server Google Gmail Helper

export async function sendGmailMessage(options: {
  to: string | string[];
  subject: string;
  bodyHtml: string;
  fromName?: string;
}) {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    return {
      success: false,
      delivered: false,
      reason: "NO_API_KEY",
      error: "No RESEND_API_KEY environment variable set on server.",
    };
  }

  try {
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${options.fromName || "Workplace Hub"} <onboarding@resend.dev>`,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.bodyHtml,
      }),
    });

    if (resendResponse.ok) {
      const data = await resendResponse.json();
      return {
        success: true,
        delivered: true,
        id: data.id,
        provider: "Resend",
        message: "Email accepted by Resend provider.",
      };
    } else {
      let parsedError: string;
      try {
        const errJson = await resendResponse.json();
        parsedError = errJson.message || errJson.error || JSON.stringify(errJson);
      } catch {
        parsedError = await resendResponse.text();
      }
      return {
        success: false,
        delivered: false,
        statusCode: resendResponse.status,
        error: `Email Provider Error (${resendResponse.status}): ${parsedError}`,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      delivered: false,
      error: `Internal Email Server Error: ${err.message || String(err)}`,
    };
  }
}
