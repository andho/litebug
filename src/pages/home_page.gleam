import components/text_input
import gleam/dict
import gleam/int
import gleam/list
import gleam/option.{None, Some}
import gleam/pair
import gleam/result
import lustre/effect
import lustre/event
import modem
import sketch/css
import sketch/css/length.{px}
import sketch/lustre as sketch_lustre
import sketch/lustre/element
import sketch/lustre/element/html
import theme

import components/button

import form

pub type Field {
  Date
}

pub type Transaction {
  Transaction(description: String)
}

pub type TransactionField {
  Description
  Source
  Destination
  Amount
  Category
  Budget
}

pub type Model {
  Model(
    form: form.Form(Field),
    transactions: List(#(String, form.Form(TransactionField))),
  )
}

pub type Msg {
  Logout
  FormEvent(form.FormEvent(Field))
  TransactionFormEvent(String, form.FormEvent(TransactionField))
  DeleteTransaction(String)
  AddSplit(String)
  Submit
}

pub fn init_model() -> Model {
  Model(
    form: form.Form(
      fields: dict.from_list([form.init_field(Date, form.required)]),
    ),
    transactions: [
      #("0", init_transaction_form()),
      #("1", init_transaction_form()),
    ],
  )
}

pub fn init_transaction_form() {
  form.Form(
    fields: dict.from_list([
      form.init_field(Description, form.required),
      form.init_field(Source, form.required),
      form.init_field(Destination, form.required),
      form.init_field(Budget, form.required),
      form.init_field(Category, form.required),
    ]),
  )
}

fn get_transaction(
  transactions: List(#(String, form.Form(TransactionField))),
  id: String,
) {
  list.find(transactions, fn(transaction) {
    let #(tid, _) = transaction
    tid == id
  })
  |> result.map(pair.second)
}

fn remove_transaction(
  transactions: List(#(String, form.Form(TransactionField))),
  id: String,
) -> List(#(String, form.Form(TransactionField))) {
  list.filter(transactions, fn(transaction) {
    let #(tid, _) = transaction
    tid != id
  })
}

fn update_transaction(
  transactions: List(#(String, form.Form(TransactionField))),
  id: String,
  transaction: form.Form(TransactionField),
) -> List(#(String, form.Form(TransactionField))) {
  list.map(transactions, fn(curr_transaction) {
    let #(tid, transaction_form) = curr_transaction
    case tid == id {
      True -> #(id, transaction)
      False -> #(tid, transaction_form)
    }
  })
}

pub fn update(model: Model, msg: Msg) -> #(Model, effect.Effect(Msg)) {
  case msg {
    FormEvent(form.OnChange(field, value)) -> {
      let new_form =
        form.handle_form_event(model.form, form.OnChange(field, value))
      #(Model(..model, form: new_form), effect.none())
    }
    TransactionFormEvent(id, form.OnChange(field, value)) -> {
      let new_model =
        get_transaction(model.transactions, id)
        |> result.map(fn(transaction) {
          let new_form =
            form.handle_form_event(transaction, form.OnChange(field, value))

          Model(
            ..model,
            transactions: update_transaction(model.transactions, id, new_form),
          )
        })
        |> result.unwrap(model)
      #(new_model, effect.none())
    }
    AddSplit(id) -> #(
      Model(
        ..model,
        transactions: list.reverse([
          #(id, init_transaction_form()),
          ..list.reverse(model.transactions)
        ]),
      ),
      effect.none(),
    )
    DeleteTransaction(id) -> #(
      Model(..model, transactions: remove_transaction(model.transactions, id)),
      effect.none(),
    )
    Submit -> #(model, effect.none())
    Logout -> #(
      Model(..model, form: init_model().form),
      modem.replace("/", None, None),
    )
  }
}

pub fn home_view(model: Model, stylesheet) {
  use <- sketch_lustre.render(stylesheet, [sketch_lustre.node()])

  html.div(
    css.class([css.display("flex"), css.flex_direction("column"), css.flex("1")]),
    [],
    [
      nav_bar(model),
      html.div(
        css.class([
          css.display("flex"),
          css.flex_direction("row"),
          css.flex("1"),
        ]),
        [],
        [group_fields(model), transactions_view(model)],
      ),
    ],
  )
}

