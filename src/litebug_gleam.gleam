import decode/zero
import gleam/dict
import gleam/dynamic
import gleam/int
import gleam/io
import gleam/javascript/promise
import gleam/json
import gleam/list
import gleam/option.{None, Some}
import gleam/result
import gleam/uri
import gleam_community/colour
import lustre
import lustre/attribute
import lustre/effect
import theme

//import lustre/element
//import lustre/element/html
import lustre/event
import plinth/browser/window
import plinth/javascript/storage
import sketch
import sketch/css
import sketch/css/length.{px}
import sketch/lustre as sketch_lustre

import sketch/lustre/element
import sketch/lustre/element/html

import glebs
import glebs/request as glebs_request

import components/button.{button}

import cats.{type Cat}

pub fn main() {
  let assert Ok(stylesheet) = sketch.stylesheet(sketch.Ephemeral)
  let app = lustre.application(init, update, view(_, stylesheet))
  let assert Ok(_) = lustre.start(app, "#app", Nil)

  Nil
}

pub type Model {
  Model(
    count: Int,
    cats: List(Cat),
    fetching: Bool,
    oauth_config: glebs.OAuth2ClientConfig,
    token_response: option.Option(glebs.TokenResponse),
  )
}

fn init(_) -> #(Model, effect.Effect(Msg)) {
  let config =
    glebs.OAuth2ClientConfig(
      client_id: "54",
      authorize_url: "https://firefly.andho.xyz/oauth/authorize",
      token_url: "https://firefly.andho.xyz/oauth/token",
      redirect_uri: "http://localhost:1234/oauth/handle",
      scope: "",
    )
  #(
    Model(0, [], False, config, option.None),
    effect.batch([load_token(), check_auth_code_handle(config)]),
  )
}

fn load_token() -> effect.Effect(Msg) {
  effect.from(fn(dispatch) {
    let _ = {
      use local_storage <- result.try(storage.local())

      use token <- result.try(storage.get_item(local_storage, "auth_token"))

      echo "Loaded token"
      echo token
      use token <- result.try(
        json.parse(token, using: glebs_request.token_resp_decoder())
        |> result.map_error(fn(error) {
          echo error
          Nil
        }),
      )
      echo "Dispatching"
      dispatch(LoggedInSuccessfully(token))
      Ok(Nil)
    }

    Nil
  })
}

pub type Msg {
  Login
  LoggedInSuccessfully(glebs.TokenResponse)
  Logout
  LoggedOut
  Increment
  Decrement
  ApiReturnedCat(Result(Cat, String))
  FetchingCats
}

