import components/text_input
import filter
import gleam/dict.{type Dict}
import gleam/dynamic/decode
import gleam/json
import gleam/option.{None, Some}
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

pub type ConfigModel {
  ConfigModel(config: glebs.OAuth2ClientConfig, errors: Dict(Field, String))
}

pub fn default_model() {
  ConfigModel(
    config: glebs.OAuth2ClientConfig(
      client_id: "",
      authorize_url: "",
      token_url: "",
      redirect_uri: "",
      scope: "",
    ),
    errors: dict.new(),
  )
}

pub type ConfigMsg {
  ConfigFieldChanged(Field, String)
  InvalidValue(Field, String)
  Save
  Cancel
}

pub type Field {
  AuthorizeUrl
  TokenUrl
  RedirectUri
  ClientId
  Scope
}

pub fn update(
  model: ConfigModel,
  msg: ConfigMsg,
) -> #(ConfigModel, effect.Effect(ConfigMsg)) {
  case msg {
    ConfigFieldChanged(field, value) -> {
      let new_config = case field {
        AuthorizeUrl ->
          glebs.OAuth2ClientConfig(..model.config, authorize_url: value)
        TokenUrl -> glebs.OAuth2ClientConfig(..model.config, token_url: value)
        RedirectUri ->
          glebs.OAuth2ClientConfig(..model.config, redirect_uri: value)
        ClientId -> glebs.OAuth2ClientConfig(..model.config, client_id: value)
        Scope -> glebs.OAuth2ClientConfig(..model.config, scope: value)
      }
      #(ConfigModel(..model, config: new_config), effect.none())
    }
    InvalidValue(field, value) -> {
      let new_errors = dict.insert(model.errors, field, value)
      #(ConfigModel(..model, errors: new_errors), effect.none())
    }
    Save -> {
      let _ = save_config_storage(model.config)
      #(model, modem.back(1))
    }
    Cancel -> #(model, modem.back(1))
  }
}

pub fn config_view(model: ConfigModel, stylesheet) {
  let config = model.config

  use <- sketch_lustre.render(stylesheet, [sketch_lustre.node()])
  let a = {
    filter.to_msg(fn(a) { ConfigFieldChanged(AuthorizeUrl, a) })
    |> filter.required
    |> filter.process(fn(err) { InvalidValue(AuthorizeUrl, err) })
  }
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
      html.div(
        css.class([
          css.display("flex"),
          css.flex_direction("column"),
          css.width(px(300)),
          css.row_gap(px(14)),
        ]),
        [],
        [
          text_input.text_input(
            "Authorize URL",
            config.authorize_url,
            event.on_input(a),
            error: option.from_result(dict.get(model.errors, AuthorizeUrl)),
          ),
          text_input.text_input(
            "Token URL",
            config.token_url,
            event.on_input(ConfigFieldChanged(TokenUrl, _)),
            error: None,
          ),
          text_input.text_input(
            "Redirect URI",
            config.redirect_uri,
            event.on_input(ConfigFieldChanged(RedirectUri, _)),
            error: None,
          ),
          text_input.text_input(
            "Client ID",
            config.client_id,
            event.on_input(ConfigFieldChanged(ClientId, _)),
            error: None,
          ),
          text_input.text_input(
            "Scope",
            config.scope,
            event.on_input(ConfigFieldChanged(Scope, _)),
            error: option.from_result(dict.get(model.errors, Scope)),
          ),
        ],
      ),
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
