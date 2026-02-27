const { google } = require("googleapis");

exports.handler = async (event) => {
  try {
    const { name, phone } = JSON.parse(event.body);

    if (!name || !phone) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing name or phone" }),
      };
    }

    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "prepaid_data!A2:G",
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "No data found" }),
      };
    }

    const customer = rows.find(
      (row) =>
        row[0] === name &&
        row[1] === phone
    );

    if (!customer) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Customer not found" }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        prepaid_name: customer[2],
        total: customer[3],
        used: customer[4],
        remain: customer[5],
        expire: customer[6],
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};