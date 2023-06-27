[![Netlify Status](https://api.netlify.com/api/v1/badges/73babb1a-c278-4c8d-bf94-752c78ba6b5d/deploy-status)](https://app.netlify.com/sites/cheery-bunny-5ab5d6/deploys)

Litebug is a rapid data entry interface for [Firefly
iii](https://www.firefly-iii.org/).

Currently a build is deployed at https://cheery-bunny-5ab5d6.netlify.app/. You
will need an instance of firefly iii with CORS setup for the domain in order to
use litebug with it.

# What does Litebug offer that is different from firefly

- Litebug auto fills all fields based on the transaction you choose from the
  description autocomplete field.
- Litebug allows you to specify if an item is tax exempt or not. Currently
  different tax rates are not supported.
- Litebug shows you transaction group total for split transactions.

# How does the tax feature work

The tax feature allows you to specify whether each item in a transaction is
taxed or tax exempt. This translates into a tag `gst-inclusive`. I plan to
create a report that can calculate tax based on this tag.

On the left hand side, you also have a toggle for 'Tax Inclusive' and 'Tax
Exclusive'. This specifies if the amounts you are entering for the items are
inclusive of tax or exclusive of tax (as they are in different receipts/bills).
Based on this, the transaction summary will show the before tax, tax and after
tax value. The 'Tax Inclusive' / 'Tax Exclusive' value is not saved into the
database in anyway.

# Development

I'm doing development using podman containers. You will need to have podman
installed. If you want to use these, follow these steps.

    ./bin/build-dev.sh
    ./bin/bash.sh
    yarn install
    exit
    ./start.sh

The development server will be running on port 3000.

# TODO

- Show history based on selected date.
- Add tags field.
- Auto update global data everyfew days and also after transaction is saved.
- Lock screen.
- Encrypt local data.
- Maybe some way to specify quantity.


- Scroll to out of view transaction when new split is added
- Copy over Budget and Allowance from previous transaction when new split is
  added.
- Allow to enter freetext for account if it matches the rules
- Ask "Are you sure you want to remove when removing filled in transaction".
- Rehydrate taxRate from transaction.
- debounce description
- savings account not showing up in source account

- need to load paginated data when loading the global data
