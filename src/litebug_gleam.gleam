import gleam/dict
import gleam/javascript/promise
import gleam/json
import gleam/option.{None, Some}
import gleam/result
import gleam/uri
import lustre
import lustre/effect
import lustre/element
import modem
import theme

import lustre/event
import plinth/browser/window
import plinth/javascript/storage
import sketch
import sketch/css
import sketch/css/length.{px}
import sketch/lustre as sketch_lustre

import sketch/lustre/element/html

import glebs
import glebs/request as glebs_request

import components/button.{button, link_button}
import style.{text_body}

import model.{
  type Model, type Msg, type Route, ConfigPage, HandleOauthPage, HomePage,
  LoggedInSuccessfully, LoggedOut, Login, LoginPage, Logout, Model, RouteChanged,
}
import pages/config_page
import pages/home_page

pub fn main() {
  let assert Ok(stylesheet) = sketch.stylesheet(sketch.Ephemeral)
  let app = lustre.application(init, update, view(_, stylesheet))
  let assert Ok(_) = lustre.start(app, "#app", Nil)

  Nil
}

fn init(_) -> #(Model, effect.Effect(Msg)) {
  let config = load_config()

  let model =
    Model(
      route: HomePage(home_page.init_model()),
      oauth_config: config,
      token_response: option.None,
    )
    |> load_token
  let current_route = case uri.parse(window.location()) {
    Ok(curr_uri) -> get_route(curr_uri)
    Error(_) -> HomePage(home_page.init_model())
  }

  #(
    Model(..model, route: current_route),
    effect.batch([
      case current_route {
        HandleOauthPage -> check_auth_code_handle(config)
        _ -> effect.none()
      },
      modem.init(on_url_change),
      case model, current_route {
        Model(token_response: Some(_), ..), _
        | Model(token_response: None, ..), HandleOauthPage
        | Model(token_response: None, ..), ConfigPage(_)
        | Model(token_response: None, ..), LoginPage
        -> init_route(current_route)
        Model(token_response: None, ..), _ ->
          modem.replace("/login", None, None)
      },
      case model.token_response, current_route {
        Some(_), _
        | None, HandleOauthPage
        | None, ConfigPage(_)
        | None, LoginPage
        -> init_route(current_route)
        None, _ -> modem.replace("/login", None, None)
      },
    ]),
  )
}

fn on_url_change(uri: uri.Uri) -> Msg {
  let route = get_route(uri)
  RouteChanged(route)
}

fn init_route(route: Route) -> effect.Effect(Msg) {
  effect.from(fn(dispatch) {
    dispatch(RouteChanged(route))
    Nil
  })
}

fn get_route(uri: uri.Uri) -> Route {
  case uri.path_segments(uri.path) {
    [""] -> HomePage(home_page.init_model())
    ["oauth", "handle"] -> HandleOauthPage
    ["login"] -> LoginPage
    ["config"] ->
      ConfigPage(config_page.init_from_config(config_page.default_config()))
    _ -> HomePage(home_page.init_model())
  }
}

fn load_config() -> option.Option(glebs.OAuth2ClientConfig) {
  {
    use local_storage <- result.try(storage.local())

    use config <- result.try(storage.get_item(local_storage, "glebs_config"))

    use config <- result.try(
      json.parse(config, using: config_page.oauth2_client_config_decoder())
      |> result.map_error(fn(error) {
        echo error
        Nil
      }),
    )
    Ok(config)
  }
  |> option.from_result
}

fn load_token(model: Model) -> Model {
  {
    use local_storage <- result.try(storage.local())

    use token <- result.try(storage.get_item(local_storage, "auth_token"))

    use token <- result.try(
      json.parse(token, using: glebs_request.token_resp_decoder())
      |> result.map_error(fn(error) {
        echo error
        Nil
      }),
    )
    Ok(Model(..model, token_response: Some(token)))
  }
  |> result.unwrap(model)
}

fn check_auth_code_handle(
  config: option.Option(glebs.OAuth2ClientConfig),
) -> effect.Effect(Msg) {
  effect.from(fn(dispatch) {
    case config {
      None -> modem.replace("/login", None, None)
      Some(config) -> {
        let _ =
          modem.initial_uri()
          |> result.try(fn(current_uri) {
            case current_uri.query {
              Some(query) -> uri.parse_query(query)
              None -> Error(Nil)
            }
          })
          |> result.map(dict.from_list)
          |> result.try(dict.get(_, "code"))
          |> result.map(try_get_access_token(_, config, dispatch))
          |> result.unwrap(effect.none())
      }
    }

    Nil
  })
}

