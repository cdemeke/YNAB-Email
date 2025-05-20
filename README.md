# YNAB-Email

## Project Overview

This Google Apps Script project automates the process of generating and emailing a summary of your YNAB (You Need A Budget) activity. It fetches data such as category balances and recent transactions from your YNAB account, formats it into a user-friendly email, and sends it to your specified recipients.

Google Apps Script is a cloud-based JavaScript platform that lets you create applications that integrate with Google Workspace services like Gmail, Sheets, Docs, etc. In this project, it's used to fetch data from the YNAB API, format this data into an HTML email, and then send it using your Gmail account. This allows for scheduled, automated financial summaries directly to your inbox.

## File Structure

Here's a brief overview of the important files and directories in this project:

*   `README.md`: (This file) You're reading it! It provides instructions, setup details, and general information about the project.
*   `images/`: This directory contains screenshots and other images used within the `README.md` to help illustrate setup steps and the final email output.
*   `src/`: This directory holds all the source code for the project.
    *   `src/email.html`: This is the HTML template file that defines the structure and basic styling of the email report. The script populates this template with your YNAB data.
    *   `src/ynab-report-appscript.gs`: This is the main Google Apps Script file. It contains all the JavaScript code responsible for fetching data from the YNAB API, processing that data, populating the HTML template, and sending the final email.

