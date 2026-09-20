/**
 * Google Apps Script for Data Structathon Registration Form
 * 
 * Instructions:
 * 1. Open your Google Form.
 * 2. Click the 3 dots (More) -> Script editor.
 * 3. Paste this code into Code.gs.
 * 4. Update the WEBHOOK_URL and WEBHOOK_SECRET below.
 * 5. Add a Trigger: 
 *    - Choose which function to run: onFormSubmit
 *    - Select event source: From form
 *    - Select event type: On form submit
 */

const WEBHOOK_URL = "https://your-production-domain.com/api/webhook/register";
const WEBHOOK_SECRET = "datastructathon-webhook-secret-2026";

function onFormSubmit(e) {
  try {
    // Note: Adjust the index [0], [1], etc., based on the exact order 
    // of questions in your Google Form.
    // e.values[0] is typically the Timestamp
    const responses = e.values;
    
    const payload = {
      team_name: responses[1] || "",
      college_name: responses[2] || "",
      leader_name: responses[3] || "",
      leader_email: responses[4] || "",
      leader_phone: responses[5] || "",
      member2_name: responses[6] || "",
      member3_name: responses[7] || "",
      member4_name: responses[8] || "",
    };

    const options = {
      method: "post",
      contentType: "application/json",
      headers: {
        "Authorization": `Bearer ${WEBHOOK_SECRET}`
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(WEBHOOK_URL, options);
    const responseCode = response.getResponseCode();
    
    if (responseCode !== 200) {
      console.error(`Webhook failed with status ${responseCode}: ${response.getContentText()}`);
    } else {
      console.log(`Webhook succeeded: ${response.getContentText()}`);
    }
    
  } catch (error) {
    console.error("Error in onFormSubmit: " + error.toString());
  }
}