fn nav_bar(_model: Model) {
  html.div(
    css.class([
      css.background("#000"),
      css.flex("1"),
      css.height(px(28)),
      css.padding_("12px 12px"),
      css.display("flex"),
      css.justify_content("space-between"),
      css.align_items("center"),
    ]),
    [],
    [
      html.div(
        css.class([
          css.color(theme.color(theme.Text)),
          css.font_size(length.rem(1.5)),
        ]),
        [],
        [html.text("Litebug")],
      ),
      button.button("Logout", button.Primary, Some(event.on_click(Logout)), []),
    ],
  )
}

fn group_fields(model: Model) {
  html.div(
    css.class([
      css.display("flex"),
      css.width(px(260)),
      css.padding(px(14)),
      css.flex_direction("column"),
      css.row_gap(px(14)),
    ]),
    [],
    [
      form.render_field(
        model.form,
        Date,
        FormEvent,
        fn(value, on_change, error) {
          text_input.text_input("Group Title", value, on_change, error)
        },
      ),
      form.render_field(
        model.form,
        Date,
        FormEvent,
        fn(value, on_change, error) {
          text_input.text_input("Date", value, on_change, error)
        },
      ),
      button.button("Submit", button.Primary, Some(event.on_click(Submit)), []),
    ],
  )
}

fn transactions_view(model: Model) {
  html.div(
    css.class([
      css.flex("1"),
      css.display("flex"),
      css.flex_direction("column"),
      css.row_gap(px(14)),
      css.margin(px(14)),
    ]),
    [],
    [
      element.keyed(
        html.div(
          css.class([
            css.flex("1"),
            css.display("flex"),
            css.flex_direction("column"),
            css.row_gap(px(14)),
          ]),
          [],
          _,
        ),
        list.map(model.transactions, fn(transaction_form) {
          let #(id, form) = transaction_form
          #(id, transaction_view(model, form, id))
        }),
      ),
      html.div(css.class([css.display("flex")]), [], [
        button.button(
          "Add split",
          button.Secondary,
          Some(
            event.on_click(
              AddSplit(int.to_string(list.length(model.transactions))),
            ),
          ),
          [],
        ),
      ]),
    ],
  )
}

fn transaction_view(model: Model, form: form.Form(TransactionField), id: String) {
  html.div(
    css.class([
      css.flex("1"),
      css.padding(px(14)),
      css.display("grid"),
      css.grid("auto-flow / repeat(3, minmax(0, 1fr))"),
      css.gap(px(14)),
      css.background(theme.color(theme.CardBackground)),
    ]),
    [],
    [
      form.render_field(
        form,
        Description,
        TransactionFormEvent(id, _),
        fn(value, on_change, error) {
          text_input.text_input("Description", value, on_change, error)
        },
      ),
      form.render_field(
        form,
        Source,
        TransactionFormEvent(id, _),
        fn(value, on_change, error) {
          text_input.text_input("Source", value, on_change, error)
        },
      ),
      form.render_field(
        form,
        Destination,
        TransactionFormEvent(id, _),
        fn(value, on_change, error) {
          text_input.text_input("Destination", value, on_change, error)
        },
      ),
      form.render_field(
        form,
        Budget,
        TransactionFormEvent(id, _),
        fn(value, on_change, error) {
          text_input.text_input("Budget", value, on_change, error)
        },
      ),
      form.render_field(
        form,
        Category,
        TransactionFormEvent(id, _),
        fn(value, on_change, error) {
          text_input.text_input("Category", value, on_change, error)
        },
      ),
      html.div(
        css.class([css.display("flex"), css.flex_direction("row-reverse")]),
        [],
        [
          html.div(
            css.class([
              css.display("flex"),
              css.flex_direction("column-reverse"),
            ]),
            [],
            [
              button.button(
                "Remove",
                button.Warn,
                Some(event.on_click(DeleteTransaction("0"))),
                [],
              ),
            ],
          ),
        ],
      ),
    ],
  )
}
