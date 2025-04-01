import components/text_input
import form
import gleam/dict.{type Dict}
import gleam/dynamic/decode
import gleam/json
import gleam/option.{Some}
import gleam/result
import glebs
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
  ConfigModel(
    config: glebs.OAuth2ClientConfig,
    errors: Dict(Field, String),
    form: form.Form(Field),
  )
}

pub fn init_from_config(config: glebs.OAuth2ClientConfig) {
  let defaults = default_model()
  let get_config_value = fn(field: Field) {
    case field {
      AuthorizeUrl -> config.authorize_url
      TokenUrl -> config.token_url
      RedirectUri -> config.redirect_uri
      ClientId -> config.client_id
      Scope -> config.scope
    }
  }

  ConfigModel(
    config: config,
    errors: dict.new(),
    form: form.Form(
      fields: dict.map_values(defaults.form.fields, fn(field, input_field) {
        form.InputField(..input_field, value: get_config_value(field))
      }),
    ),
  )
}

pub fn default_config() {
  glebs.OAuth2ClientConfig(
    client_id: "",
    authorize_url: "",
    token_url: "",
    redirect_uri: "",
    scope: "",
  )
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
    form: form.Form(
      fields: dict.from_list([
        form.init_field(AuthorizeUrl, form.required),
        form.init_field(TokenUrl, form.required),
        form.init_field(RedirectUri, form.required),
        form.init_field(ClientId, form.required),
        form.init_field(Scope, form.required),
      ]),
    ),
  )
}

pub type ConfigMsg {
  FormEvent(form.FormEvent(Field))
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
    FormEvent(form.OnChange(field, value)) -> {
      let new_form =
        form.handle_form_event(model.form, form.OnChange(field, value))
      #(ConfigModel(..model, form: new_form), effect.none())
    }
    Save -> {
      let config =
        dict.fold(model.form.fields, model.config, fn(conf, field, input_field) {
          case field {
            AuthorizeUrl ->
              glebs.OAuth2ClientConfig(..conf, authorize_url: input_field.value)
            TokenUrl ->
              glebs.OAuth2ClientConfig(..conf, token_url: input_field.value)
            RedirectUri ->
              glebs.OAuth2ClientConfig(..conf, redirect_uri: input_field.value)
            ClientId ->
              glebs.OAuth2ClientConfig(..conf, client_id: input_field.value)
            Scope -> glebs.OAuth2ClientConfig(..conf, scope: input_field.value)
          }
        })
      let new_model = ConfigModel(..model, config: config)
      let _ = save_config_storage(config)
      #(new_model, modem.back(1))
    }
    Cancel -> #(model, modem.back(1))
  }
}

pub fn config_view(model: ConfigModel, stylesheet) {
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
            form.field_value(model.form, AuthorizeUrl),
            form.handle_on_change(FormEvent, AuthorizeUrl),
            error: form.field_error(model.form, AuthorizeUrl),
          ),
          text_input.text_input(
            "Token URL",
            form.field_value(model.form, TokenUrl),
            form.handle_on_change(FormEvent, TokenUrl),
            error: form.field_error(model.form, TokenUrl),
          ),
          text_input.text_input(
            "Redirect URI",
            form.field_value(model.form, RedirectUri),
            form.handle_on_change(FormEvent, RedirectUri),
            error: form.field_error(model.form, RedirectUri),
          ),
          text_input.text_input(
            "Client ID",
            form.field_value(model.form, ClientId),
            form.handle_on_change(FormEvent, ClientId),
            error: form.field_error(model.form, ClientId),
          ),
          text_input.text_input(
            "Scope",
            form.field_value(model.form, Scope),
            form.handle_on_change(FormEvent, Scope),
            error: form.field_error(model.form, Scope),
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
          button("Cancel", button.Secondary, Some(event.on_click(Cancel)), []),
          button("Save", button.Primary, Some(event.on_click(Save)), []),
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
