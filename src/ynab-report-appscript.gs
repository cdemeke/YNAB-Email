function emailFunction() {
  // Email Config
  var recipientsTO = ""; // email address e.g. "test@test.com, test2@test.com"
  var emailSubject = "YNAB Report";

  // Private Keys
  accessToken = "";
  budgetID = "";

  // Get data from YNAB (specifically Categories & Spending)
  var categoriesData = get_ynab_categories(accessToken,budgetID)
  var spendingData = get_ynab_spending(accessToken,budgetID)

  // Format Data for email form
  var formattedData = formatTransactionData(spendingData)
  var data = formatData(categoriesData)

  // Add to email template and subsitute content
  var htmlOutput = HtmlService.createHtmlOutputFromFile('email'); //name of file is email.html
  var message = htmlOutput.getContent()
  message = message.replace("%transactions", formattedData);
  message = message.replace("%tablecontent", data);

  // Send Email
  sendEmail(emailSubject, message, recipientsTO);
}

function formatCurrency(symbol, amount) {
  if (!isNaN(parseFloat(amount)) && isFinite(amount)) {
    var aDigits = amount.toFixed(2).split(".");
    aDigits[0] = aDigits[0].split("").reverse().join("")
    .replace(/(\d{3})(?=\d)/g,"$1,").split("").reverse().join("");
    return symbol + aDigits.join(".");
  }
  return amount
}

function get_ynab_categories(accessToken,budgetID) {

  const groups = fetch_ynab_data(accessToken, "budgets/" + budgetID + "/categories").category_groups;

  //const columns = ["Name", "Budgeted", "Activity", "Balance"];
  const rows = [];

  for (var group_idx = 0; group_idx < groups.length; group_idx++) {
    // Add the group
    var group = groups[group_idx];
    // Skip internal and hidden categories
    if (['Internal Master Category', 'Hidden Categories'].indexOf(group.name) >= 0) continue;
    rows.push([group.name]);

    // Add the categories
    for (var category_idx = 0; category_idx < group.categories.length; category_idx++) {
      var category = group.categories[category_idx];

      var name = "      " + category.name; // Indent categories a bit so they are offset from groups
      // Calculate currency amounts from mulliunits
      var budgeted = category.budgeted / 1000.0;
      var activity = category.activity / 1000.0;
      var balance = category.balance / 1000.0;

      rows.push([name, budgeted, activity, balance]);
    }
  }
  return rows;
};

