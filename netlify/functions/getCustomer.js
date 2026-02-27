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

    // 하이픈 제거
    const cleanPhone = phone.replace(/-/g, "");

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

    const customers = rows.filter((row) => {
      const sheetPhone = (row[1] || "").replace(/-/g, "");
      return row[0] === name && sheetPhone === cleanPhone;
    });

    if (!customers || customers.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Customer not found" }),
      };
    }

    // 만료일 기준 최신이 위로 정렬
    customers.sort((a, b) => {
      const dateA = new Date(a[6]);
      const dateB = new Date(b[6]);
      return dateB - dateA;
    });

    return {
      statusCode: 200,
      body: JSON.stringify(
        customers.map((customer) => ({
          prepaid_name: customer[2] || "",
          total: customer[3] || "0",
          used: customer[4] || "0",
          remain: customer[5] || "0",
          expire: customer[6] || "정보 없음",
        }))
      ),
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};