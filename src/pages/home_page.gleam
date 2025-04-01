import gleam/dict
import gleam/option.{Some}
import lustre/event
import sketch/css
import sketch/css/length.{px}
import sketch/lustre as sketch_lustre
import sketch/lustre/element/html

import components/button

import form

pub type Field {
  Description
}

pub type Model {
  Model(form: form.Form(Field))
}

pub type Msg {
  Logout
}

pub fn init_model() -> Model {
  Model(
    form: form.Form(
      fields: dict.from_list([form.init_field(Description, form.required)]),
    ),
  )
}

pub fn home_view(model: Model, stylesheet) {
  use <- sketch_lustre.render(stylesheet, [sketch_lustre.node()])

  html.div(css.class([]), [], [nav_bar(model), html.div(css.class([]), [], [])])
}

fn nav_bar(_model: Model) {
  html.div(css.class([]), [], [
    button.button("Logout", button.Primary, Some(event.on_click(Logout)), []),
  ])
}