fn check_auth_code_handle(
  config: glebs.OAuth2ClientConfig,
) -> effect.Effect(Msg) {
  effect.from(fn(dispatch) {
    echo #("location", window.location())
    let a =
      window.location()
      |> uri.parse
      |> result.try(fn(current_uri) {
        case uri.path_segments(current_uri.path) {
          ["oauth", "handle"] -> {
            case current_uri.query {
              Some(query) -> uri.parse_query(query)
              None -> Error(Nil)
            }
          }
          _ -> Error(Nil)
        }
      })
      |> result.map(dict.from_list)
      |> result.try(dict.get(_, "code"))
      |> echo
      |> result.map(try_get_access_token(_, config, dispatch))

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
) -> Nil {
  echo "Trying to get access token"
  let _ = {
    use local_storage <- result.try(storage.local())

    use verifier <- result.try(storage.get_item(local_storage, "glebs_verifier"))

    glebs_request.get_access_token(config, verifier, code)
    |> promise.map(fn(token) {
      case token {
        Ok(token) -> {
          echo token

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

    Ok(Nil)
  }

  Nil
}

fn login(config: glebs.OAuth2ClientConfig) -> effect.Effect(Msg) {
  effect.from(fn(_) {
    glebs_request.create_authorization_request_url(config)
    |> promise.map_try(fn(authorize_url) {
      let curr_window = window.self()

      let _ =
        storage.local()
        |> result.map(storage.set_item(_, "glebs_verifier", authorize_url.1))

      echo authorize_url
      let curr_window = window.self()
      window.set_location(curr_window, uri.to_string(authorize_url.0))

      Ok(Nil)
    })

    Nil
  })
}

fn redirect_to_home() -> effect.Effect(Msg) {
  let curr_window = window.self()
  //window.set_location(curr_window, "/")
  effect.none()
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

pub fn update(model: Model, msg: Msg) -> #(Model, effect.Effect(Msg)) {
  case msg {
    Login -> #(model, login(model.oauth_config))
    LoggedInSuccessfully(token) -> {
      echo "Logged in successfully"
      #(Model(..model, token_response: Some(token)), redirect_to_home())
    }
    Logout -> #(model, logout())
    LoggedOut -> #(Model(..model, token_response: None), effect.none())
    Increment -> #(Model(..model, count: model.count + 1), get_cat())
    Decrement -> #(Model(..model, count: model.count - 1), effect.none())
    ApiReturnedCat(Ok(cat)) -> {
      echo cat
      #(
        Model(..model, cats: [cat, ..model.cats], fetching: False),
        effect.none(),
      )
    }
    ApiReturnedCat(Error(error)) -> {
      echo error
      #(Model(..model, fetching: False), effect.none())
    }
    FetchingCats -> #(Model(..model, fetching: True), effect.none())
  }
}

pub fn view(model: Model, stylesheet) {
  case model.token_response {
    Some(_) -> home_view(model, stylesheet)
    None -> login_view(model, stylesheet)
  }
}

pub fn text_body() {
  css.class([css.color(theme.color(theme.Text))])
}

pub fn login_view(model: Model, stylesheet) {
  use <- sketch_lustre.render(stylesheet, [sketch_lustre.node()])

  let count = int.to_string(model.count)
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
        html.div(text_body(), [], [html.text("You are configured to log into:")]),
        html.div(text_body(), [], [html.text(model.oauth_config.authorize_url)]),
      ]),
      html.div(
        css.class([
          css.display("flex"),
          css.flex_direction("row"),
          css.gap(px(14)),
        ]),
        [],
        [
          button("Login", button.Primary, Some(event.on_click(Login))),
          button("Change Config", button.Secondary, Some(event.on_click(Login))),
        ],
      ),
    ],
  )
}

pub fn home_view(model: Model, stylesheet) {
  use <- sketch_lustre.render(stylesheet, [sketch_lustre.node()])

  let count = int.to_string(model.count)
  html.div(css.class([]), [], [
    html.div(css.class([]), [], [
      button("Logout", button.Primary, Some(event.on_click(Logout))),
    ]),
    html.button(css.class([]), [event.on_click(Decrement)], [
      element.text("Decrement"),
    ]),
    html.text(count),
    html.button(css.class([]), [event.on_click(Increment)], [
      element.text("Increment"),
    ]),
    {
      case model.fetching {
        True -> element.text("Fetching cats...")
        False -> element.none()
      }
    },
    element.keyed(
      html.div(css.class([]), [], _),
      list.map(model.cats, fn(cat) {
        #(
          cat.id,
          html.img(css.class([]), [
            attribute.src(cat.url),
            attribute.width(400),
            attribute.height(400),
          ]),
        )
      }),
    ),
  ])
}

pub fn get_cat() -> effect.Effect(Msg) {
  swr(Nil, cats.get_cat_promise, fn(result) {
    case result {
      FetchResult(data: option.Some(cat), ..) -> ApiReturnedCat(Ok(cat))
      FetchResult(_, option.Some(error), _) -> ApiReturnedCat(Error(error))
      FetchResult(_, _, True) -> FetchingCats
      _ -> ApiReturnedCat(Error("No cat"))
    }
  })
  //effect.from(fn(dispatch) {
  //  cats.get_cat_promise()
  //  |> promise.map(fn(cat) { ApiReturnedCat(cat) })
  //  |> promise.tap(dispatch)

  //  Nil
  //})
}

pub type FetchResult(data, error) {
  FetchResult(
    data: option.Option(data),
    error: option.Option(error),
    loading: Bool,
  )
}

pub fn swr(
  key: key,
  fetcher: fn(key) -> promise.Promise(Result(a, b)),
  wrap_effect: fn(FetchResult(a, b)) -> c,
) {
  effect.from(fn(dispatch) {
    FetchResult(data: option.None, error: option.None, loading: True)
    |> wrap_effect
    |> dispatch

    fetcher(key)
    |> promise.map(fn(p) {
      case p {
        Ok(data) ->
          FetchResult(
            data: option.Some(data),
            error: option.None,
            loading: False,
          )
        Error(error) ->
          FetchResult(
            data: option.None,
            error: option.Some(error),
            loading: False,
          )
      }
    })
    |> promise.map(wrap_effect)
    |> promise.tap(dispatch)

    Nil
  })
}

pub type FN(a, r) =
  fn(a) -> r

pub type FnKey(a, r) =
  #(FN(a, r), a)

fn key_fn(f: FnKey(a, r)) -> r {
  f.0(f.1)
}

fn fn_to_test(a: Int) -> String {
  int.to_string(a)
}

fn test_key_fn() {
  key_fn(#(fn_to_test, 1))
}