The end result will generate an email (as frequently as you'd like) that will look like:

<kbd>![Sample YNAB Email Report Screenshot](images/sample-screenshot-email.png)</kbd>


## Setup

In order to set this up you will need to:

* Have a YNAB account
* Generate a YNAB accessToken ([More info](https://api.ynab.com/#personal-access-tokens))
* Find your budgetID ([More info](#budgetid))

## Creating the Script

Once you have your YNAB variables you need to:

1. Go to [script.google.com](http://script.google.com/).
2. Sign in and click on **New project**.
3. The script editor will open, likely with a file named `Code.gs` (or `Untitled.gs`). Delete any existing content in this file.
4. Open the [ynab-report-appscript.gs](src/ynab-report-appscript.gs) file from this repository, copy its entire content.
5. Paste the copied code into the `Code.gs` file in the Google Apps Script editor.
6. **Create the HTML email template:**
    1. In the Apps Script editor, click on **File > New > HTML file**.
    2. Name the file `email.html`. It's important that this name exactly matches the one used in the `Code.gs` script (which is `email.html` by default).
    3. Open the [email.html](src/email.html) file from this repository, copy its entire content.
    4. Paste the copied HTML code into the new `email.html` file you just created in the Apps Script editor.
7. **Configure your script variables:**
    In the `Code.gs` file, locate the following lines at the top and replace the placeholder values with your actual YNAB information and desired email recipients:
    ```javascript
    // Replace with your YNAB accessToken
    var accessToken = "YOUR_YNAB_ACCESS_TOKEN"; 
    // Replace with your YNAB budgetID
    var budgetID = "YOUR_BUDGET_ID"; 
    // Replace with email address(es) you want to send to
    var recipientsTO = "YOUR_EMAIL_RECIPIENTS"; 
    ```
    * `YOUR_YNAB_ACCESS_TOKEN`: Your Personal Access Token from YNAB.
    * `YOUR_BUDGET_ID`: The ID of the YNAB budget you want to use (see [Finding your BudgetID](#budgetid) below).
    * `YOUR_EMAIL_RECIPIENTS`: A comma-separated string of email addresses where the report should be sent (e.g., `"your.email@example.com"` or `"email1@example.com, email2@example.com"`).
8. **Save the project:** Click the save icon (floppy disk symbol) in the Apps Script toolbar.
9. **Run the script to test:**
    1. In the Apps Script toolbar, ensure the function `sendEmailReport` is selected in the function dropdown menu (it might initially say `Select function`).
    2. Click the **Run** button (looks like a play icon ▶).
    3. **Authorization:** The first time you run the script, Google will ask for authorization to access your data (e.g., send emails on your behalf).
        * Click "Review permissions."
        * Choose your Google account.
        * You might see a "Google hasn’t verified this app" screen. If so, click "Advanced" and then "Go to **[Project Name]** (unsafe)".
        * Review the permissions the script needs and click "Allow".
10. **Set up automated triggers (optional):**
    To have the script run automatically (e.g., daily or weekly):
    1. In the Apps Script editor, click on the **Triggers** icon (looks like an alarm clock) in the left sidebar.
    2. Click the **+ Add Trigger** button (usually in the bottom right).
    3. Configure the trigger settings:
        * Choose which function to run: `sendEmailReport`
        * Choose which deployment should run: `Head` (this means it runs the latest saved code)
        * Select event source: `Time-driven`
        * Select type of time based trigger: e.g., `Week timer` (for weekly), `Day timer` (for daily).
        * Configure the specific time or day for the trigger. For example, for a weekly email, you might choose "Week timer" and "Every Monday" at "9am".
    4. Click **Save**.
    5. Here is an example of what the trigger settings might look like:
  ![Google Apps Script Trigger Settings Example](images/appscript-trigger-settings.png?raw=true "Google Apps Script Trigger Settings Example")

## Code Overview

This project consists of two main files: `src/ynab-report-appscript.gs` which contains all the logic, and `src/email.html` which is the template for the email.

### `src/ynab-report-appscript.gs`

This Google Apps Script file is responsible for fetching data from YNAB, processing it, and sending the summary email.

**Key Global Variables/Configuration (at the top of the file):**
*   `recipientsTO`: Stores the email address(es) to send the report to. **This needs to be configured by the user.**
*   `emailSubject`: Defines the subject line for the email.
*   `accessToken`: Your YNAB Personal Access Token. **This needs to be configured by the user.**
*   `budgetID`: The ID of your YNAB budget. **This needs to be configured by the user.**

**Main Functions:**

*   `emailFunction()`: This is the main function that gets executed (either manually or by a trigger). It orchestrates the entire process:
    1.  Calls `get_ynab_categories` and `get_ynab_spending` to fetch data from YNAB.
    2.  Calls `formatTransactionData` and `formatData` to prepare the fetched data for display.
    3.  Loads the HTML content from `email.html`.
    4.  Replaces placeholders in the HTML with the formatted data.
    5.  Calls `sendEmail()` to dispatch the final email.
*   `fetch_ynab_data(accessToken, path)`: A helper function that makes the actual API calls to the YNAB API. It takes the API `accessToken` and the specific API `path` (e.g., `budgets/budgetID/categories`) as input. It handles the authorization header and parses the JSON response from YNAB, returning the `data` portion of the response.
*   `get_ynab_categories(accessToken, budgetID)`: Fetches category group information and individual category details (name, budgeted, activity, balance) for the specified `budgetID`. It processes this data, skipping internal/hidden categories, and formats it into rows suitable for display.
*   `get_ynab_spending(accessToken, budgetID)`: Retrieves recent transaction data from the last 7 days for the specified `budgetID`. It extracts details like date, amount, account name, payee, category, and memo for each transaction.
*   `formatTransactionData(rows)`: Takes the raw transaction data (an array of arrays) and converts it into an HTML table string. It applies currency formatting and uses zebra striping for readability.
*   `formatData(data)`: Takes the raw category data (an array of arrays) and converts it into an HTML table string. It handles category group headers and category rows, applies currency formatting, and styles negative balances in red and positive ones in green. It also implements zebra striping.
*   `formatCurrency(symbol, amount)`: A utility function to format numerical amounts into a currency string (e.g., $1,234.56).
*   `sendEmail(subject, message, recipients)`: Uses the `MailApp.sendEmail()` service from Google Apps Script to send the generated HTML email (`message`) with the specified `subject` to the configured `recipients`.

### `src/email.html`

This file is an HTML template that defines the structure and basic styling of the email report.
*   It contains standard HTML markup for the email body.
*   Placeholders like `%transactions%` and `%tablecontent%` are embedded within the HTML.
*   The `emailFunction()` in `ynab-report-appscript.gs` reads this HTML file, and then uses string replacement to inject the dynamically generated category and transaction tables into these placeholder locations before sending the email. This allows the visual presentation of the email to be managed separately from the data-gathering logic.


### BudgetID
The BudgetID is the unique identifier for your YNAB budget that the script needs to fetch your financial data.

**Recommended Method: Using the YNAB API**

This is the most reliable way to get your BudgetID.
1.  Make sure you have your YNAB Personal Access Token (see [Setup](#setup)).
2.  Open a terminal or command prompt on your computer.
3.  Run the following `curl` command, replacing `YOUR_YNAB_ACCESS_TOKEN` with your actual token:
    ```bash
    curl -H "Authorization: Bearer YOUR_YNAB_ACCESS_TOKEN" https://api.ynab.com/v1/budgets
    ```
4.  The command will return a JSON response listing your budgets. Look for the budget you want to use and find its `"id"`.

    *Example Response:*
    ```json
    {
      "data": {
        "budgets": [
          {
            "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef", // This is the budgetID
            "name": "My Main Budget",
            "last_modified_on": "2023-10-27T10:30:00Z",
            // ... other budget details
          },
          {
            "id": "z9y8x7w6-v5u4-3210-fedc-ba0987654321",
            "name": "Vacation Fund",
            // ... other budget details
          }
        ],
        "default_budget": null
      }
    }
    ```
    Copy the `id` value (e.g., `a1b2c3d4-e5f6-7890-1234-567890abcdef`) for the desired budget.

**Alternative Method: From the YNAB URL**

You can also find the BudgetID in the URL when you have your budget open in YNAB:
1.  Go to [app.ynab.com](https://app.ynab.com/) and open your budget.
2.  Look at the URL in your browser's address bar. It will look something like:
    `https://app.ynab.com/a1b2c3d4-e5f6-7890-1234-567890abcdef/overview`
3.  The long string of characters (e.g., `a1b2c3d4-e5f6-7890-1234-567890abcdef` in the example) immediately following `app.ynab.com/` and before the next `/` is typically your BudgetID.

Here's a sample screenshot indicating where the BudgetID is in the URL:

![YNAB Budget ID in URL Screenshot](images/budgetID.png?raw=true "YNAB Budget ID in URL Screenshot")

## Basic Troubleshooting

If you encounter issues while setting up or running the script, here are a few common troubleshooting steps:

### 1. Authorization Errors in Google Apps Script

*   **Initial Authorization:** When you run the script for the first time (e.g., by clicking "Run" with `sendEmailReport` selected), Google will prompt you to authorize the script. Make sure you complete this authorization process, granting the necessary permissions. If you missed it, try running the function again.
*   **Re-check Permissions:** If you continue to have authorization problems, you can see the permissions the script currently has by going to the Apps Script editor, then clicking on "Project Settings" (the gear icon ⚙️ on the left sidebar). The OAuth scopes used by the project will be listed there. While the script should automatically request the correct scopes, this can be a place to check if something seems wrong. You might need to re-authorize by running the script again.

### 2. YNAB API Issues

*   **Invalid `accessToken` or `budgetID`:**
    *   This is the most common cause of YNAB-related errors. Double-check that the `accessToken` and `budgetID` values in your `Code.gs` (or `ynab-report-appscript.gs`) file are correct.
    *   Ensure there are no extra spaces, quotes, or characters accidentally copied.
    *   Verify you are using the correct `budgetID` for the budget you intend to access.
    *   The `accessToken` should be the long string provided by YNAB, not your YNAB password.
*   **API Rate Limits:** The YNAB API has rate limits (around 200 requests per hour per token). While this script typically makes only a few requests per run and is unlikely to hit this limit with normal use (e.g., running once a day or week), if you've been running it very frequently for testing, you might temporarily hit the limit. Wait for an hour and try again.
*   **YNAB API Changes:** APIs can evolve. If the script suddenly stops working after a period of functioning correctly, it's possible YNAB has made changes to their API. Check the official [YNAB API Documentation](https://api.ynab.com/) for any announcements or changes to endpoints or data structures.
*   **Incorrect API URL in Script:** The script uses `https://api.youneedabudget.com/v1/`. While this currently redirects, ensure it hasn't been accidentally changed. The YNAB documentation now recommends `https://api.ynab.com/v1/`. If issues persist, consider updating this in the `fetch_ynab_data` function (though this is not an immediate troubleshooting step unless other YNAB API issues are ruled out).

### 3. Email Not Sending/Receiving

*   **Verify `recipientsTO`:** Double-check the `recipientsTO` variable in your script. Ensure the email address(es) are correctly spelled and formatted (comma-separated if multiple, e.g., `"email1@example.com, email2@example.com"`).
*   **Check Spam/Junk Folder:** The email might have been filtered into the spam or junk folder of the recipient's email account.
*   **Google's Daily Email Quotas:** Google Apps Script has daily quotas for the number of emails you can send via `MailApp.sendEmail()`. For most consumer Gmail accounts, this quota is quite high (e.g., 100-1500 recipients per day, depending on account type and status) and unlikely to be an issue for this script's typical use. However, if you're testing extensively or have other scripts sending emails, it's a remote possibility. You can check your quotas in the Apps Script editor under "File" > "Project properties" > "Quotas".

### 4. Script Errors / Execution Issues

*   **Check Execution Logs:** If the script fails to run or you suspect an error, check the execution logs in Google Apps Script.
    1.  Open your script project.
    2.  Click on "Executions" (looks like a play button with lines) in the left sidebar.
    3.  This will show a list of recent script executions. Look for failed executions (marked with a red error icon). Click on an execution to see the logs, which often include error messages that can pinpoint the problem.
*   **Code Copied Incorrectly:** Ensure that you've copied the contents of `ynab-report-appscript.gs` and `email.html` into your Google Apps Script project exactly and completely. Missing a line or a character can cause errors.
*   **HTML File Name:** Verify that the HTML file in your Apps Script project is named exactly `email.html` (or that the name matches what's in the `HtmlService.createHtmlOutputFromFile('email')` line in `ynab-report-appscript.gs`).
*   **Recent Changes:** If the script was working and suddenly stopped, consider any recent changes you might have made to the script or your YNAB account setup.

## Contributing

We welcome feedback and contributions to improve YNAB-Email!

### Providing Feedback or Reporting Issues

If you have any feedback, encounter a bug, or have a feature suggestion, please open an issue on the [project's issue tracker](https://github.com/USER/REPO/issues) (replace `USER/REPO` with the actual repository path if known, otherwise, this serves as a general placeholder).

When reporting an issue, please include:
*   A clear and descriptive title.
*   Steps to reproduce the issue.
*   What you expected to happen.
*   What actually happened.
*   Any relevant error messages from the Google Apps Script execution logs.

### Making Contributions

We appreciate contributions of all kinds, including:
*   Bug fixes
*   Feature enhancements
*   Documentation improvements
*   Code contributions

If you'd like to contribute code:
1.  Please fork the repository.
2.  Create a new branch for your feature or bug fix.
3.  Make your changes.
4.  If adding a new feature or fixing a bug, please try to add or update relevant comments in the code.
5.  Ensure your code follows standard JavaScript best practices and maintains a style consistent with the existing codebase.
6.  Submit a pull request with a clear description of your changes.

We'll review your contribution and work with you to get it merged.

## License

The content of this project itself is licensed under the [Creative Commons Attribution 3.0 Unported license](https://creativecommons.org/licenses/by/3.0/), and the underlying source code used to format and display that content is licensed under the [MIT license](LICENSE.md).