function get_ynab_spending(accessToken,budgetID) {

  // Roll back date by 7 days
  var day = new Date();
  day.setDate(day.getDate() - 7);
  day = day.toISOString().substr(0,10);

  const groups = fetch_ynab_data(accessToken, "budgets/" + budgetID + "/transactions?since_date=" + day).transactions;

  var transactions = []
  var transactionsFormatted = []
  groups.forEach(function (transaction) {

    var day = transaction.date;
    var amount = transaction.amount / 1000.0;
    var account_name = transaction.account_name;
    var payee_name = transaction.payee_name;
    if (transaction.category_name == null){
      var category = " ";}
      else {
        var category = transaction.category_name;};
        var category = transaction.category_name;
        if (transaction.memo == null){
          var memo = " ";}
          else {
            var memo = transaction.memo;};

            transactions.push([day, amount, account_name, payee_name, category, memo]);
          });
          return transactions;
        };

        function formatTransactionData(rows){
          var tableMiddle = '';
          var zebraStripe = true // required for zebra striped rows

          rows.forEach(function (data) {
            data[1] = formatCurrency("$", data[1]);
            if (zebraStripe) {
              tableMiddle = tableMiddle + '<tr>'+
              '<td scope="row" class="zebra" align="left" valign="top">' + data[0] + '</td>' +
              '<td scope="row" class="zebra" align="left" valign="top">$' + data[1] + '</td>' +
              '<td scope="row" class="zebra" align="left" valign="top">' + data[2] + '</td>' +
              '<td scope="row" class="zebra" align="left" valign="top">' + data[3] + '</td>' +
              '<td scope="row" class="zebra" align="left" valign="top">' + data[4] + '</td>' +
              '<td scope="row" class="zebra" align="left" valign="top">' + data[5] + '</td></tr>';
              zebraStripe = false;
            }
            else {
              tableMiddle = tableMiddle + '<tr>'+
              '<td>' + data[0] + '</td>' +
              '<td>$' + data[1] + '</td>' +
              '<td>' + data[2] + '</td>' +
              '<td>' + data[3] + '</td>' +
              '<td>' + data[4] + '</td>' +
              '<td>' + data[5] + '</td></tr>';
              zebraStripe = true;
            }

          });
          return tableMiddle;
        }


        function formatData(data) {
          var tableMiddle = ''
          var zebraStripe = true // required for zebra striped rows

          data.forEach(function (row) {
            var name = row[0];
            var budget = row[1];
            var activity = row[2];
            var balance = row[3];

            if (name != '') {
              // check if table header
              if ((budget == null)) {
                tableMiddle = '<tr class="sectionHeader">' + tableMiddle + '<td class="sectionHeader" align="left" valign="top">'+ name + '</td>'
                tableMiddle = tableMiddle + '<td class="sectionHeader">' + "" + '</td>'
                tableMiddle = tableMiddle + '<td class="sectionHeader">' + "" + '</td>'
                tableMiddle = tableMiddle + '<td class="sectionHeader">' + "" + '</td>'
              }

              // check if section header
              else if ((budget === "") && (activity ===  "") && (balance ===  "")) {
                tableMiddle = '<tr class="sectionHeader">' + tableMiddle + '<td class="sectionHeader" align="left" valign="top">'+ name + '</td>'
                tableMiddle = tableMiddle + '<td class="sectionHeader">' + formatCurrency("$", budget) + '</td>'
                tableMiddle = tableMiddle + '<td class="sectionHeader">' + formatCurrency("$", activity) + '</td>'
                tableMiddle = tableMiddle + '<td class="sectionHeader">' + formatCurrency("$", balance) + '</td>'
              }

              else {
                if (zebraStripe) {
                  tableMiddle = '<tr>' + tableMiddle + '<td scope="row" class="zebra" align="left" valign="top">' + name + '</td>'
                  tableMiddle = tableMiddle + '<td class="zebra">' + formatCurrency("$", budget) + '</td>'
                  tableMiddle = tableMiddle + '<td class="zebra">' + formatCurrency("$", activity) + '</td>'
                  if (!isNaN(parseFloat(balance)) && isFinite(balance) && balance < 0) {
                    tableMiddle = tableMiddle + '<td class="zebra" valign="top" style="color:red">' + formatCurrency("$", balance) + '</td>'
                  }
                  else {
                    tableMiddle = tableMiddle + '<td class="zebra" valign="top" style="color:#035c1f">' + formatCurrency("$", balance) + '</td>'
                  }
                  zebraStripe = false
                }
                else {
                  zebraStripe = true
                  tableMiddle = '<tr> ' + tableMiddle + '<td align="left" valign="top">' + name + '</td>'
                  tableMiddle = tableMiddle + '<td valign="top">' + formatCurrency("$", budget) + '</td>'
                  tableMiddle = tableMiddle + '<td valign="top">' + formatCurrency("$", activity) + '</td>'
                  if (!isNaN(parseFloat(balance)) && isFinite(balance) && balance < 0) {
                    tableMiddle = tableMiddle + '<td valign="top" style="color:red">' + formatCurrency("$", balance) + '</td>'
                  }
                  else {
                    tableMiddle = tableMiddle + '<td valign="top" style="color:#035c1f">' + formatCurrency("$", balance) + '</td>'
                  }
                }
              }

              tableMiddle = tableMiddle + '</tr>'
            }
          });
          return (tableMiddle)
        }


        function sendEmail(subject, message, recipients) {
          MailApp.sendEmail({
            to: recipients,
            subject: subject,
            htmlBody: message
          });
        }
