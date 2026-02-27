const { google } = require("googleapis");

exports.handler = async (event) => {
  try {
    const { name, phone } = JSON.parse(event.body);

    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT),
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: "prepaid_data!A2:F",
    });

    const rows = response.data.values;

    const customer = rows.find(
      (row) =>
        row[0] === name &&
        row[1] === phone.replace(/-/g, "")
    );

    if (!customer) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "고객 정보 없음" }),
      };
    }

    const total = parseInt(customer[3]);
    const used = parseInt(customer[4]);
    const remaining = total - used;

    return {
      statusCode: 200,
      body: JSON.stringify({
        name: customer[0],
        product: customer[2],
        total,
        used,
        remaining,
        expiry: customer[5],
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};