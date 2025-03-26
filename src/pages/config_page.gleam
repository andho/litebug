import components/text_input
import gleam/dynamic/decode
import gleam/json
import gleam/option.{Some}
import gleam/result
import glebs
import glebs/request
import lustre/attribute
import lustre/effect
import modem
import plinth/javascript/storage
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
    Save -> {
      let _ = save_config_storage(model)
      #(model, modem.back(1))
    }
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

pub fn save_config_storage(config: glebs.OAuth2ClientConfig) {
  let _ =
    storage.local()
    |> result.map(storage.set_item(
      _,
      "glebs_config",
      oauth2_config_encoder(config),
    ))
  echo "Saved config"
}

pub fn oauth2_client_config_decoder() -> decode.Decoder(
  glebs.OAuth2ClientConfig,
) {
  use client_id <- decode.field("client_id", decode.string)
  use authorize_url <- decode.field("authorize_url", decode.string)
  use token_url <- decode.field("token_url", decode.string)
  use redirect_uri <- decode.field("redirect_uri", decode.string)
  use scope <- decode.field("scope", decode.string)
  decode.success(glebs.OAuth2ClientConfig(
    client_id:,
    authorize_url:,
    token_url:,
    redirect_uri:,
    scope:,
  ))
}

pub fn oauth2_config_encoder(config: glebs.OAuth2ClientConfig) -> String {
  json.object([
    #("client_id", json.string(config.client_id)),
    #("authorize_url", json.string(config.authorize_url)),
    #("token_url", json.string(config.token_url)),
    #("redirect_uri", json.string(config.redirect_uri)),
    #("scope", json.string(config.scope)),
  ])
  |> json.to_string
}