fn auth_token_to_json(token: glebs.TokenResponse) -> String {
  json.object([
    #("access_token", json.string(token.access_token)),
    #("token_type", json.string(token.token_type)),
    #("expires_in", json.int(token.expires_in)),
    #("refresh_token", json.string(token.refresh_token)),
  ])
  |> json.to_string
}

fn try_get_access_token(
  code: String,
  config: glebs.OAuth2ClientConfig,
  dispatch: fn(Msg) -> Nil,
) -> effect.Effect(Msg) {
  {
    use local_storage <- result.try(storage.local())

    use verifier <- result.try(storage.get_item(local_storage, "glebs_verifier"))

    glebs_request.get_access_token(config, verifier, code)
    |> promise.map(fn(token) {
      case token {
        Ok(token) -> {
          let _ =
            token
            |> auth_token_to_json
            |> storage.set_item(local_storage, "auth_token", _)

          dispatch(LoggedInSuccessfully(token))
          Ok(Nil)
        }
        Error(error) -> {
          echo error
          Ok(Nil)
        }
      }
    })
    |> promise.rescue(fn(_) {
      echo "Error getting access token"
      Ok(Nil)
    })
    |> promise.tap(fn(res) {
      case res {
        Error(e) -> {
          echo e
          Nil
        }
        _ -> Nil
      }
    })

    Ok(effect.none())
  }
  |> result.unwrap(effect.none())
}

fn login(config: glebs.OAuth2ClientConfig) -> effect.Effect(Msg) {
  effect.from(fn(_) {
    glebs_request.create_authorization_request_url(config)
    |> promise.map_try(fn(authorize_url) {
      let _ =
        storage.local()
        |> result.map(storage.set_item(_, "glebs_verifier", authorize_url.1))

      let curr_window = window.self()
      window.set_location(curr_window, uri.to_string(authorize_url.0))

      Ok(Nil)
    })

    Nil
  })
}

fn logout() -> effect.Effect(Msg) {
  effect.from(fn(dispatch) {
    let _ =
      storage.local()
      |> result.map(storage.remove_item(_, "auth_token"))

    dispatch(LoggedOut)
    Nil
  })
}

pub fn handle_route_change(
  model: Model,
  route: Route,
) -> #(Model, effect.Effect(Msg)) {
  case route {
    ConfigPage(_) -> #(
      Model(
        ..model,
        route: ConfigPage(config_page.init_from_config(
          model.oauth_config
          |> option.unwrap(config_page.default_config()),
        )),
      ),
      effect.none(),
    )
    _ -> #(model, effect.none())
  }
}

pub fn update(model: Model, msg: Msg) -> #(Model, effect.Effect(Msg)) {
  case msg, model.route, model {
    RouteChanged(route), _, _ ->
      handle_route_change(Model(..model, route: route), route)

    Login, _, Model(oauth_config: Some(oauth_config), ..) -> #(
      model,
      login(oauth_config),
    )

    LoggedInSuccessfully(token), _, _ -> {
      #(
        Model(..model, token_response: Some(token)),
        modem.replace("/", None, None),
      )
    }

    model.HomePageMsg(home_page.Logout), _, _ -> #(model, logout())
    LoggedOut, _, _ -> #(
      Model(..model, token_response: None),
      modem.replace("/login", None, None),
    )

    model.ConfigPageMsg(msg), model.ConfigPage(config_model), _ -> {
      let #(new_config_model, config_effect) =
        config_page.update(config_model, msg)

      let #(new_model, effect) =
        #(new_config_model, config_effect)
        |> update_with(model, model.ConfigPage, model.ConfigPageMsg)

      case msg {
        config_page.Save -> #(
          Model(..new_model, oauth_config: Some(new_config_model.config)),
          effect,
        )
        _ -> #(new_model, effect)
      }
    }

    // ignore other messages. Occassionally uncomment to check for
    // exhaustiveness
    _, _, _ -> #(model, effect.none())
  }
}

