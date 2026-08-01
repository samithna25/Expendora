# Budget Alert Workflow (04-budget-alert)

This directory contains the n8n workflow for sending a budget alert email when a user exceeds 75% of their monthly budget.

## Workflow Structure
`[Webhook Trigger] -> [IF Node (Percentage >= 75%)] -> [Generate HTML Template] -> [Email Node] -> [DB/Log Node]`

## Files
- `budget-alert.json`: The main n8n workflow configuration file containing all the nodes.
- `request.json`: An example webhook request payload.
- `response.json`: The expected response from the webhook.

## Setup Steps

### 1. Import the Workflow
1. Open your n8n dashboard and create a new workflow.
2. In the top right corner, click on the **options menu (three dots)** and select **Import from File**.
3. Select the `budget-alert.json` file from this folder. This will automatically place all the necessary nodes into your workspace.

### 2. Configure the Webhook Trigger
1. Double-click the **Webhook Trigger** node.
2. Copy the "Test URL" or "Production URL".
3. Your application (e.g., Expendora backend) will need to send a `POST` request to this URL whenever you want to trigger the budget check.
4. Use the structure provided in `request.json` for the data payload.

### 3. Check the IF Node
- The **Percentage >= 75%** node is already configured to check if the incoming `percentage` from the webhook is `>= 75`. No changes are needed here.

### 4. Configure the HTML Template
1. Double-click the **Generate HTML Template** node.
2. Here, you'll see a string variable called `emailHtml` that contains the raw HTML code for the email.
3. You can edit this HTML directly to style it differently or add your own company logo. It automatically dynamically inserts the percentage, budget, and spent values.

### 5. Configure the Email Node
1. Double-click the **Email Node**.
2. You will need to set up your Email credentials (e.g., SMTP or Gmail).
3. The recipient (`toEmail`) is dynamically pulled from the webhook request data, and the email body is populated by the output from the AI Agent Node.

### 6. (Optional) Configure the DB/Log Node
- The **DB/Log Node** is an HTTP Request node currently mocked to send a POST request to an example API (`https://api.expendora.com/logs`).
- If you have an actual logging database, update the URL and credentials here. If not, you can safely delete this node.

### 7. Activate the Workflow
- In the top right corner of the n8n editor, toggle the switch from "Inactive" to **"Active"**.
- Your workflow is now ready to receive data and send budget alerts!