import components/text_input
import gleam/option.{Some}
import glebs
import lustre/attribute
import lustre/effect
import modem
import theme

import lustre/event
import sketch/css
import sketch/css/length.{px}
import sketch/lustre as sketch_lustre

import sketch/lustre/element/html

import components/button.{button}
import style.{text_body}

pub fn default_model() {
  glebs.OAuth2ClientConfig(
    client_id: "",
    authorize_url: "",
    token_url: "",
    redirect_uri: "",
    scope: "",
  )
}

pub type ConfigMsg {
  FireflyUrlChanged(String)
  Save
  Cancel
}

pub fn update(
  model: glebs.OAuth2ClientConfig,
  msg: ConfigMsg,
) -> #(glebs.OAuth2ClientConfig, effect.Effect(ConfigMsg)) {
  case msg {
    FireflyUrlChanged(url) -> {
      #(glebs.OAuth2ClientConfig(..model, authorize_url: url), effect.none())
    }
    Save -> #(model, modem.back(1))
    Cancel -> #(model, modem.back(1))
  }
}

pub fn config_view(model: glebs.OAuth2ClientConfig, stylesheet) {
  use <- sketch_lustre.render(stylesheet, [sketch_lustre.node()])

  html.div(
    css.class([
      css.width(px(400)),
      css.property("margin", "50px auto"),
      css.padding(px(28)),
      css.background(theme.color(theme.CardBackground)),
      css.display("flex"),
      css.row_gap(px(10)),
      css.flex_direction("column"),
      css.justify_content("center"),
      css.align_items("center"),
      css.border_radius(px(14)),
    ]),
    [],
    [
      html.div(css.class([]), [], [
        html.div(text_body(), [], [
          html.text("Enter your firefly OAuth2 config"),
        ]),
      ]),
      html.div(css.class([css.display("flex"), css.gap(px(14))]), [], [
        text_input.text_input(
          "Firefly URL",
          model.authorize_url,
          event.on_input(FireflyUrlChanged),
        ),
      ]),
      html.div(
        css.class([
          css.display("flex"),
          css.flex_direction("row"),
          css.gap(px(14)),
        ]),
        [],
        [
          button("Cancel", button.Secondary, Some(event.on_click(Cancel))),
          button("Save", button.Primary, Some(event.on_click(Save))),
        ],
      ),
    ],
  )
}
