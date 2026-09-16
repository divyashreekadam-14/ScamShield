const VIRUSTOTAL_BASE_URL = "https://www.virustotal.com/api/v3";

function createUnavailable(message) {
  return {
    status: "unavailable",
    malicious: 0,
    suspicious: 0,
    harmless: 0,
    undetected: 0,
    message
  };
}

function createAvailable(stats) {
  return {
    status: "available",
    malicious: Number(stats?.malicious || 0),
    suspicious: Number(stats?.suspicious || 0),
    harmless: Number(stats?.harmless || 0),
    undetected: Number(stats?.undetected || 0),
    message: "VirusTotal check completed"
  };
}

function encodeUrl(url) {
  return Buffer.from(url)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function fetchJson(url, options = {}) {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 12000);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });

    let data = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    return {
      response,
      data
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function pollAnalysis(analysisId, apiKey) {
  for (let attempt = 0; attempt < 5; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const { response, data } = await fetchJson(
      `${VIRUSTOTAL_BASE_URL}/analyses/${analysisId}`,
      {
        method: "GET",
        headers: {
          "x-apikey": apiKey
        }
      }
    );

    if (!response.ok || !data?.data) {
      return null;
    }

    const status = data.data.attributes?.status;

    if (status === "completed") {
      return data.data.attributes?.stats || {};
    }
  }

  return null;
}

async function checkUrlWithVirusTotal(url) {
  const apiKey = process.env.VIRUSTOTAL_API_KEY;

  if (!apiKey) {
    return createUnavailable(
      "VirusTotal API key is not configured on the backend."
    );
  }

  try {
    const urlId = encodeUrl(url);

    // First try to retrieve an existing VirusTotal URL report.
    const reportResult = await fetchJson(
      `${VIRUSTOTAL_BASE_URL}/urls/${urlId}`,
      {
        method: "GET",
        headers: {
          "x-apikey": apiKey
        }
      }
    );

    if (reportResult.response.ok && reportResult.data?.data) {
      const stats =
        reportResult.data.data.attributes?.last_analysis_stats ||
        reportResult.data.data.attributes?.analysis_stats ||
        {};

      return createAvailable(stats);
    }

    // If there is no existing report, submit the URL for analysis.
    const body = new URLSearchParams();
    body.append("url", url);

    const submitResult = await fetchJson(
      `${VIRUSTOTAL_BASE_URL}/urls`,
      {
        method: "POST",
        headers: {
          "x-apikey": apiKey,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: body.toString()
      }
    );

    if (!submitResult.response.ok || !submitResult.data?.data?.id) {
      return createUnavailable(
        `VirusTotal request failed with status ${submitResult.response.status}.`
      );
    }

    const analysisId = submitResult.data.data.id;

    const stats = await pollAnalysis(analysisId, apiKey);

    if (!stats) {
      return createUnavailable(
        "VirusTotal analysis is still processing or unavailable."
      );
    }

    return createAvailable(stats);
  } catch (error) {
    console.error("VirusTotal error:", error.message);

    return createUnavailable(
      "VirusTotal check unavailable."
    );
  }
}

module.exports = {
  checkUrlWithVirusTotal
};