fn update_with(
  update_resp: #(sub_model, effect.Effect(sub_msg)),
  model: Model,
  to_model: fn(sub_model) -> model.Route,
  to_msg: fn(sub_msg) -> Msg,
) -> #(Model, effect.Effect(Msg)) {
  let #(sub_model, effect) = update_resp
  #(Model(..model, route: to_model(sub_model)), effect.map(effect, to_msg))
}

pub fn view(model: Model, stylesheet) {
  case model.route {
    HomePage(home_model) ->
      element.map(
        home_page.home_view(home_model, stylesheet),
        model.HomePageMsg,
      )
    LoginPage -> login_view(model, stylesheet)
    ConfigPage(config_model) ->
      element.map(
        config_page.config_view(config_model, stylesheet),
        model.ConfigPageMsg,
      )
    HandleOauthPage -> handle_oauth_view(model, stylesheet)
  }
}

pub fn login_view(model: Model, stylesheet) {
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
          html.text(case model.oauth_config {
            Some(_) -> "You are configured to log into:"
            None -> "You will need to configure before you can login"
          }),
        ]),
        html.div(text_body(), [], [
          html.text(
            model.oauth_config
            |> option.map(fn(conf) { conf.authorize_url })
            |> option.unwrap(""),
          ),
        ]),
      ]),
      html.div(
        css.class([
          css.display("flex"),
          css.flex_direction("row"),
          css.gap(px(14)),
        ]),
        [],
        [
          button("Login", button.Primary, Some(event.on_click(Login)), [
            button.Disabled(case model.oauth_config {
              Some(_) -> False
              None -> True
            }),
          ]),
          link_button(
            case model.oauth_config {
              Some(_) -> "Change Config"
              None -> "Set Config"
            },
            button.Secondary,
            "/config",
          ),
        ],
      ),
    ],
  )
}

pub fn handle_oauth_view(_model: Model, stylesheet) {
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
          html.text(
            "Trying to get access token. Please
        wait...",
          ),
        ]),
      ]),
    ],
  )
}
//pub fn get_cat() -> effect.Effect(Msg) {
//  swr(Nil, cats.get_cat_promise, fn(result) {
//    case result {
//      FetchResult(data: option.Some(cat), ..) -> ApiReturnedCat(Ok(cat))
//      FetchResult(_, option.Some(error), _) -> ApiReturnedCat(Error(error))
//      FetchResult(_, _, True) -> FetchingCats
//      _ -> ApiReturnedCat(Error("No cat"))
//    }
//  })
//  //effect.from(fn(dispatch) {
//  //  cats.get_cat_promise()
//  //  |> promise.map(fn(cat) { ApiReturnedCat(cat) })
//  //  |> promise.tap(dispatch)
//
//  //  Nil
//  //})
//}

//pub type FetchResult(data, error) {
//  FetchResult(
//    data: option.Option(data),
//    error: option.Option(error),
//    loading: Bool,
//  )
//}
//
//pub fn swr(
//  key: key,
//  fetcher: fn(key) -> promise.Promise(Result(a, b)),
//  wrap_effect: fn(FetchResult(a, b)) -> c,
//) {
//  effect.from(fn(dispatch) {
//    FetchResult(data: option.None, error: option.None, loading: True)
//    |> wrap_effect
//    |> dispatch
//
//    fetcher(key)
//    |> promise.map(fn(p) {
//      case p {
//        Ok(data) ->
//          FetchResult(
//            data: option.Some(data),
//            error: option.None,
//            loading: False,
//          )
//        Error(error) ->
//          FetchResult(
//            data: option.None,
//            error: option.Some(error),
//            loading: False,
//          )
//      }
//    })
//    |> promise.map(wrap_effect)
//    |> promise.tap(dispatch)
//
//    Nil
//  })
//}
//
//pub type FN(a, r) =
//  fn(a) -> r
//
//pub type FnKey(a, r) =
//  #(FN(a, r), a)
//
//fn key_fn(f: FnKey(a, r)) -> r {
//  f.0(f.1)
//}
//
//fn fn_to_test(a: Int) -> String {
//  int.to_string(a)
//}
//
//fn test_key_fn() {
//  key_fn(#(fn_to_test, 1))
//}
