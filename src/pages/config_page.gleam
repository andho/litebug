import components/text_input
import form
import gleam/dict.{type Dict}
import gleam/dynamic/decode
import gleam/json
import gleam/option.{Some}
import gleam/result
import gleam/uri
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

pub type Field {
  /// The URL of the Firefly iii instance
  FireflyUrl
  /// The URL for firefly iii to redirct to after a successful login
  RedirectUrl
  /// The client ID give by firefly iii when you created an OAuth2 client in it
  ClientId
}

pub type ConfigModel {
  ConfigModel(
    config: glebs.OAuth2ClientConfig,
    errors: Dict(Field, String),
    form: form.Form(Field),
  )
}

pub type ConfigMsg {
  FormEvent(form.FormEvent(Field))
  Save
  Cancel
}

pub fn init_from_config(config: glebs.OAuth2ClientConfig) {
  let defaults = default_model()
  let get_config_value = fn(field: Field) {
    case field {
      FireflyUrl ->
        config.authorize_url
        |> uri.parse
        |> result.map(uri.origin)
        |> result.flatten
        |> result.unwrap("")
      RedirectUrl -> config.redirect_uri
      ClientId -> config.client_id
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
        form.init_field(FireflyUrl, form.required),
        form.init_field(RedirectUrl, form.required),
        form.init_field(ClientId, form.required),
      ]),
    ),
  )
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
            FireflyUrl ->
              glebs.OAuth2ClientConfig(
                ..conf,
                authorize_url: input_field.value <> "/oauth/authorize",
                token_url: input_field.value <> "/oauth/token",
              )
            RedirectUrl ->
              glebs.OAuth2ClientConfig(..conf, redirect_uri: input_field.value)
            ClientId ->
              glebs.OAuth2ClientConfig(..conf, client_id: input_field.value)
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
            "Firefly URL",
            form.field_value(model.form, FireflyUrl),
            form.handle_on_change(FormEvent, FireflyUrl),
            error: form.field_error(model.form, FireflyUrl),
          ),
          text_input.text_input(
            "Redirect URL",
            form.field_value(model.form, RedirectUrl),
            form.handle_on_change(FormEvent, RedirectUrl),
            error: form.field_error(model.form, RedirectUrl),
          ),
          text_input.text_input(
            "Client ID",
            form.field_value(model.form, ClientId),
            form.handle_on_change(FormEvent, ClientId),
            error: form.field_error(model.form, ClientId),
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
